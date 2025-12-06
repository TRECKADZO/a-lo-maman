import { base44 } from '@/api/base44Client';

/**
 * Système avancé de notifications push intelligentes
 * Filtre et priorise les notifications selon le profil utilisateur
 */

// Fonction pour vérifier si on est dans les heures de silence (22h-7h)
const isQuietHours = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7;
};

// Fonction pour déterminer si une notification doit être envoyée
const shouldSendNotification = async (userEmail, notificationType, userProfile) => {
  if (!userProfile) return true;

  const prefs = userProfile.preferences_notifications || {};

  // Vérifier si les notifications push sont activées globalement
  if (!prefs.notifications_push) return false;

  // Vérifier les préférences spécifiques
  const typeMap = {
    'rendez_vous_confirmation': 'rendez_vous',
    'rendez_vous_rappel': 'rappel_rendez_vous_24h',
    'rendez_vous_annulation': 'annulation_rendez_vous',
    'message_nouveau': 'nouveau_message',
    'message_reponse': 'reponse_message',
    'communaute_reponse': 'communaute_reponses',
    'communaute_vote': 'communaute_votes',
    'communaute_reponse_utile': 'reponse_utile',
    'vaccin_rappel': 'rappels_vaccins',
    'grossesse_jalon': 'jalons_grossesse',
    'enfant_jalon': 'jalons_enfant',
    'alerte_sante': 'alertes_sante',
    'assistant_ia': 'conseils_ia'
  };

  const prefKey = typeMap[notificationType];
  if (prefKey && prefs[prefKey] === false) return false;

  return true;
};

// Fonction pour envoyer une notification intelligente
export const sendSmartNotification = async ({
  destinataire_email,
  type,
  titre,
  message,
  action_page,
  action_params = {},
  priorite = 'normale',
  icone = 'Bell',
  metadata = {}
}) => {
  try {
    // Récupérer le profil utilisateur
    const profiles = await base44.entities.UserProfile.filter({ created_by: destinataire_email });
    const userProfile = profiles[0];

    // Vérifier si on doit envoyer
    const shouldSend = await shouldSendNotification(destinataire_email, type, userProfile);
    if (!shouldSend) {
      console.log('Notification filtrée par préférences utilisateur');
      return null;
    }

    // Ne pas envoyer de notifications non-urgentes pendant les heures de silence
    if (priorite !== 'urgente' && isQuietHours()) {
      console.log('Notification reportée (heures de silence)');
      metadata.delayed_until_morning = true;
    }

    // Créer la notification en base
    const notification = await base44.entities.Notification.create({
      destinataire_email,
      type,
      titre,
      message,
      action_page,
      action_params,
      priorite,
      icone,
      metadata,
      lu: false
    });

    // Envoyer notification push si supporté et autorisé
    if (userProfile?.preferences_notifications?.notifications_push && 
        'Notification' in window && 
        Notification.permission === 'granted' &&
        (!isQuietHours() || priorite === 'urgente')) {
      
      new Notification(titre, {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id,
        vibrate: priorite === 'urgente' ? [200, 100, 200, 100, 200] : [200, 100, 200],
        requireInteraction: priorite === 'urgente',
        data: {
          url: action_page,
          notificationId: notification.id
        }
      });
    }

    // Envoyer email si activé
    if (userProfile?.preferences_notifications?.notifications_email) {
      await base44.integrations.Core.SendEmail({
        to: destinataire_email,
        subject: titre,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF6B9D 0%, #FF8FAB 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">A'lo Maman</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">${titre}</h2>
              <p style="color: #666; line-height: 1.6;">${message}</p>
              ${action_page ? `<a href="${window.location.origin}/#/pages/${action_page}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #FF6B9D 0%, #FF8FAB 100%); color: white; text-decoration: none; border-radius: 8px;">Voir dans l'application</a>` : ''}
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Vous recevez cet email car vous êtes inscrit(e) sur A'lo Maman et avez activé les notifications par email.
              </p>
            </div>
          </div>
        `
      });
    }

    return notification;
  } catch (error) {
    console.error('Erreur envoi notification intelligente:', error);
    return null;
  }
};

// Fonction pour envoyer des notifications groupées
export const sendGroupedNotifications = async (notifications) => {
  const groupedByUser = {};

  notifications.forEach(notif => {
    if (!groupedByUser[notif.destinataire_email]) {
      groupedByUser[notif.destinataire_email] = [];
    }
    groupedByUser[notif.destinataire_email].push(notif);
  });

  const promises = Object.entries(groupedByUser).map(async ([email, userNotifs]) => {
    if (userNotifs.length === 1) {
      return sendSmartNotification(userNotifs[0]);
    }

    // Grouper les notifications similaires
    return sendSmartNotification({
      destinataire_email: email,
      type: 'systeme',
      titre: `${userNotifs.length} nouvelles notifications`,
      message: userNotifs.map(n => n.titre).join(', '),
      action_page: 'Dashboard',
      priorite: 'normale',
      icone: 'Bell',
      metadata: { grouped: true, count: userNotifs.length }
    });
  });

  return Promise.all(promises);
};

// Fonction pour envoyer une notification de rappel RDV intelligente
export const sendAppointmentReminder = async (rendezVous, type = '24h') => {
  try {
    const patientEmail = rendezVous.created_by;
    
    // Récupérer le professionnel pour le nom
    const pros = await base44.entities.Professionnel.filter({ id: rendezVous.professionnel_id });
    const pro = pros[0];

    const heuresRestantes = type === '24h' ? '24 heures' : '1 heure';
    
    return sendSmartNotification({
      destinataire_email: patientEmail,
      type: 'rendez_vous_rappel',
      titre: `Rappel : RDV dans ${heuresRestantes}`,
      message: `Votre rendez-vous avec ${pro?.nom_complet || 'votre spécialiste'} est dans ${heuresRestantes}. Motif : ${rendezVous.motif || 'consultation'}.`,
      action_page: 'Teleconsultation',
      priorite: type === '1h' ? 'haute' : 'normale',
      icone: 'Calendar',
      metadata: {
        rdv_id: rendezVous.id,
        reminder_type: type
      }
    });
  } catch (error) {
    console.error('Erreur rappel RDV:', error);
  }
};

// Fonction pour notifier une nouvelle réponse communautaire
export const notifyCommunityReply = async (messageAuthorEmail, replyAuthorName, messageSubject, messageId) => {
  return sendSmartNotification({
    destinataire_email: messageAuthorEmail,
    type: 'communaute_reponse',
    titre: 'Nouvelle réponse à votre message',
    message: `${replyAuthorName} a répondu à "${messageSubject}"`,
    action_page: 'Communaute',
    action_params: { messageId },
    priorite: 'normale',
    icone: 'MessageSquare',
    metadata: {
      message_id: messageId,
      reply_author: replyAuthorName
    }
  });
};

// Fonction pour notifier un nouveau message privé
export const notifyNewPrivateMessage = async (recipientEmail, senderName, conversationId) => {
  return sendSmartNotification({
    destinataire_email: recipientEmail,
    type: 'message_nouveau',
    titre: 'Nouveau message',
    message: `${senderName} vous a envoyé un message`,
    action_page: 'Messagerie',
    action_params: { conversationId },
    priorite: 'haute',
    icone: 'MessageSquare',
    metadata: {
      conversation_id: conversationId,
      sender: senderName
    }
  });
};

// Fonction pour notifier un rappel de vaccin
export const notifyVaccineReminder = async (patientEmail, childName, vaccineName, dueDate) => {
  return sendSmartNotification({
    destinataire_email: patientEmail,
    type: 'vaccin_rappel',
    titre: 'Rappel de vaccination',
    message: `Le vaccin ${vaccineName} pour ${childName} est prévu le ${dueDate}. Pensez à prendre rendez-vous.`,
    action_page: 'Enfants',
    priorite: 'haute',
    icone: 'Heart',
    metadata: {
      child_name: childName,
      vaccine_name: vaccineName,
      due_date: dueDate
    }
  });
};

// Fonction pour notifier une alerte santé
export const notifyHealthAlert = async (userEmail, alertTitle, alertMessage, severity = 'modere') => {
  const prioriteMap = {
    leger: 'normale',
    modere: 'haute',
    severe: 'urgente'
  };

  return sendSmartNotification({
    destinataire_email: userEmail,
    type: 'alerte_sante',
    titre: `⚠️ Alerte santé : ${alertTitle}`,
    message: alertMessage,
    action_page: 'Dashboard',
    priorite: prioriteMap[severity] || 'haute',
    icone: 'AlertCircle',
    metadata: {
      severity,
      alert_type: 'health'
    }
  });
};

export default {
  sendSmartNotification,
  sendGroupedNotifications,
  sendAppointmentReminder,
  notifyCommunityReply,
  notifyNewPrivateMessage,
  notifyVaccineReminder,
  notifyHealthAlert
};