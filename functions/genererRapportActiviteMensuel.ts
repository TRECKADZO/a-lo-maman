import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { centreId, mois, annee } = await req.json();

    if (!centreId || !mois || !annee) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    console.log(`📊 Génération rapport pour centre ${centreId}, ${mois}/${annee}`);

    // Récupérer les RDV du mois
    const dateDebut = new Date(annee, mois - 1, 1);
    const dateFin = new Date(annee, mois, 0, 23, 59, 59);

    const rdvs = await base44.entities.RendezVousAdministratif.filter({
      centre_id: centreId,
      date_rdv: {
        $gte: dateDebut.toISOString(),
        $lte: dateFin.toISOString()
      }
    });

    // Récupérer les factures du mois
    const factures = await base44.entities.Facturation.filter({
      centre_id: centreId,
      date_emission: {
        $gte: dateDebut.toISOString().split('T')[0],
        $lte: dateFin.toISOString().split('T')[0]
      }
    });

    // Calculer les statistiques
    const stats = {
      nombre_rdv_total: rdvs.length,
      nombre_rdv_realises: rdvs.filter(r => r.statut === 'termine').length,
      nombre_rdv_annules: rdvs.filter(r => r.statut === 'annule').length,
      nombre_rdv_no_show: rdvs.filter(r => r.statut === 'no_show').length,
      taux_realisation_percent: rdvs.length > 0 
        ? ((rdvs.filter(r => r.statut === 'termine').length / rdvs.length) * 100).toFixed(1)
        : 0,
      nombre_patients_uniques: new Set(rdvs.map(r => r.patient_email)).size,
      nombre_nouveaux_patients: rdvs.filter(r => r.patient_email).length // À affiner avec DB
    };

    // Consultations par type
    const consultationParType = {};
    rdvs.forEach(rdv => {
      const type = rdv.type_consultation;
      consultationParType[type] = (consultationParType[type] || 0) + 1;
    });

    // Financier
    const montantTotal = factures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    const montantPaye = factures
      .filter(f => f.statut === 'payee')
      .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

    const financier = {
      montant_total_facture: montantTotal,
      montant_paye: montantPaye,
      montant_impaye: montantTotal - montantPaye,
      taux_recouvrement_percent: montantTotal > 0 ? ((montantPaye / montantTotal) * 100).toFixed(1) : 0,
      montant_moyen_par_rdv: stats.nombre_rdv_realises > 0 
        ? (montantTotal / stats.nombre_rdv_realises).toFixed(2)
        : 0,
      nombre_factures_generees: factures.length
    };

    // Récupérer le centre
    const [centre] = await base44.entities.Clinique.filter({ id: centreId });

    // Créer ou mettre à jour le rapport
    const rapportExistant = await base44.entities.RapportActiviteMensuel.filter({
      centre_id: centreId,
      mois: mois,
      annee: annee
    });

    const donnees = {
      centre_id: centreId,
      centre_nom: centre?.nom || 'Centre inconnu',
      mois,
      annee,
      date_generation: new Date().toISOString(),
      statistiques: stats,
      consultation_par_type: consultationParType,
      financier,
      performance: {
        taux_satisfaction_moyen: 0, // À connecter avec les RDV réels
        temps_moyen_rdv_minutes: 30,
        nombre_documents_generes: factures.length
      },
      observations: `Rapport auto-généré pour ${mois}/${annee}. ${stats.nombre_rdv_realises} consultations réalisées, ${montantPaye.toFixed(2)}F collectés.`,
      statut_generation: 'termine'
    };

    let rapport;
    if (rapportExistant.length > 0) {
      await base44.entities.RapportActiviteMensuel.update(rapportExistant[0].id, donnees);
      rapport = { ...rapportExistant[0], ...donnees };
    } else {
      rapport = await base44.entities.RapportActiviteMensuel.create(donnees);
    }

    return Response.json({
      success: true,
      rapport,
      message: `Rapport généré avec succès: ${stats.nombre_rdv_realises} RDV, ${financier.montant_total_facture.toFixed(2)}F facturés`
    });

  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return Response.json({ 
      error: error.message,
      details: 'Voir logs du serveur'
    }, { status: 500 });
  }
});