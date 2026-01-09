import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmation, motif } = await req.json();

    if (confirmation !== 'SUPPRIMER MON COMPTE') {
      return Response.json({ 
        error: 'Veuillez taper exactement: SUPPRIMER MON COMPTE' 
      }, { status: 400 });
    }

    // Créer log de suppression avant tout
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'delete',
      entity_type: 'User',
      entity_id: user.id,
      details: {
        motif: motif || 'Non spécifié',
        type_suppression: 'account_deletion'
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Récupérer et anonymiser les données
    const [profils, conversations, documents, consents] = await Promise.all([
      base44.asServiceRole.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.Conversation.filter({ 
        participants: { $elemMatch: { email: user.email } } 
      }).catch(() => []),
      base44.asServiceRole.entities.DocumentMedical.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.ConsentementGDPR.filter({ user_email: user.email }).catch(() => [])
    ]);

    // Anonymiser les profils
    for (const profil of profils) {
      await base44.asServiceRole.entities.ProfilMaman.update(profil.id, {
        telephone: null,
        ville: null,
        region: null,
        deleted: true,
        deleted_at: new Date().toISOString()
      });
    }

    // Anonymiser les conversations
    for (const conv of conversations) {
      const updatedParticipants = conv.participants.map(p =>
        p.email === user.email 
          ? { ...p, nom: '[Utilisateur supprimé]', email: null }
          : p
      );
      await base44.asServiceRole.entities.Conversation.update(conv.id, {
        participants: updatedParticipants
      });
    }

    // Supprimer les documents
    for (const doc of documents) {
      await base44.asServiceRole.entities.DocumentMedical.delete(doc.id);
    }

    // Révoquer tous les consentements
    for (const consent of consents) {
      await base44.asServiceRole.entities.ConsentementGDPR.update(consent.id, {
        statut: 'revoque',
        revoque_le: new Date().toISOString(),
        raison_revocation: 'Suppression de compte'
      });
    }

    // Créer record pour RGPD
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'delete',
      entity_type: 'AccountDeletionCompletion',
      details: {
        profiles_anonymised: profils.length,
        conversations_updated: conversations.length,
        documents_deleted: documents.length,
        consents_revoked: consents.length
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Compte supprimé. Les données ont été anonymisées ou supprimées selon la réglementation RGPD.',
      details: {
        profiles: profils.length,
        conversations: conversations.length,
        documents: documents.length
      }
    });

  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});