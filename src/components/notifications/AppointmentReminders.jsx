import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { differenceInMinutes, differenceInHours } from 'date-fns';

/**
 * Composant pour gérer automatiquement les rappels de rendez-vous
 * Vérifie les RDV à venir et envoie des notifications push
 */
export default function AppointmentReminders() {
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

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['mes_rdv', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { 
          created_by: user.email,
          statut: { $in: ['planifie', 'confirme'] }
        },
        'date_rdv'
      );
      return rdvs;
    },
    enabled: !!user,
    refetchInterval: 60000, // Vérifier chaque minute
  });

  useEffect(() => {
    if (!user || !userProfile || !rendezVous.length) return;
    
    checkAndSendReminders();
  }, [user, userProfile, rendezVous]);

  const checkAndSendReminders = async () => {
    if (!userProfile?.preferences_notifications?.notifications_push) return;

    const now = new Date();
    
    for (const rdv of rendezVous) {
      const rdvDate = new Date(rdv.date_rdv);
      const minutesUntil = differenceInMinutes(rdvDate, now);
      const hoursUntil = differenceInHours(rdvDate, now);

      // Rappel 24h avant
      if (
        hoursUntil <= 24 && 
        hoursUntil > 23 && 
        !rdv.rappel_24h_envoye &&
        userProfile.preferences_notifications?.rappel_rendez_vous_24h
      ) {
        await sendReminderNotification(rdv, '24h');
        await base44.entities.RendezVous.update(rdv.id, { rappel_24h_envoye: true });
      }

      // Rappel 1h avant
      if (
        minutesUntil <= 60 && 
        minutesUntil > 50 && 
        !rdv.rappel_1h_envoye &&
        userProfile.preferences_notifications?.rappel_rendez_vous_1h
      ) {
        await sendReminderNotification(rdv, '1h');
        await base44.entities.RendezVous.update(rdv.id, { rappel_1h_envoye: true });
      }
    }
  };

  const sendReminderNotification = async (rdv, delai) => {
    const titre = delai === '24h' 
      ? '📅 Rappel : Rendez-vous demain' 
      : '⏰ Rappel : Rendez-vous dans 1 heure';

    const message = delai === '24h'
      ? `Vous avez un rendez-vous demain à ${new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${rdv.motif || 'Consultation'}`
      : `Votre rendez-vous commence dans 1 heure - ${rdv.motif || 'Consultation'}. Préparez-vous !`;

    try {
      // Créer notification in-app
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'rendez_vous_rappel',
        titre,
        message,
        priorite: delai === '1h' ? 'haute' : 'normale',
        icone: 'Calendar',
        action_page: 'Teleconsultation',
        action_params: { rdvId: rdv.id }
      });

      // Envoyer notification push si disponible
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(titre, {
          body: message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          vibrate: delai === '1h' ? [200, 100, 200, 100, 200] : [200, 100, 200],
          tag: `rdv-${rdv.id}`,
          requireInteraction: delai === '1h', // Reste affiché pour les rappels 1h
          data: {
            url: `/Teleconsultation?rdvId=${rdv.id}`
          }
        });
      }

      // Envoyer email si activé
      if (userProfile.preferences_notifications?.notifications_email) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: titre,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">A'lo Maman</h1>
                <p style="color: white; margin-top: 10px;">Rappel de rendez-vous</p>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">${titre}</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  ${message}
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <p style="color: #6b7280; margin: 0;"><strong>Type :</strong> ${rdv.type_consultation}</p>
                  ${rdv.adresse_consultation ? `<p style="color: #6b7280; margin: 10px 0 0 0;"><strong>Lieu :</strong> ${rdv.adresse_consultation}</p>` : ''}
                  ${rdv.notes_patient ? `<p style="color: #6b7280; margin: 10px 0 0 0;"><strong>Notes :</strong> ${rdv.notes_patient}</p>` : ''}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${window.location.origin}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            display: inline-block;">
                    Accéder à mon rendez-vous
                  </a>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>A'lo Maman - Santé Maternelle & Infantile</p>
                <p style="margin-top: 5px;">Cette notification a été générée automatiquement</p>
              </div>
            </div>
          `
        });
      }
    } catch (error) {
      console.error('Erreur envoi rappel:', error);
    }
  };

  // Composant invisible - juste pour la logique
  return null;
}