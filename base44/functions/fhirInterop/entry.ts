import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Fonction d'interopérabilité HL7 FHIR R4/R5
 * Permet l'échange standardisé de données de santé avec systèmes externes
 * 
 * Endpoints:
 * - GET /fhir/Patient/:id - Récupérer un patient FHIR
 * - POST /fhir/Observation - Créer une observation FHIR
 * - GET /fhir/Appointment/:id - Récupérer un RDV FHIR
 * - POST /fhir/DocumentReference - Créer une référence document
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const method = req.method;

    // GET /fhir/Patient/:email
    if (method === 'GET' && path[2] === 'Patient') {
      const email = decodeURIComponent(path[3]);
      
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Récupérer profil maman ou professionnel
      const [profilsMaman, profilsPro] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: email }),
        base44.entities.Professionnel.filter({ email: email })
      ]);

      const profil = profilsMaman[0] || profilsPro[0];
      
      if (!profil) {
        return Response.json({ error: 'Patient not found' }, { status: 404 });
      }

      // Convertir en ressource FHIR Patient
      const fhirPatient = {
        resourceType: 'Patient',
        id: email,
        meta: {
          versionId: '1',
          lastUpdated: profil.updated_date || new Date().toISOString()
        },
        identifier: [
          {
            use: 'official',
            system: 'https://alomaman.ci/patient-id',
            value: email
          }
        ],
        active: true,
        name: [
          {
            use: 'official',
            family: profil.nom_complet?.split(' ').slice(-1)[0] || '',
            given: profil.nom_complet?.split(' ').slice(0, -1) || []
          }
        ],
        telecom: [
          {
            system: 'email',
            value: email,
            use: 'home'
          }
        ],
        gender: profil.sexe === 'feminin' ? 'female' : 'male',
        birthDate: profil.date_naissance || null,
        address: profil.region ? [
          {
            use: 'home',
            city: profil.ville || '',
            district: profil.region,
            country: 'CI'
          }
        ] : []
      };

      return Response.json(fhirPatient, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    // POST /fhir/Observation - Créer une observation (résultat labo, mesure vitale)
    if (method === 'POST' && path[2] === 'Observation') {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const fhirObservation = await req.json();
      
      // Convertir FHIR Observation vers ResultatLaboratoire
      const resultat = {
        patient_email: fhirObservation.subject?.reference?.split('/')[1] || '',
        code_loinc: fhirObservation.code?.coding?.find(c => c.system?.includes('loinc'))?.code || '',
        nom_test: fhirObservation.code?.text || fhirObservation.code?.coding?.[0]?.display || '',
        valeur: fhirObservation.valueQuantity?.value?.toString() || fhirObservation.valueString || '',
        valeur_numerique: fhirObservation.valueQuantity?.value || null,
        unite: fhirObservation.valueQuantity?.unit || '',
        date_prelevement: fhirObservation.effectiveDateTime || new Date().toISOString(),
        date_resultat: new Date().toISOString(),
        statut_resultat: fhirObservation.status || 'final',
        fhir_observation_id: fhirObservation.id || null
      };

      const created = await base44.asServiceRole.entities.ResultatLaboratoire.create(resultat);

      return Response.json({
        resourceType: 'Observation',
        id: created.id,
        status: 'final',
        code: fhirObservation.code,
        subject: fhirObservation.subject,
        effectiveDateTime: resultat.date_prelevement,
        valueQuantity: {
          value: resultat.valeur_numerique,
          unit: resultat.unite
        }
      }, {
        status: 201,
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    // GET /fhir/Appointment/:id
    if (method === 'GET' && path[2] === 'Appointment') {
      const rdvId = path[3];
      
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const rdv = await base44.entities.RendezVous.filter({ id: rdvId });
      
      if (!rdv || rdv.length === 0) {
        return Response.json({ error: 'Appointment not found' }, { status: 404 });
      }

      const rdvData = rdv[0];

      // Convertir en FHIR Appointment
      const fhirAppointment = {
        resourceType: 'Appointment',
        id: rdvData.id,
        status: rdvData.statut === 'planifie' ? 'booked' : 
                rdvData.statut === 'confirme' ? 'booked' : 
                rdvData.statut === 'annule' ? 'cancelled' : 
                rdvData.statut === 'termine' ? 'fulfilled' : 'booked',
        serviceType: [
          {
            coding: [
              {
                system: 'https://alomaman.ci/consultation-type',
                code: rdvData.type_consultation,
                display: rdvData.type_consultation
              }
            ]
          }
        ],
        appointmentType: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0276',
              code: 'ROUTINE',
              display: 'Routine appointment'
            }
          ]
        },
        reasonCode: rdvData.motif ? [
          {
            text: rdvData.motif
          }
        ] : [],
        description: rdvData.motif || '',
        start: rdvData.date_rdv,
        end: rdvData.date_rdv, // TODO: ajouter durée
        created: rdvData.created_date,
        comment: rdvData.notes_patient || '',
        participant: [
          {
            actor: {
              reference: `Practitioner/${rdvData.professionnel_id}`,
              display: 'Professionnel de santé'
            },
            required: 'required',
            status: 'accepted'
          },
          {
            actor: {
              reference: `Patient/${rdvData.created_by}`,
              display: 'Patient'
            },
            required: 'required',
            status: 'accepted'
          }
        ]
      };

      return Response.json(fhirAppointment, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    return Response.json({
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /fhir/Patient/:email',
        'POST /fhir/Observation',
        'GET /fhir/Appointment/:id',
        'POST /fhir/DocumentReference'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('Erreur FHIR:', error);
    return Response.json({ 
      error: error.message,
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    }, { status: 500 });
  }
});