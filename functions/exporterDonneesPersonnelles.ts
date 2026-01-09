import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer toutes les données personnelles
    const [
      profils,
      grossesses,
      enfants,
      rdvs,
      messages,
      documents,
      consents,
      auditLogs,
      preferences
    ] = await Promise.all([
      base44.asServiceRole.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.SuiviGrossesse.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.EnfantCarnet.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.RendezVousAdministratif.filter({ patient_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.Conversation.filter({ 
        participants: { $elemMatch: { email: user.email } } 
      }).catch(() => []),
      base44.asServiceRole.entities.DocumentMedical.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.ConsentementGDPR.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.AuditLog.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.PreferencesDashboard.filter({ user_email: user.email }).catch(() => [])
    ]);

    // Créer l'export
    const exportData = {
      export_date: new Date().toISOString(),
      user_info: {
        email: user.email,
        nom: user.full_name,
        role: user.role
      },
      profils_maman: profils.map(p => ({
        ...p,
        id: p.id,
        created_date: p.created_date
      })),
      suivi_grossesse: grossesses.map(g => ({
        ...g,
        id: g.id,
        created_date: g.created_date
      })),
      enfants: enfants.map(e => ({
        ...e,
        id: e.id,
        created_date: e.created_date
      })),
      rendez_vous: rdvs.map(r => ({
        ...r,
        id: r.id,
        created_date: r.created_date
      })),
      conversations: messages.map(c => ({
        titre: c.titre,
        type: c.type,
        participants: c.participants,
        dernier_message_date: c.dernier_message_date,
        id: c.id,
        created_date: c.created_date
      })),
      documents: documents.map(d => ({
        nom: d.nom,
        type: d.type,
        date_document: d.date_document,
        id: d.id,
        created_date: d.created_date
      })),
      consentements_gdpr: consents.map(c => ({
        type_donnee: c.type_donnee,
        statut: c.statut,
        date_consentement: c.date_consentement,
        id: c.id
      })),
      audit_logs: auditLogs.map(a => ({
        action: a.action,
        entity_type: a.entity_type,
        timestamp: a.timestamp,
        ip_address: a.ip_address
      })),
      preferences: preferences
    };

    // Logger l'export
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'export',
      entity_type: 'PersonalDataExport',
      details: {
        export_size: JSON.stringify(exportData).length,
        items_count: {
          profils: profils.length,
          grossesses: grossesses.length,
          enfants: enfants.length,
          rdvs: rdvs.length,
          messages: messages.length,
          documents: documents.length
        }
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Retourner en format JSON
    return Response.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Erreur export données:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});