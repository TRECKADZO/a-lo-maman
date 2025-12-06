// Processeur automatique des rappels de RDV (24h et 1h avant)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // Récupérer tous les RDV confirmés
    const rdvList = await base44.asServiceRole.entities.RendezVous.filter({
      statut: 'confirme'
    });

    let rappels24h = 0;
    let rappels1h = 0;

    for (const rdv of rdvList) {
      const dateRdv = new Date(rdv.date_rdv);
      const diffHeures = (dateRdv - now) / (1000 * 60 * 60);

      // Rappel 24h (entre 23h et 25h avant)
      if (diffHeures >= 23 && diffHeures <= 25 && !rdv.rappel_24h_envoye) {
        const pro = (await base44.asServiceRole.entities.Professionnel.filter({ id: rdv.professionnel_id }))[0];
        
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: rdv.created_by,
          type: 'rappel_rdv',
          titre: '📅 Rappel: RDV demain',
          message: `Votre rendez-vous avec ${pro?.nom_complet || 'votre spécialiste'} est prévu demain à ${dateRdv.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
          action_page: 'MesRendezVous',
          priorite: 'normale',
          icone: 'Calendar'
        });

        await base44.asServiceRole.entities.RendezVous.update(rdv.id, { rappel_24h_envoye: true });
        rappels24h++;
      }

      // Rappel 1h (entre 50min et 70min avant)
      if (diffHeures >= 0.83 && diffHeures <= 1.17 && !rdv.rappel_1h_envoye) {
        const pro = (await base44.asServiceRole.entities.Professionnel.filter({ id: rdv.professionnel_id }))[0];
        
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: rdv.created_by,
          type: 'rappel_rdv',
          titre: '⏰ RDV dans 1 heure',
          message: `Votre rendez-vous avec ${pro?.nom_complet || 'votre spécialiste'} commence dans 1 heure.${rdv.type_consultation === 'visio' ? ' Préparez-vous pour la vidéoconsultation.' : ''}`,
          action_page: 'MesRendezVous',
          priorite: 'haute',
          icone: 'Bell'
        });

        await base44.asServiceRole.entities.RendezVous.update(rdv.id, { rappel_1h_envoye: true });
        rappels1h++;
      }
    }

    return Response.json({
      success: true,
      rappels_24h_envoyes: rappels24h,
      rappels_1h_envoyes: rappels1h,
      rdv_verifies: rdvList.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});