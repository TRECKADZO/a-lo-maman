import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Service d'interopérabilité HL7 FHIR R4
 * Permet l'échange standardisé de données avec systèmes de santé externes
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resourceType, data, externalSystemUrl, patientId } = await req.json();

    switch (action) {
      case 'export_patient':
        return await exportPatientToFHIR(base44, patientId, user);
      
      case 'import_observation':
        return await importObservationFromFHIR(base44, data, user);
      
      case 'sync_appointment':
        return await syncAppointmentToFHIR(base44, data, externalSystemUrl, user);
      
      case 'fetch_lab_results':
        return await fetchLabResultsFromFHIR(base44, patientId, externalSystemUrl, user);
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('FHIR Interop Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Export patient en ressource FHIR Patient
async function exportPatientToFHIR(base44, enfantId, user) {
  const enfant = await base44.asServiceRole.entities.EnfantCarnet.filter({ id: enfantId });
  if (!enfant[0]) {
    return Response.json({ error: 'Enfant not found' }, { status: 404 });
  }

  const child = enfant[0];
  const fhirPatient = {
    resourceType: 'Patient',
    id: child.id,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      lastUpdated: child.updated_date
    },
    identifier: [
      {
        system: 'http://alomaman.ci/patient-id',
        value: child.id
      }
    ],
    name: [
      {
        use: 'official',
        family: child.nom || '',
        given: [child.prenom]
      }
    ],
    gender: child.sexe === 'masculin' ? 'male' : 'female',
    birthDate: child.date_naissance,
    telecom: child.created_by ? [
      {
        system: 'email',
        value: child.created_by,
        use: 'home'
      }
    ] : [],
    extension: [
      {
        url: 'http://alomaman.ci/fhir/extension/numero-cmu',
        valueString: child.numero_cmu || child.identifiant_provisoire
      },
      {
        url: 'http://alomaman.ci/fhir/extension/groupe-sanguin',
        valueString: child.groupe_sanguin
      }
    ]
  };

  return Response.json({
    success: true,
    fhirResource: fhirPatient,
    message: 'Patient exported to FHIR format'
  });
}

// Import observation (résultats labo, mesures) depuis FHIR
async function importObservationFromFHIR(base44, fhirObservation, user) {
  // Validation FHIR
  if (fhirObservation.resourceType !== 'Observation') {
    return Response.json({ error: 'Invalid FHIR Observation resource' }, { status: 400 });
  }

  const observation = {
    patient_email: user.email,
    type_donnee: mapFHIRCodeToType(fhirObservation.code),
    valeur: fhirObservation.valueQuantity?.value || 0,
    unite: fhirObservation.valueQuantity?.unit || '',
    source: 'appareil_medical',
    appareil_nom: fhirObservation.device?.display || 'Système externe FHIR',
    notes: fhirObservation.note?.[0]?.text || '',
    created_date: fhirObservation.effectiveDateTime || new Date().toISOString()
  };

  const created = await base44.asServiceRole.entities.DonneesVitales.create(observation);

  return Response.json({
    success: true,
    observation: created,
    message: 'Observation imported from FHIR'
  });
}

// Sync RDV avec système externe via FHIR Appointment
async function syncAppointmentToFHIR(base44, rdvData, externalUrl, user) {
  const rdv = await base44.asServiceRole.entities.RendezVous.filter({ id: rdvData.rdv_id });
  if (!rdv[0]) {
    return Response.json({ error: 'RDV not found' }, { status: 404 });
  }

  const appointment = rdv[0];
  const professionnel = await base44.asServiceRole.entities.Professionnel.filter({ 
    id: appointment.professionnel_id 
  });

  const fhirAppointment = {
    resourceType: 'Appointment',
    id: appointment.id,
    status: mapStatusToFHIR(appointment.statut),
    serviceType: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-type',
            code: mapSpecialiteToServiceType(professionnel[0]?.specialite),
            display: professionnel[0]?.specialite
          }
        ]
      }
    ],
    appointmentType: {
      coding: [
        {
          system: 'http://alomaman.ci/appointment-type',
          code: appointment.type_consultation,
          display: appointment.type_consultation
        }
      ]
    },
    reasonCode: [
      {
        text: appointment.motif || 'Consultation prénatale'
      }
    ],
    start: appointment.date_rdv,
    participant: [
      {
        actor: {
          reference: `Patient/${user.email}`,
          display: user.full_name
        },
        status: 'accepted'
      },
      {
        actor: {
          reference: `Practitioner/${appointment.professionnel_id}`,
          display: professionnel[0]?.nom_complet
        },
        status: 'accepted'
      }
    ]
  };

  // Si URL externe fournie, POST vers système distant
  if (externalUrl) {
    const response = await fetch(`${externalUrl}/Appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(fhirAppointment)
    });

    if (!response.ok) {
      throw new Error(`External FHIR server error: ${response.statusText}`);
    }

    const externalResource = await response.json();
    
    // Mettre à jour le RDV local avec ID externe
    await base44.asServiceRole.entities.RendezVous.update(appointment.id, {
      notes_professionnel: `FHIR ID: ${externalResource.id}`
    });
  }

  return Response.json({
    success: true,
    fhirAppointment,
    message: 'Appointment synced to FHIR'
  });
}

// Récupérer résultats labo depuis système FHIR externe
async function fetchLabResultsFromFHIR(base44, patientId, externalUrl, user) {
  if (!externalUrl) {
    return Response.json({ error: 'External URL required' }, { status: 400 });
  }

  // Query FHIR: GET /Observation?patient=X&category=laboratory
  const response = await fetch(
    `${externalUrl}/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=50`,
    {
      headers: {
        'Accept': 'application/fhir+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`FHIR server error: ${response.statusText}`);
  }

  const bundle = await response.json();
  const observations = bundle.entry?.map(e => e.resource) || [];

  // Importer dans DonneesVitales
  const imported = [];
  for (const obs of observations) {
    try {
      const created = await base44.asServiceRole.entities.DonneesVitales.create({
        patient_email: user.email,
        type_donnee: mapFHIRCodeToType(obs.code),
        valeur: obs.valueQuantity?.value || 0,
        unite: obs.valueQuantity?.unit || '',
        source: 'appareil_medical',
        appareil_nom: 'Laboratoire externe (FHIR)',
        notes: `LOINC: ${obs.code?.coding?.[0]?.code}`,
        created_date: obs.effectiveDateTime
      });
      imported.push(created);
    } catch (err) {
      console.error('Error importing observation:', err);
    }
  }

  return Response.json({
    success: true,
    imported: imported.length,
    observations: imported,
    message: `${imported.length} lab results imported from FHIR`
  });
}

// Helpers
function mapStatusToFHIR(status) {
  const mapping = {
    'planifie': 'proposed',
    'confirme': 'booked',
    'en_cours': 'arrived',
    'termine': 'fulfilled',
    'annule': 'cancelled'
  };
  return mapping[status] || 'proposed';
}

function mapSpecialiteToServiceType(specialite) {
  const mapping = {
    'gynecologie': '76',
    'pediatrie': '78',
    'sage_femme': '310',
    'medecin_generaliste': '1',
    'nutritionniste': '269'
  };
  return mapping[specialite] || '1';
}

function mapFHIRCodeToType(codeableConcept) {
  const code = codeableConcept?.coding?.[0]?.code;
  
  // Mapping LOINC communs
  const mapping = {
    '8480-6': 'pression_arterielle', // Systolic BP
    '8867-4': 'frequence_cardiaque', // Heart rate
    '8310-5': 'temperature', // Body temperature
    '2339-0': 'glucose', // Glucose
    '29463-7': 'poids', // Body weight
    '2708-6': 'saturation_oxygene' // Oxygen saturation
  };
  
  return mapping[code] || 'glucose';
}