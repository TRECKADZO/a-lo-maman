import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fonction middleware pour logger automatiquement les accès critiques
 * Utilisée pour tracer toutes les actions sensibles sur les données de santé
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, details } = await req.json();

    // Valider les paramètres
    if (!action || !entity_type) {
      return Response.json({ 
        error: 'Missing required fields: action, entity_type' 
      }, { status: 400 });
    }

    // Récupérer l'IP et user agent
    const ip_address = req.headers.get('x-forwarded-for') || 
                       req.headers.get('cf-connecting-ip') || 
                       'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Créer le log d'audit
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      user_role: user.role,
      action: action,
      entity_type: entity_type,
      entity_id: entity_id || null,
      details: details || {},
      ip_address: ip_address,
      user_agent: user_agent,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Audit log créé:', auditLog.id);

    return Response.json({ 
      success: true, 
      log_id: auditLog.id 
    });

  } catch (error) {
    console.error('❌ Erreur audit logging:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});