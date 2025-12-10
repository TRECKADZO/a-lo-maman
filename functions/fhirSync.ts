import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Service de synchronisation FHIR bidirectionnel
 * Gère la création/mise à jour des ressources FHIR Observation et Appointment
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized',
        details: 'Authentication required'
      }, { status: 401 });
    }

    const { action, resourceType, data } = await req.json();

    console.log(`[FHIR Sync] Action: ${action}, Resource: ${resourceType}`, {
      user: user.email,
      timestamp: new Date().toISOString()
    });

    switch (action) {
      case 'createObservation':
        return await createObservation(base44, data);
      
      case 'updateObservation':
        return await updateObservation(base44, data);
      
      case 'syncAppointment':
        return await syncAppointment(base44, data);
      
      case 'syncVitals':
        return await syncVitals(base44, user, data);
      
      case 'syncGrowth':
        return await syncGrowth(base44, data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[FHIR Sync] Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      error: 'Sync failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});

// Créer une observation FHIR
async function createObservation(base44, data) {
  const { FHIRMapper } = await import('../components/interop/FHIRMapper.jsx');
  
  const { patientRef, vitals, enfantId } = data;
  
  let observations;
  if (vitals) {
    observations = FHIRMapper.toFHIRObservationVitals(vitals, patientRef);
  } else if (data.mesure && enfantId) {
    observations = FHIRMapper.toFHIRObservationCroissance(data.mesure, enfantId);
  } else {
    throw new Error('Invalid observation data');
  }

  const createdResources = [];
  
  for (const obs of observations) {
    const resource = await base44.asServiceRole.entities.RessourceFHIR.create({
      resource_type: 'Observation',
      fhir_id: obs.id,
      version: 'R4',
      patient_email: data.patient_email,
      enfant_id: enfantId,
      grossesse_id: data.grossesse_id,
      resource_json: obs,
      source_system: 'AloMaman',
      last_updated: new Date().toISOString(),
      status: 'active',
      sync_status: 'synced'
    });
    
    createdResources.push(resource);
    
    console.log('[FHIR Sync] Observation created:', {
      fhir_id: obs.id,
      code: obs.code.coding[0].code,
      patient: data.patient_email
    });
  }

  return Response.json({ 
    success: true,
    resources: createdResources,
    count: createdResources.length
  });
}

// Mettre à jour une observation FHIR
async function updateObservation(base44, data) {
  const { fhir_id, updates } = data;
  
  const existing = await base44.asServiceRole.entities.RessourceFHIR.filter({
    fhir_id,
    resource_type: 'Observation'
  });

  if (!existing || existing.length === 0) {
    throw new Error(`Observation ${fhir_id} not found`);
  }

  const resource = existing[0];
  const updatedResource = {
    ...resource.resource_json,
    ...updates,
    meta: {
      ...resource.resource_json.meta,
      lastUpdated: new Date().toISOString()
    }
  };

  const updated = await base44.asServiceRole.entities.RessourceFHIR.update(resource.id, {
    resource_json: updatedResource,
    last_updated: new Date().toISOString(),
    sync_status: 'synced'
  });

  console.log('[FHIR Sync] Observation updated:', {
    fhir_id,
    resource_id: resource.id
  });

  return Response.json({ 
    success: true,
    resource: updated
  });
}

// Synchroniser un rendez-vous FHIR
async function syncAppointment(base44, data) {
  const { FHIRMapper } = await import('../components/interop/FHIRMapper.jsx');
  
  const { rdv, professionnelId, patientEmail, direction } = data;

  if (direction === 'to_fhir') {
    // AloMaman → FHIR
    const fhirAppointment = FHIRMapper.toFHIRAppointment(rdv, professionnelId, patientEmail);
    
    const existing = await base44.asServiceRole.entities.RessourceFHIR.filter({
      resource_type: 'Appointment',
      'resource_json.id': rdv.id
    });

    let resource;
    if (existing && existing.length > 0) {
      // Update existing
      resource = await base44.asServiceRole.entities.RessourceFHIR.update(existing[0].id, {
        resource_json: fhirAppointment,
        last_updated: new Date().toISOString(),
        sync_status: 'synced'
      });
      
      console.log('[FHIR Sync] Appointment updated (to FHIR):', {
        rdv_id: rdv.id,
        fhir_id: fhirAppointment.id
      });
    } else {
      // Create new
      resource = await base44.asServiceRole.entities.RessourceFHIR.create({
        resource_type: 'Appointment',
        fhir_id: fhirAppointment.id,
        version: 'R4',
        patient_email: patientEmail,
        resource_json: fhirAppointment,
        source_system: 'AloMaman',
        last_updated: new Date().toISOString(),
        status: 'active',
        sync_status: 'synced'
      });
      
      console.log('[FHIR Sync] Appointment created (to FHIR):', {
        rdv_id: rdv.id,
        fhir_id: fhirAppointment.id
      });
    }

    return Response.json({ 
      success: true,
      direction: 'to_fhir',
      resource
    });
  } else if (direction === 'from_fhir') {
    // FHIR → AloMaman
    const { fhirAppointment } = data;
    const rdvData = FHIRMapper.fromFHIRAppointment(fhirAppointment);
    
    // Check if RDV already exists
    const existingRdv = await base44.asServiceRole.entities.RendezVous.filter({
      id: fhirAppointment.id
    });

    let rendezVous;
    if (existingRdv && existingRdv.length > 0) {
      // Update existing RDV
      rendezVous = await base44.asServiceRole.entities.RendezVous.update(existingRdv[0].id, rdvData);
      
      console.log('[FHIR Sync] RendezVous updated (from FHIR):', {
        rdv_id: existingRdv[0].id,
        fhir_id: fhirAppointment.id
      });
    } else {
      // Create new RDV
      rendezVous = await base44.asServiceRole.entities.RendezVous.create({
        ...rdvData,
        created_by: patientEmail,
        professionnel_id: professionnelId || null
      });
      
      console.log('[FHIR Sync] RendezVous created (from FHIR):', {
        rdv_id: rendezVous.id,
        fhir_id: fhirAppointment.id
      });
    }

    return Response.json({ 
      success: true,
      direction: 'from_fhir',
      rendezVous
    });
  } else {
    throw new Error('Invalid sync direction. Must be "to_fhir" or "from_fhir"');
  }
}

// Synchroniser données vitales (tension, poids, température)
async function syncVitals(base44, user, data) {
  const { grossesse_id, vitals } = data;
  
  // Enregistrer dans SuiviGrossesse
  const grossesse = await base44.asServiceRole.entities.SuiviGrossesse.filter({ id: grossesse_id });
  if (!grossesse || grossesse.length === 0) {
    throw new Error('Grossesse not found');
  }

  const consultations = grossesse[0].consultations || [];
  consultations.push({
    date: vitals.date,
    tension_arterielle: vitals.tension_systolique && vitals.tension_diastolique 
      ? `${vitals.tension_systolique}/${vitals.tension_diastolique}` 
      : null,
    poids: vitals.poids,
    temperature: vitals.temperature,
    frequence_cardiaque: vitals.frequence_cardiaque,
    type: 'donnees_vitales'
  });

  await base44.asServiceRole.entities.SuiviGrossesse.update(grossesse_id, { consultations });

  // Créer ressources FHIR Observation
  await createObservation(base44, {
    patientRef: `Patient/${user.id}`,
    patient_email: user.email,
    grossesse_id,
    vitals
  });

  console.log('[FHIR Sync] Vitals synced:', {
    grossesse_id,
    user: user.email,
    vitals_count: Object.keys(vitals).length
  });

  return Response.json({ 
    success: true,
    message: 'Vitals synchronized successfully'
  });
}

// Synchroniser mesures de croissance bébé
async function syncGrowth(base44, data) {
  const { enfant_id, mesure } = data;
  
  const enfant = await base44.asServiceRole.entities.EnfantCarnet.filter({ id: enfant_id });
  if (!enfant || enfant.length === 0) {
    throw new Error('Enfant not found');
  }

  const mesures_croissance = enfant[0].mesures_croissance || [];
  mesures_croissance.push(mesure);

  await base44.asServiceRole.entities.EnfantCarnet.update(enfant_id, { mesures_croissance });

  // Créer ressources FHIR Observation
  await createObservation(base44, {
    patient_email: enfant[0].created_by,
    enfant_id,
    mesure
  });

  console.log('[FHIR Sync] Growth synced:', {
    enfant_id,
    mesure_date: mesure.date
  });

  return Response.json({ 
    success: true,
    message: 'Growth measurements synchronized successfully'
  });
}