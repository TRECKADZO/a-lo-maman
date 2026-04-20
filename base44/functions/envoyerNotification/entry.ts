// Service centralisé d'envoi de notifications
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { 
      destinataire_email, 
      type, 
      titre, 
      message, 
      action_page,
      priorite = 'normale',
      envoyer_email = false,
      metadata = {}
    } = await req.json();

    // Créer la notification in-app
    const notification = await base44.asServiceRole.entities.Notification.create({
      destinataire_email,
      type,
      titre,
      message,
      action_page,
      priorite,
      icone: getIconForType(type),
      lu: false,
      metadata
    });

    // Envoyer email si demandé
    if (envoyer_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: destinataire_email,
        subject: `${titre} - A'lo Maman`,
        body: generateEmailBody(titre, message, action_page)
      });
    }

    return Response.json({ success: true, notification_id: notification.id });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getIconForType(type) {
  const icons = {
    'rendez_vous': 'Calendar',
    'rappel_rdv': 'Bell',
    'message': 'MessageSquare',
    'compte_rendu': 'FileText',
    'vaccin': 'Syringe',
    'medicament': 'Pill',
    'communaute': 'Users',
    'urgent': 'AlertCircle'
  };
  return icons[type] || 'Bell';
}

function generateEmailBody(titre, message, actionPage) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom right, #fdf2f8, #fce7f3); border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #be185d; margin: 0;">A'lo Maman</h1>
      </div>
      <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h2 style="color: #374151; margin-top: 0;">${titre}</h2>
        <p style="color: #6b7280;">${message}</p>
      </div>
      <div style="text-align: center;">
        <p style="color: #9ca3af; font-size: 12px;">© 2025 A'lo Maman</p>
      </div>
    </div>
  `;
}