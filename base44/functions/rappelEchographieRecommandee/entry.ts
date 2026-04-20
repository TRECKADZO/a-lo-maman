import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Tâche planifiée (cron) - pas de vérification auth utilisateur
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('🔔 Démarrage service rappels échographies...');

    // Utiliser le bon champ "statut" à la place de "grossesse_active"
    const grossesses = await base44.asServiceRole.entities.SuiviGrossesse.filter({
      statut: "en_cours"
    });

    console.log(`📊 ${grossesses.length} grossesses actives`);

    const today = new Date();
    let notificationsEnvoyees = 0;

    for (const grossesse of grossesses) {
      // Utiliser date_debut_grossesse (champ correct)
      const ddr = new Date(grossesse.date_debut_grossesse);
      const joursDepuisDDR = Math.floor((today - ddr) / (1000 * 60 * 60 * 24));
      const semaines = Math.floor(joursDepuisDDR / 7);

      // Échographie de datation (12 semaines)
      if (semaines >= 11 && semaines < 12) {
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: grossesse.created_by,
          titre: '🔍 Échographie de datation recommandée'
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: grossesse.created_by,
            type: 'rappel_rdv',
            titre: '🔍 Échographie de datation recommandée',
            message: 'Vous êtes à 12 SA. C\'est le moment idéal pour votre première échographie ! Prenez RDV en télé-échographie près de chez vous.',
            lien: '/TeleEchographie',
            priority: 'haute',
            lu: false
          });
          notificationsEnvoyees++;
        }
      }

      // Échographie morphologique (20-22 semaines)
      if (semaines >= 20 && semaines < 21) {
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: grossesse.created_by,
          titre: '🔍 Échographie morphologique recommandée'
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: grossesse.created_by,
            type: 'rappel_rdv',
            titre: '🔍 Échographie morphologique recommandée',
            message: 'L\'échographie du 2e trimestre permet de vérifier tous les organes de bébé. Prenez RDV dès maintenant !',
            lien: '/TeleEchographie',
            priority: 'haute',
            lu: false
          });
          notificationsEnvoyees++;
        }
      }

      // Échographie de croissance (32 semaines)
      if (semaines >= 32 && semaines < 33) {
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: grossesse.created_by,
          titre: '🔍 Échographie de croissance recommandée'
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: grossesse.created_by,
            type: 'rappel_rdv',
            titre: '🔍 Échographie de croissance recommandée',
            message: 'Vérifiez la croissance et la position de votre bébé avant l\'accouchement. Prenez RDV en télé-échographie.',
            lien: '/TeleEchographie',
            priority: 'haute',
            lu: false
          });
          notificationsEnvoyees++;
        }
      }
    }

    console.log(`✅ ${notificationsEnvoyees} rappels échographies envoyés`);

    return Response.json({ 
      success: true,
      notifications_envoyees: notificationsEnvoyees,
      grossesses_scannees: grossesses.length
    });

  } catch (error) {
    console.error('❌ Erreur service rappels échographies:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});