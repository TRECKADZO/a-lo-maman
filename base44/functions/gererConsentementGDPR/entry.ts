import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, type_donnee, statut, raison_revocation } = await req.json();

    if (!['accepter', 'refuser', 'revoquer'].includes(action)) {
      return Response.json({ error: 'Action invalide' }, { status: 400 });
    }

    const consentementData = {
      user_email: user.email,
      type_donnee,
      statut,
      date_consentement: new Date().toISOString(),
      version_politique: '1.0',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      raison_revocation: action === 'revoquer' ? raison_revocation : null,
      revoque_le: action === 'revoquer' ? new Date().toISOString() : null
    };

    // Chercher un consentement existant
    const existant = await base44.entities.ConsentementGDPR.filter({
      user_email: user.email,
      type_donnee
    });

    let consentement;
    if (existant.length > 0) {
      consentement = await base44.entities.ConsentementGDPR.update(
        existant[0].id,
        consentementData
      );
    } else {
      consentement = await base44.entities.ConsentementGDPR.create(consentementData);
    }

    // Logger l'action dans AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: action === 'accepter' ? 'create' : action === 'revoquer' ? 'delete' : 'update',
      entity_type: 'ConsentementGDPR',
      entity_id: consentement.id,
      details: {
        type_donnee,
        action,
        statut,
        raison: raison_revocation
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      consentement,
      message: `Consentement ${action === 'accepter' ? 'accepté' : action === 'refuser' ? 'refusé' : 'révoqué'}`
    });
  } catch (error) {
    console.error('Erreur gestion consentement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});