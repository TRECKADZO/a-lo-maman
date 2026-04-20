import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function chiffrerContenu(contenu, cle) {
  // Chiffrement simple XOR (en prod, utiliser libsodium ou similar)
  const encoded = new TextEncoder().encode(contenu);
  const result = [];
  for (let i = 0; i < encoded.length; i++) {
    result.push(encoded[i] ^ cle.charCodeAt(i % cle.length));
  }
  return Buffer.from(result).toString('base64');
}

function dechiffrerContenu(chiffre, cle) {
  const decoded = Buffer.from(chiffre, 'base64');
  const result = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded[i] ^ cle.charCodeAt(i % cle.length));
  }
  return new TextDecoder().decode(new Uint8Array(result));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, conversation_id, contenu, participants, titre, type, documents } = await req.json();

    if (!['creer_conversation', 'envoyer_message', 'marquer_lu', 'ajouter_participant'].includes(action)) {
      return Response.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Créer une conversation
    if (action === 'creer_conversation') {
      const cle = `${user.email}-${Date.now()}`;
      
      const conversation = {
        type: type || 'direct',
        titre: titre || participants.map(p => p.nom || p.email).join(', '),
        participants: [
          { email: user.email, nom: user.full_name, role: 'professionnel', date_ajout: new Date().toISOString() },
          ...participants
        ],
        chiffree: true,
        cle_chiffrement: cle,
        non_lus: {}
      };

      const created = await base44.entities.Conversation.create(conversation);

      return Response.json({
        success: true,
        conversation_id: created.id
      });
    }

    // Envoyer un message
    if (action === 'envoyer_message') {
      const conversation = await base44.entities.Conversation.filter({
        id: conversation_id
      });

      if (!conversation.length) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const conv = conversation[0];
      
      // Vérifier que l'utilisateur est participant
      const isParticipant = conv.participants.some(p => p.email === user.email);
      if (!isParticipant) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Chiffrer le contenu
      const contenuChiffre = conv.chiffree ? chiffrerContenu(contenu, conv.cle_chiffrement) : contenu;

      const message = {
        conversation_id,
        auteur_email: user.email,
        auteur_nom: user.full_name,
        contenu: contenuChiffre,
        documents: documents || [],
        securise: conv.chiffree,
        lu: false
      };

      const created = await base44.entities.Message.create(message);

      // Mettre à jour la conversation
      const nonLus = conv.non_lus || {};
      conv.participants.forEach(p => {
        if (p.email !== user.email) {
          nonLus[p.email] = (nonLus[p.email] || 0) + 1;
        }
      });

      await base44.entities.Conversation.update(conversation_id, {
        dernier_message: contenu.substring(0, 100),
        dernier_message_date: new Date().toISOString(),
        dernier_message_auteur: user.email,
        non_lus: nonLus
      });

      // Logger audit
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'create',
        entity_type: 'Message',
        entity_id: created.id,
        details: { conversation_id },
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message_id: created.id
      });
    }

    // Marquer messages comme lus
    if (action === 'marquer_lu') {
      const conversation = await base44.entities.Conversation.filter({
        id: conversation_id
      });

      if (!conversation.length) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const conv = conversation[0];
      const nonLus = conv.non_lus || {};
      nonLus[user.email] = 0;

      await base44.entities.Conversation.update(conversation_id, {
        non_lus: nonLus
      });

      return Response.json({ success: true });
    }

    // Ajouter participant
    if (action === 'ajouter_participant') {
      const conversation = await base44.entities.Conversation.filter({
        id: conversation_id
      });

      if (!conversation.length) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const conv = conversation[0];
      
      // Vérifier permissions
      const isCreator = conv.created_by === user.email;
      if (!isCreator) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const newParticipants = [
        ...conv.participants,
        {
          email: participants[0].email,
          nom: participants[0].nom,
          role: participants[0].role,
          date_ajout: new Date().toISOString()
        }
      ];

      await base44.entities.Conversation.update(conversation_id, {
        participants: newParticipants
      });

      return Response.json({ success: true });
    }

  } catch (error) {
    console.error('Erreur messagerie:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});