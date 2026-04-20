import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, details } = await req.json();

    // Logger l'accès dans l'entité AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      user_role: user.role,
      action, // 'read', 'create', 'update', 'delete'
      entity_type, // 'EnfantCarnet', 'SuiviGrossesse', etc.
      entity_id,
      details: details || {},
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erreur log audit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});