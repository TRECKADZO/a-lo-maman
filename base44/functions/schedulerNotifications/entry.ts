import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Scheduler automatique pour les notifications push
 * À exécuter périodiquement (ex: toutes les heures via cron)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const maintenant = new Date();
    const dans24h = new Date(maintenant.getTime() + 24 * 60 * 60 * 1000);
    const dans1h = new Date(maintenant.getTime() + 60 * 60 * 1000);

    // Récupérer tous les RDV
    const rdvs = await base44.asServiceRole.entities.RendezVous.list('-date_rdv', 1000);
    
    const notificationsEnvoyees = [];

    for (const rdv of rdvs) {
      if (rdv.statut === 'annule' || rdv.statut === 'termine') continue;

      const dateRdv = new Date(rdv.date_rdv);
      
      // Rappel 24h avant
      if (!rdv.rappel_24h_envoye && dateRdv > maintenant && dateRdv < dans24h) {
        await base44.asServiceRole.functions.invoke('notificationsPush', {
          type: 'rappel_rdv',
          data: { rdv_id: rdv.id }
        });
        
        await base44.asServiceRole.entities.RendezVous.update(rdv.id, {
          rappel_24h_envoye: true
        });
        
        notificationsEnvoyees.push({ rdv_id: rdv.id, type: '24h' });
      }

      // Rappel 1h avant
      if (!rdv.rappel_1h_envoye && dateRdv > maintenant && dateRdv < dans1h) {
        await base44.asServiceRole.functions.invoke('notificationsPush', {
          type: 'rappel_rdv',
          data: { rdv_id: rdv.id }
        });
        
        await base44.asServiceRole.entities.RendezVous.update(rdv.id, {
          rappel_1h_envoye: true
        });
        
        notificationsEnvoyees.push({ rdv_id: rdv.id, type: '1h' });
      }
    }

    // Vérifier les analyses de risque récentes
    const analysesRecentes = await base44.asServiceRole.entities.AnalyseRisque.list('-date_analyse', 100);
    
    for (const analyse of analysesRecentes) {
      // Alertes pour risques élevés non validés
      if ((analyse.niveau_risque === 'eleve' || analyse.niveau_risque === 'critique') 
          && !analyse.valide_par_professionnel) {
        
        const dateAnalyse = new Date(analyse.date_analyse);
        const minutesDepuis = (maintenant - dateAnalyse) / (1000 * 60);
        
        // Alerte immédiate si < 5 min
        if (minutesDepuis < 5) {
          await base44.asServiceRole.functions.invoke('notificationsPush', {
            type: 'alerte_risque',
            data: {
              patient_email: analyse.patient_email,
              type_risque: analyse.type_analyse,
              niveau: analyse.niveau_risque,
              details: `Score de risque: ${analyse.score_risque}/100`
            }
          });
          
          notificationsEnvoyees.push({ 
            patient_email: analyse.patient_email, 
            type: 'alerte_risque' 
          });
        }
      }
    }

    return Response.json({
      success: true,
      notifications_envoyees: notificationsEnvoyees.length,
      details: notificationsEnvoyees
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});