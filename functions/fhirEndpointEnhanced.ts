import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * FHIR R4 Endpoint - Enhanced
 * Support: Patient, Practitioner, Organization, Encounter, Observation, Appointment, Immunization
 * Sécurisé avec vérification de rôles et scopes
 * 
 * Endpoints:
 * - GET    /fhir/{resourceType}/{id}         - Read resource
 * - GET    /fhir/{resourceType}?params       - Search resources
 * - POST   /fhir/{resourceType}              - Create resource
 * - PUT    /fhir/{resourceType}/{id}         - Update resource
 * - DELETE /fhir/{resourceType}/{id}         - Delete resource (soft)
 */

const SUPPORTED_RESOURCES = [
  'Patient', 
  'Practitioner', 
  'Organization', 
  'Encounter',
  'Observation', 
  'Appointment', 
  'Immunization'
];

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // Extract resource type and ID
    const resourceType = path[1];
    const resourceId = path[2];

    // Authentification
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return fhirError('security', 'Authorization header required', 401);
    }

    // Initialiser Base44 client
    const base44 = createClientFromRequest(req);

    // Vérifier la clé API et récupérer la clinique associée
    const cliniques = await base44.asServiceRole.entities.Clinique.filter({
      api_key: apiKey,
      api_fhir_enabled: true
    });

    if (cliniques.length === 0) {
      return fhirError('security', 'Invalid API key or FHIR not enabled', 401);
    }

    const clinique = cliniques[0];

    // Vérifier les scopes pour cette opération
    const requiredScope = getRequiredScope(resourceType, method);
    const cliniqueScopes = clinique.api_scopes || [];
    
    if (!cliniqueScopes.includes(requiredScope) && !cliniqueScopes.includes('fhir:*')) {
      return fhirError('forbidden', `Missing required scope: ${requiredScope}`, 403);
    }

    // Log de l'accès (audit trail)
    console.log('[FHIR] Access:', {
      method,
      resourceType,
      resourceId,
      clinique: clinique.nom,
      timestamp: new Date().toISOString()
    });

    // Vérifier que le type de ressource est supporté
    if (!SUPPORTED_RESOURCES.includes(resourceType)) {
      return fhirError('not-supported', `Resource type ${resourceType} not supported`, 404);
    }

    // Router vers les handlers appropriés
    switch (method) {
      case 'GET':
        return resourceId 
          ? await handleRead(base44, resourceType, resourceId, clinique)
          : await handleSearch(base44, resourceType, url.searchParams, clinique);
      
      case 'POST':
        return await handleCreate(base44, resourceType, await req.json(), clinique);
      
      case 'PUT':
        return await handleUpdate(base44, resourceType, resourceId, await req.json(), clinique);
      
      case 'DELETE':
        return await handleDelete(base44, resourceType, resourceId, clinique);
      
      default:
        return fhirError('not-supported', `Method ${method} not supported`, 405);
    }

  } catch (error) {
    console.error('[FHIR] Error:', error);
    return fhirError('exception', error.message, 500);
  }
});

// ============================================
// READ: GET /fhir/{resourceType}/{id}
// ============================================
async function handleRead(base44, resourceType, resourceId, clinique) {
  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter({
    resource_type: resourceType,
    fhir_id: resourceId
  });

  if (resources.length === 0) {
    return fhirError('not-found', `${resourceType}/${resourceId} not found`, 404);
  }

  const resource = resources[0];

  // Vérification de sécurité : la clinique a-t-elle accès à cette ressource ?
  if (!await hasAccess(base44, clinique, resource)) {
    return fhirError('forbidden', 'Access denied to this resource', 403);
  }

  return Response.json(resource.resource_json, {
    headers: { 
      'Content-Type': 'application/fhir+json',
      'ETag': `W/"${resource.updated_date}"`
    }
  });
}

// ============================================
// SEARCH: GET /fhir/{resourceType}?params
// ============================================
async function handleSearch(base44, resourceType, searchParams, clinique) {
  const query = { resource_type: resourceType };

  // Filtres FHIR standards
  if (searchParams.has('patient')) {
    query.patient_email = searchParams.get('patient');
  }

  if (searchParams.has('_lastUpdated')) {
    const lastUpdated = searchParams.get('_lastUpdated');
    // Format: gt2024-01-01 ou lt2024-12-31
    if (lastUpdated.startsWith('gt')) {
      query['last_updated'] = { $gte: lastUpdated.substring(2) };
    } else if (lastUpdated.startsWith('lt')) {
      query['last_updated'] = { $lte: lastUpdated.substring(2) };
    }
  }

  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter(query);

  // Filtrer selon les droits d'accès de la clinique
  const accessibleResources = [];
  for (const resource of resources) {
    if (await hasAccess(base44, clinique, resource)) {
      accessibleResources.push(resource);
    }
  }

  return Response.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: accessibleResources.length,
    entry: accessibleResources.map(r => ({
      fullUrl: `${req.url}/${r.fhir_id}`,
      resource: r.resource_json,
      search: { mode: 'match' }
    }))
  }, {
    headers: { 'Content-Type': 'application/fhir+json' }
  });
}

// ============================================
// CREATE: POST /fhir/{resourceType}
// ============================================
async function handleCreate(base44, resourceType, fhirResource, clinique) {
  // Valider le type de ressource
  if (fhirResource.resourceType !== resourceType) {
    return fhirError('invalid', 'Resource type mismatch', 400);
  }

  // Générer un ID FHIR si absent
  if (!fhirResource.id) {
    fhirResource.id = crypto.randomUUID();
  }

  // Extraire le patient_email si applicable
  let patientEmail = null;
  if (resourceType === 'Patient') {
    patientEmail = fhirResource.telecom?.find(t => t.system === 'email')?.value;
  } else if (resourceType === 'Observation' || resourceType === 'Appointment' || resourceType === 'Encounter') {
    const patientRef = fhirResource.subject?.reference || fhirResource.patient?.reference;
    if (patientRef) {
      const patientId = patientRef.split('/')[1];
      const patients = await base44.asServiceRole.entities.RessourceFHIR.filter({
        fhir_id: patientId,
        resource_type: 'Patient'
      });
      if (patients.length > 0) {
        patientEmail = patients[0].patient_email;
      }
    }
  }

  // Créer la ressource FHIR
  const saved = await base44.asServiceRole.entities.RessourceFHIR.create({
    resource_type: resourceType,
    fhir_id: fhirResource.id,
    version: 'R4',
    patient_email: patientEmail,
    resource_json: fhirResource,
    source_system: clinique.nom,
    last_updated: new Date().toISOString(),
    status: 'active',
    sync_status: 'synced'
  });

  return Response.json(saved.resource_json, {
    status: 201,
    headers: { 
      'Content-Type': 'application/fhir+json',
      'Location': `/fhir/${resourceType}/${saved.fhir_id}`
    }
  });
}

// ============================================
// UPDATE: PUT /fhir/{resourceType}/{id}
// ============================================
async function handleUpdate(base44, resourceType, resourceId, fhirResource, clinique) {
  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter({
    resource_type: resourceType,
    fhir_id: resourceId
  });

  if (resources.length === 0) {
    return fhirError('not-found', `${resourceType}/${resourceId} not found`, 404);
  }

  const existing = resources[0];

  // Vérifier accès
  if (!await hasAccess(base44, clinique, existing)) {
    return fhirError('forbidden', 'Access denied', 403);
  }

  // Mettre à jour
  const updated = await base44.asServiceRole.entities.RessourceFHIR.update(existing.id, {
    resource_json: fhirResource,
    last_updated: new Date().toISOString()
  });

  return Response.json(updated.resource_json, {
    headers: { 
      'Content-Type': 'application/fhir+json',
      'ETag': `W/"${updated.updated_date}"`
    }
  });
}

// ============================================
// DELETE: DELETE /fhir/{resourceType}/{id}
// ============================================
async function handleDelete(base44, resourceType, resourceId, clinique) {
  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter({
    resource_type: resourceType,
    fhir_id: resourceId
  });

  if (resources.length === 0) {
    return fhirError('not-found', `${resourceType}/${resourceId} not found`, 404);
  }

  const existing = resources[0];

  // Vérifier accès
  if (!await hasAccess(base44, clinique, existing)) {
    return fhirError('forbidden', 'Access denied', 403);
  }

  // Marquer comme inactif (soft delete)
  await base44.asServiceRole.entities.RessourceFHIR.update(existing.id, {
    status: 'entered-in-error'
  });

  return new Response(null, { status: 204 });
}

// ============================================
// SÉCURITÉ: Vérifier l'accès aux ressources
// ============================================
async function hasAccess(base44, clinique, resource) {
  // Une clinique a accès aux ressources de ses patients
  if (resource.patient_email) {
    // Vérifier que le patient a un RDV avec un professionnel de cette clinique
    const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
      structure_sante: clinique.nom
    });

    if (professionnels.length === 0) return false;

    const proIds = professionnels.map(p => p.id);

    // Vérifier RDV ou suivi
    const rdvs = await base44.asServiceRole.entities.RendezVous.filter({
      created_by: resource.patient_email,
      professionnel_id: { $in: proIds }
    });

    return rdvs.length > 0;
  }

  // Pour les ressources Practitioner/Organization, accès libre en lecture
  if (resource.resource_type === 'Practitioner' || resource.resource_type === 'Organization') {
    return true;
  }

  return false;
}

// ============================================
// HELPER: Construire une OperationOutcome FHIR
// ============================================
function fhirError(code, diagnostics, httpStatus) {
  return Response.json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'error',
      code,
      diagnostics
    }]
  }, { status: httpStatus });
}

// ============================================
// HELPER: Déterminer le scope requis
// ============================================
function getRequiredScope(resourceType, method) {
  const operation = method === 'GET' ? 'read' : 'write';
  const scopeMap = {
    'Patient': `${operation}:patients`,
    'Practitioner': `${operation}:practitioners`,
    'Organization': `${operation}:organizations`,
    'Encounter': `${operation}:encounters`,
    'Observation': `${operation}:observations`,
    'Appointment': `${operation}:appointments`,
    'Immunization': `${operation}:immunizations`
  };
  return scopeMap[resourceType] || 'fhir:*';
}