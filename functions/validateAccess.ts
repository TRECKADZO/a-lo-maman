import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fonction de validation d'accès pour les données sensibles
 * Vérifie les permissions et crée des alertes en cas d'accès suspect
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_type, resource_id, action } = await req.json();

    // Récupérer l'IP
    const ip_address = req.headers.get('x-forwarded-for') || 
                       req.headers.get('cf-connecting-ip') || 
                       'unknown';

    // Vérifier les tentatives récentes de cet IP
    const recentLogs = await base44.asServiceRole.entities.AuditLog.filter({
      ip_address: ip_address
    });

    const recentAttempts = recentLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      return (now - logDate) < 60 * 1000; // dernière minute
    });

    // Alerte si trop de tentatives
    if (recentAttempts.length > 20) {
      await base44.asServiceRole.entities.AlerteFHIR.create({
        centre_id: 'system',
        centre_nom: 'Système',
        type_alerte: 'tentative_brute_force',
        severite: 'haute',
        description: `Trop de tentatives d'accès depuis l'IP ${ip_address}`,
        ip_adresse: ip_address,
        utilisateur_email: user.email,
        tentatives: recentAttempts.length,
        dernier_incident: new Date().toISOString(),
        statut: 'active',
        actions_recommandees: [
          'Bloquer temporairement l\'IP',
          'Vérifier l\'activité de l\'utilisateur',
          'Contacter l\'utilisateur pour confirmation'
        ]
      });

      console.warn('⚠️ Alerte brute force:', ip_address);

      return Response.json({
        allowed: false,
        reason: 'Too many requests',
        alert_created: true
      }, { status: 429 });
    }

    // Vérifier les permissions spécifiques
    let allowed = false;
    
    if (resource_type === 'EnfantCarnet' || resource_type === 'SuiviGrossesse') {
      // Seuls le créateur et les professionnels de suivi peuvent accéder
      const resource = await base44.entities[resource_type].filter({ 
        id: resource_id 
      });

      if (resource.length > 0) {
        const item = resource[0];
        allowed = item.created_by === user.email || 
                  item.professionnels_suivi?.includes(user.email) ||
                  user.role === 'admin';
      }
    } else {
      // Par défaut, autoriser si admin ou créateur
      allowed = user.role === 'admin';
    }

    // Logger l'accès
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      user_role: user.role,
      action: action,
      entity_type: resource_type,
      entity_id: resource_id,
      details: { allowed: allowed },
      ip_address: ip_address,
      user_agent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      allowed: allowed,
      user_email: user.email,
      user_role: user.role
    });

  } catch (error) {
    console.error('❌ Erreur validation accès:', error);
    return Response.json({ 
      allowed: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});