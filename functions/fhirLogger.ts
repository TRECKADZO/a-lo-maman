import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Service de logging et monitoring pour l'intégration FHIR
 * Enregistre les erreurs, succès, et métriques de performance
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authentication non requise pour les logs système
    const { action, logData } = await req.json();

    switch (action) {
      case 'logError':
        return await logError(base44, logData);
      
      case 'logSuccess':
        return await logSuccess(base44, logData);
      
      case 'getStats':
        return await getStats(base44, logData);
      
      case 'getRecentLogs':
        return await getRecentLogs(base44, logData);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[FHIR Logger] Critical error:', error);
    return Response.json({ 
      error: 'Logging failed',
      details: error.message 
    }, { status: 500 });
  }
});

// Enregistrer une erreur FHIR
async function logError(base44, data) {
  const {
    operation,
    resource_type,
    fhir_id,
    error_message,
    error_stack,
    request_data,
    patient_email
  } = data;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    operation,
    resource_type,
    fhir_id,
    error_message,
    error_stack,
    request_data: JSON.stringify(request_data),
    patient_email,
    source: 'FHIR Integration'
  };

  console.error('[FHIR Error]', logEntry);

  // Marquer la ressource comme en erreur si elle existe
  if (fhir_id) {
    try {
      const resources = await base44.asServiceRole.entities.RessourceFHIR.filter({
        fhir_id,
        resource_type
      });

      if (resources && resources.length > 0) {
        await base44.asServiceRole.entities.RessourceFHIR.update(resources[0].id, {
          sync_status: 'error',
          last_updated: new Date().toISOString()
        });
      }
    } catch (updateError) {
      console.error('[FHIR Logger] Failed to update resource status:', updateError);
    }
  }

  return Response.json({ 
    success: true,
    logged: true,
    level: 'ERROR'
  });
}

// Enregistrer un succès FHIR
async function logSuccess(base44, data) {
  const {
    operation,
    resource_type,
    fhir_id,
    patient_email,
    duration_ms
  } = data;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    operation,
    resource_type,
    fhir_id,
    patient_email,
    duration_ms,
    source: 'FHIR Integration'
  };

  console.info('[FHIR Success]', logEntry);

  return Response.json({ 
    success: true,
    logged: true,
    level: 'INFO'
  });
}

// Obtenir statistiques FHIR
async function getStats(base44, data) {
  const { period = '24h' } = data;

  const now = new Date();
  let startDate;

  switch (period) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter({
    created_date: { $gte: startDate.toISOString() }
  });

  const stats = {
    period,
    total_resources: resources.length,
    by_type: {},
    by_status: {
      synced: 0,
      pending: 0,
      error: 0,
      conflict: 0
    },
    by_source: {},
    errors: 0,
    recent_errors: []
  };

  resources.forEach(resource => {
    // Count by type
    stats.by_type[resource.resource_type] = (stats.by_type[resource.resource_type] || 0) + 1;
    
    // Count by sync status
    stats.by_status[resource.sync_status] = (stats.by_status[resource.sync_status] || 0) + 1;
    
    // Count by source
    stats.by_source[resource.source_system] = (stats.by_source[resource.source_system] || 0) + 1;
    
    // Track errors
    if (resource.sync_status === 'error') {
      stats.errors++;
      stats.recent_errors.push({
        resource_type: resource.resource_type,
        fhir_id: resource.fhir_id,
        date: resource.last_updated
      });
    }
  });

  stats.recent_errors = stats.recent_errors.slice(-10);

  console.info('[FHIR Stats]', {
    period,
    total: stats.total_resources,
    errors: stats.errors
  });

  return Response.json({ 
    success: true,
    stats
  });
}

// Obtenir les logs récents
async function getRecentLogs(base44, data) {
  const { limit = 50, resource_type, sync_status } = data;

  const filter = {};
  if (resource_type) filter.resource_type = resource_type;
  if (sync_status) filter.sync_status = sync_status;

  const resources = await base44.asServiceRole.entities.RessourceFHIR.filter(
    filter,
    '-last_updated',
    limit
  );

  const logs = resources.map(resource => ({
    id: resource.id,
    resource_type: resource.resource_type,
    fhir_id: resource.fhir_id,
    patient_email: resource.patient_email,
    sync_status: resource.sync_status,
    source_system: resource.source_system,
    last_updated: resource.last_updated,
    created_date: resource.created_date
  }));

  return Response.json({ 
    success: true,
    logs,
    count: logs.length
  });
}