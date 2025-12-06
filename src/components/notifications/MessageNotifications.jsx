import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/**
 * Composant pour gérer les notifications de nouveaux messages
 * Envoie des notifications push quand un nouveau message arrive
 */
export default function MessageNotifications() {
  const [lastMessageId, setLastMessageId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const convs = await base44.entities.Conversation.filter({
        participant_emails: { $in: [user.email] }
      }, '-last_message_date');
      return convs;
    },
    enabled: !!user,
    refetchInterval: 5000, // Vérifier toutes les 5 secondes
  });

  useEffect(() => {
    if (!user || !userProfile || !conversations.length) return;
    
    checkForNewMessages();
  }, [conversations, user, userProfile]);

  const checkForNewMessages = async () => {
    if (!userProfile?.preferences_notifications?.messages) return;
    if (!userProfile?.preferences_notifications?.notifications_push) return;

    for (const conversation of conversations) {
      // Récupérer le dernier message de cette conversation
      const messages = await base44.entities.Message.filter(
        { conversation_id: conversation.id },
        '-created_date',
        1
      );

      if (messages.length === 0) continue;
      
      const lastMessage = messages[0];
      
      // Vérifier si c'est un nouveau message reçu (pas envoyé par l'utilisateur)
      if (
        lastMessage.sender_email !== user.email &&
        !lastMessage.is_read &&
        lastMessage.id !== lastMessageId
      ) {
        setLastMessageId(lastMessage.id);
        await sendMessageNotification(lastMessage, conversation);
      }
    }
  };

  const sendMessageNotification = async (message, conversation) => {
    const senderEmail = message.sender_email;
    
    try {
      // Récupérer info sur l'expéditeur
      let senderName = senderEmail;
      try {
        const profilPro = await base44.entities.Professionnel.filter({ email: senderEmail });
        if (profilPro.length > 0) {
          senderName = profilPro[0].nom_complet;
        }
      } catch (error) {
        // Pas grave, garder l'email
      }

      const titre = `💬 Nouveau message de ${senderName}`;
      const messageContent = message.content || '📎 Document partagé';

      // Créer notification in-app
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'message_nouveau',
        titre,
        message: messageContent.substring(0, 100),
        priorite: 'normale',
        icone: 'MessageSquare',
        action_page: 'Messagerie',
        action_params: { conversationId: conversation.id }
      });

      // Notification push
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(titre, {
          body: messageContent.substring(0, 100),
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: `message-${message.id}`,
          data: {
            url: `/Messagerie?conversationId=${conversation.id}`
          }
        });
      }

      // Email si activé
      if (userProfile.preferences_notifications?.notifications_email) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: titre,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">A'lo Maman</h1>
                <p style="color: white; margin-top: 10px;">Nouveau message</p>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Message de ${senderName}</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b9d;">
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                    ${messageContent}
                  </p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${window.location.origin}" 
                     style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            display: inline-block;">
                    Répondre au message
                  </a>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>A'lo Maman - Messagerie sécurisée</p>
              </div>
            </div>
          `
        });
      }
    } catch (error) {
      console.error('Erreur notification message:', error);
    }
  };

  // Composant invisible
  return null;
}