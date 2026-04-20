import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Tâche planifiée (cron) - pas de vérification auth utilisateur
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('🔔 Démarrage du service de notifications de naissance...');

    // Utiliser le bon champ "statut" à la place de "grossesse_active"
    const grossesses = await base44.asServiceRole.entities.SuiviGrossesse.filter({
      statut: "en_cours"
    });

    console.log(`📊 ${grossesses.length} grossesses actives trouvées`);

    const today = new Date();
    let notificationsEnvoyees = 0;

    for (const grossesse of grossesses) {
      // Utiliser date_debut_grossesse (champ correct)
      const ddr = new Date(grossesse.date_debut_grossesse);
      const joursDepuisDDR = Math.floor((today - ddr) / (1000 * 60 * 60 * 24));
      const semainesGrossesse = Math.floor(joursDepuisDDR / 7);

      // Notification à 37 semaines (terme précoce)
      if (semainesGrossesse >= 37 && semainesGrossesse < 38) {
        const existingNotif = await base44.asServiceRole.entities.Notification.filter({
          user_email: grossesse.created_by,
          titre: '👶 Votre bébé arrive bientôt !'
        });

        if (existingNotif.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: grossesse.created_by,
            type: 'systeme',
            titre: '👶 Votre bébé arrive bientôt !',
            message: 'Préparez la déclaration de naissance dès maintenant. Vous pourrez la soumettre directement depuis l\'application après l\'accouchement.',
            lien: '/DeclarationNaissance',
            priority: 'haute',
            lu: false
          });
          notificationsEnvoyees++;
        }
      }

      // Notification à 40 semaines (terme)
      if (semainesGrossesse >= 40 && semainesGrossesse < 41) {
        const existingNotif = await base44.asServiceRole.entities.Notification.filter({
          user_email: grossesse.created_by,
          titre: '🎉 Votre bébé est arrivé ?'
        });

        if (existingNotif.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: grossesse.created_by,
            type: 'systeme',
            titre: '🎉 Votre bébé est arrivé ?',
            message: 'Déclarez sa naissance en quelques clics et créez son carnet médical numérique gratuitement !',
            lien: '/DeclarationNaissance',
            priority: 'urgente',
            lu: false
          });
          notificationsEnvoyees++;
        }
      }
    }

    // Vérifier les déclarations non complétées depuis > 7 jours
    const declarations = await base44.asServiceRole.entities.DeclarationNaissance.filter({
      statut: 'soumise'
    });

    for (const declaration of declarations) {
      const dateSoumission = new Date(declaration.date_soumission || declaration.created_date);
      const jourDepuisSoumission = Math.floor((today - dateSoumission) / (1000 * 60 * 60 * 24));

      if (jourDepuisSoumission >= 7 && jourDepuisSoumission < 8) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: declaration.maman_email || declaration.created_by,
          type: 'systeme',
          titre: '📋 Rappel : Carnet médical de votre bébé',
          message: `Créez maintenant le carnet médical numérique de votre bébé pour suivre sa croissance et ses vaccinations.`,
          lien: '/DeclarationNaissance',
          priority: 'normale',
          lu: false
        });
        notificationsEnvoyees++;
      }
    }

    console.log(`✅ ${notificationsEnvoyees} notifications envoyées`);

    return Response.json({ 
      success: true,
      notifications_envoyees: notificationsEnvoyees,
      grossesses_scannees: grossesses.length,
      declarations_scannees: declarations.length
    });

  } catch (error) {
    console.error('❌ Erreur service notifications naissance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});