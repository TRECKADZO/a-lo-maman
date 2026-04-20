// Modération automatique des messages communautaires
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action, message_id, contenu, raison } = await req.json();

    switch (action) {
      case 'analyser_contenu': {
        // Analyse IA du contenu avant publication
        const analyse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `
Analyse ce message pour une communauté de santé maternelle et infantile. Vérifie:
1. Pas de contenu inapproprié ou offensant
2. Pas de conseils médicaux dangereux
3. Pas de spam ou publicité
4. Respect de la vie privée

Message: "${contenu}"

Évalue si le message est approprié pour publication.
`,
          response_json_schema: {
            type: 'object',
            properties: {
              is_appropriate: { type: 'boolean' },
              concerns: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              recommendation: { type: 'string', enum: ['approve', 'flag', 'reject'] },
              explanation: { type: 'string' }
            }
          }
        });

        return Response.json({ success: true, analyse });
      }

      case 'signaler': {
        const messages = await base44.asServiceRole.entities.MessageCommunaute.filter({ id: message_id });
        const message = messages[0];

        if (!message) {
          return Response.json({ error: 'Message non trouvé' }, { status: 404 });
        }

        const signalements = message.signalements || [];
        signalements.push({
          email_signaleur: user.email,
          raison: raison,
          date: new Date().toISOString()
        });

        // Si plus de 3 signalements, passer en modération
        const nouveauStatut = signalements.length >= 3 ? 'signale' : message.statut_moderation;

        await base44.asServiceRole.entities.MessageCommunaute.update(message_id, {
          signalements,
          statut_moderation: nouveauStatut
        });

        return Response.json({ success: true, message: 'Signalement enregistré' });
      }

      case 'moderer': {
        // Réservé aux admins
        if (user.role !== 'admin') {
          return Response.json({ error: 'Accès réservé aux modérateurs' }, { status: 403 });
        }

        const { decision, note } = await req.json();

        await base44.asServiceRole.entities.MessageCommunaute.update(message_id, {
          statut_moderation: decision, // 'approuve' ou 'rejete'
          note_moderateur: note,
          moderated_by: user.email,
          moderated_date: new Date().toISOString()
        });

        return Response.json({ success: true, message: 'Message modéré' });
      }

      default:
        return Response.json({ error: 'Action non reconnue' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});