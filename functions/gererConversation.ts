// Gestion des conversations et messages
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action, destinataire_email, contenu, conversation_id } = await req.json();

    switch (action) {
      case 'envoyer_message': {
        // Trouver ou créer la conversation
        let conversations = await base44.asServiceRole.entities.Conversation.filter({
          participant_emails: { $all: [user.email, destinataire_email] }
        });

        let conversation = conversations[0];

        if (!conversation) {
          conversation = await base44.asServiceRole.entities.Conversation.create({
            participant_emails: [user.email, destinataire_email],
            last_message_content: contenu,
            last_message_date: new Date().toISOString()
          });
        }

        // Créer le message
        const message = await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          expediteur_email: user.email,
          destinataire_email: destinataire_email,
          contenu: contenu,
          lu: false
        });

        // Mettre à jour la conversation
        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message_content: contenu,
          last_message_date: new Date().toISOString()
        });

        // Notifier le destinataire
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: destinataire_email,
          type: 'message',
          titre: '💬 Nouveau message',
          message: `${user.full_name || user.email} vous a envoyé un message.`,
          action_page: 'Messagerie',
          priorite: 'normale',
          icone: 'MessageSquare'
        });

        return Response.json({ success: true, message_id: message.id, conversation_id: conversation.id });
      }

      case 'marquer_lu': {
        const messages = await base44.asServiceRole.entities.Message.filter({
          conversation_id: conversation_id,
          destinataire_email: user.email,
          lu: false
        });

        for (const msg of messages) {
          await base44.asServiceRole.entities.Message.update(msg.id, { 
            lu: true,
            date_lecture: new Date().toISOString()
          });
        }

        return Response.json({ success: true, messages_marques: messages.length });
      }

      default:
        return Response.json({ error: 'Action non reconnue' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});