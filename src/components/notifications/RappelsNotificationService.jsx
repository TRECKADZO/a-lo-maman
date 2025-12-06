import { base44 } from '@/api/base44Client';
import { differenceInMinutes, isBefore } from 'date-fns';

/**
 * Service de gestion des rappels et notifications intelligentes
 * Vérifie les rappels à venir et envoie des notifications
 */
export class RappelsNotificationService {
  static async verifierEtEnvoyerRappels(userEmail) {
    try {
      const rappels = await base44.entities.RappelSante.filter({
        created_by: userEmail,
        actif: true,
        termine: false
      });

      const now = new Date();
      
      for (const rappel of rappels) {
        const dateRappel = new Date(rappel.date_heure_rappel);
        const minutesRestantes = differenceInMinutes(dateRappel, now);
        
        // Vérifier si on doit envoyer une notification
        const notificationAvant = rappel.notification_avant || [15];
        const historiqueNotifs = rappel.historique_notifications || [];
        
        for (const minutesAvant of notificationAvant) {
          const dejaEnvoye = historiqueNotifs.some(h => 
            Math.abs(differenceInMinutes(new Date(h.date_envoi), dateRappel)) === minutesAvant
          );
          
          // Si le temps correspond et pas encore envoyé
          if (Math.abs(minutesRestantes - minutesAvant) <= 2 && !dejaEnvoye) {
            await this.envoyerNotificationRappel(rappel, userEmail);
            
            // Mettre à jour l'historique
            await base44.entities.RappelSante.update(rappel.id, {
              historique_notifications: [
                ...historiqueNotifs,
                {
                  date_envoi: now.toISOString(),
                  statut: 'envoye'
                }
              ]
            });
          }
        }

        // Si le rappel est passé et unique, le marquer comme terminé
        if (isBefore(dateRappel, now) && rappel.frequence === 'unique') {
          await base44.entities.RappelSante.update(rappel.id, { termine: true });
        }

        // Si récurrent, créer le prochain rappel
        if (isBefore(dateRappel, now) && rappel.frequence !== 'unique') {
          await this.creerProchainRappelRecurrent(rappel);
        }
      }
    } catch (error) {
      console.error('Erreur vérification rappels:', error);
    }
  }

  static async envoyerNotificationRappel(rappel, userEmail) {
    try {
      let message = rappel.description || rappel.titre;
      
      if (rappel.type_rappel === 'medicament' && rappel.medicament_nom) {
        message = `💊 ${rappel.medicament_nom} - ${rappel.medicament_dosage || ''}`;
      } else if (rappel.type_rappel === 'metrique_sante' && rappel.metrique_type) {
        message = `📊 N'oubliez pas de mesurer votre ${rappel.metrique_type}`;
      }

      await base44.entities.Notification.create({
        destinataire_email: userEmail,
        type: 'alerte_sante',
        titre: `🔔 ${rappel.titre}`,
        message: message,
        priorite: rappel.priorite || 'normale',
        icone: 'Bell',
        action_page: 'MesRappels',
        metadata: {
          rappel_id: rappel.id,
          type_rappel: rappel.type_rappel
        }
      });

      return true;
    } catch (error) {
      console.error('Erreur envoi notification rappel:', error);
      return false;
    }
  }

  static async creerProchainRappelRecurrent(rappel) {
    try {
      const dateActuelle = new Date(rappel.date_heure_rappel);
      let prochaineDate;

      switch(rappel.frequence) {
        case 'quotidien':
          prochaineDate = new Date(dateActuelle.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'hebdomadaire':
          prochaineDate = new Date(dateActuelle.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mensuel':
          prochaineDate = new Date(dateActuelle);
          prochaineDate.setMonth(prochaineDate.getMonth() + 1);
          break;
        default:
          return;
      }

      // Vérifier si on a dépassé la date de fin de récurrence
      if (rappel.date_fin_recurrence && prochaineDate > new Date(rappel.date_fin_recurrence)) {
        await base44.entities.RappelSante.update(rappel.id, { termine: true });
        return;
      }

      // Mettre à jour le rappel avec la nouvelle date
      await base44.entities.RappelSante.update(rappel.id, {
        date_heure_rappel: prochaineDate.toISOString(),
        historique_notifications: [] // Reset pour le prochain cycle
      });
    } catch (error) {
      console.error('Erreur création rappel récurrent:', error);
    }
  }
}

export default RappelsNotificationService;