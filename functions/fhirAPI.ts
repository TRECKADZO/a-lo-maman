import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * API HL7 FHIR (R4) pour A'lo Maman
 * Endpoints conformes FHIR pour interopérabilité avec systèmes externes
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Authentification requise
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // POST /fhir/Patient - Créer ou récupérer une ressource Patient FHIR
    if (path.includes('/Patient') && method === 'POST') {
      const body = await req.json();
      const { patient_email, entity_type, entity_id } = body;

      // Récupérer les données patient selon le type
      let patientData;
      if (entity_type === 'SuiviGrossesse') {
        const grossesse = await base44.asServiceRole.entities.SuiviGrossesse.filter({ id: entity_id });
        if (grossesse.length === 0) {
          return Response.json({ error: 'Entity not found' }, { status: 404 });
        }
        patientData = grossesse[0];
      } else if (entity_type === 'EnfantCarnet') {
        const enfant = await base44.asServiceRole.entities.EnfantCarnet.filter({ id: entity_id });
        if (enfant.length === 0) {
          return Response.json({ error: 'Entity not found' }, { status: 404 });
        }
        patientData = enfant[0];
      }

      // Construire ressource FHIR Patient
      const fhirPatient = {
        resourceType: 'Patient',
        id: entity_id,
        meta: {
          versionId: '1',
          lastUpdated: new Date().toISOString(),
          source: 'https://alomaman.ci',
          profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
        },
        identifier: [
          {
            system: 'https://alomaman.ci/patient',
            value: entity_id
          }
        ],
        name: [
          {
            use: 'official',
            text: entity_type === 'EnfantCarnet' 
              ? `${patientData.prenom} ${patientData.nom}` 
              : patient_email,
            family: patientData.nom || '',
            given: [patientData.prenom || '']
          }
        ],
        gender: entity_type === 'EnfantCarnet' 
          ? (patientData.sexe === 'masculin' ? 'male' : 'female')
          : 'unknown',
        birthDate: entity_type === 'EnfantCarnet' 
          ? patientData.date_naissance 
          : patientData.date_derniere_regle,
        contact: [
          {
            relationship: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                    code: 'C'
                  }
                ]
              }
            ],
            telecom: [
              {
                system: 'email',
                value: patient_email
              }
            ]
          }
        ]
      };

      // Sauvegarder la ressource FHIR
      const fhirResource = await base44.asServiceRole.entities.FHIRResource.create({
        resource_type: 'Patient',
        fhir_id: entity_id,
        entity_type,
        entity_id,
        patient_email,
        fhir_json: fhirPatient,
        version: 'R4',
        last_sync: new Date().toISOString()
      });

      return Response.json(fhirPatient, { status: 201 });
    }

    // POST /fhir/Appointment - Créer une ressource Appointment
    if (path.includes('/Appointment') && method === 'POST') {
      const body = await req.json();
      const { rdv_id } = body;

      const rdv = await base44.asServiceRole.entities.RendezVous.filter({ id: rdv_id });
      if (rdv.length === 0) {
        return Response.json({ error: 'Appointment not found' }, { status: 404 });
      }

      const rdvData = rdv[0];

      const fhirAppointment = {
        resourceType: 'Appointment',
        id: rdv_id,
        meta: {
          versionId: '1',
          lastUpdated: new Date().toISOString(),
          source: 'https://alomaman.ci'
        },
        status: rdvData.statut === 'planifie' ? 'booked' : rdvData.statut === 'confirme' ? 'fulfilled' : 'cancelled',
        serviceType: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/service-type',
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
              code: rdvData.type_consultation === 'visio' ? 'FOLLOWUP' : 'ROUTINE'
            }
          ]
        },
        reasonCode: [
          {
            text: rdvData.motif
          }
        ],
        start: rdvData.date_rdv,
        minutesDuration: 30,
        participant: [
          {
            actor: {
              reference: `Patient/${rdvData.created_by}`
            },
            required: 'required',
            status: 'accepted'
          },
          {
            actor: {
              reference: `Practitioner/${rdvData.professionnel_id}`
            },
            required: 'required',
            status: 'accepted'
          }
        ]
      };

      await base44.asServiceRole.entities.FHIRResource.create({
        resource_type: 'Appointment',
        fhir_id: rdv_id,
        entity_type: 'RendezVous',
        entity_id: rdv_id,
        patient_email: rdvData.created_by,
        fhir_json: fhirAppointment,
        version: 'R4',
        last_sync: new Date().toISOString()
      });

      return Response.json(fhirAppointment, { status: 201 });
    }

    // GET /fhir/Patient/:id - Récupérer ressource Patient
    if (path.includes('/Patient/') && method === 'GET') {
      const patientId = path.split('/').pop();
      const resource = await base44.asServiceRole.entities.FHIRResource.filter({
        resource_type: 'Patient',
        entity_id: patientId
      });

      if (resource.length === 0) {
        return Response.json({ error: 'Patient not found' }, { status: 404 });
      }

      return Response.json(resource[0].fhir_json, { status: 200 });
    }

    return Response.json({ 
      message: 'A\'lo Maman FHIR API R4',
      endpoints: [
        'POST /fhir/Patient',
        'POST /fhir/Appointment',
        'GET /fhir/Patient/:id',
        'GET /fhir/Appointment/:id'
      ]
    });

  } catch (error) {
    console.error('FHIR API Error:', error);
    return Response.json({ 
      error: error.message,
      operationOutcome: {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error.message
          }
        ]
      }
    }, { status: 500 });
  }
});