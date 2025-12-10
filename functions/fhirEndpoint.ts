import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Endpoint FHIR pour l'intégration avec les systèmes hospitaliers
 * Supporte les opérations CRUD sur les ressources FHIR Patient, Observation, Appointment
 */
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // Authentification via API Key
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return Response.json({ 
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'security',
          diagnostics: 'API Key required'
        }]
      }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    // GET /fhir/Patient/:id
    if (method === 'GET' && path[1] === 'Patient') {
      const patientId = path[2];
      
      const fhirResources = await base44.asServiceRole.entities.RessourceFHIR.filter({
        fhir_id: patientId,
        resource_type: 'Patient'
      });

      if (fhirResources.length === 0) {
        return Response.json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: 'Patient not found'
          }]
        }, { status: 404 });
      }

      return Response.json(fhirResources[0].resource_json, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    // POST /fhir/Patient
    if (method === 'POST' && path[1] === 'Patient') {
      const patientResource = await req.json();
      
      // Valider ressource FHIR
      if (patientResource.resourceType !== 'Patient') {
        return Response.json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid Patient resource'
          }]
        }, { status: 400 });
      }

      // Stocker dans AloMaman
      const saved = await base44.asServiceRole.entities.RessourceFHIR.create({
        resource_type: 'Patient',
        fhir_id: patientResource.id || crypto.randomUUID(),
        version: 'R4',
        resource_json: patientResource,
        source_system: 'external',
        last_updated: new Date().toISOString(),
        status: 'active',
        sync_status: 'synced'
      });

      return Response.json(saved.resource_json, {
        status: 201,
        headers: { 
          'Content-Type': 'application/fhir+json',
          'Location': `/fhir/Patient/${saved.fhir_id}`
        }
      });
    }

    // GET /fhir/Observation
    if (method === 'GET' && path[1] === 'Observation') {
      const patientId = url.searchParams.get('patient');
      
      const query = {
        resource_type: 'Observation'
      };
      
      if (patientId) {
        query.patient_email = patientId;
      }

      const observations = await base44.asServiceRole.entities.RessourceFHIR.filter(query);

      return Response.json({
        resourceType: 'Bundle',
        type: 'searchset',
        total: observations.length,
        entry: observations.map(obs => ({
          resource: obs.resource_json
        }))
      }, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    // GET /fhir/Appointment
    if (method === 'GET' && path[1] === 'Appointment') {
      const appointments = await base44.asServiceRole.entities.RessourceFHIR.filter({
        resource_type: 'Appointment'
      });

      return Response.json({
        resourceType: 'Bundle',
        type: 'searchset',
        total: appointments.length,
        entry: appointments.map(apt => ({
          resource: apt.resource_json
        }))
      }, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    }

    // Endpoint non supporté
    return Response.json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-supported',
        diagnostics: 'Endpoint not supported'
      }]
    }, { status: 404 });

  } catch (error) {
    console.error('FHIR Endpoint error:', error);
    return Response.json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    }, { status: 500 });
  }
});