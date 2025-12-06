// Fonction backend pour calculer les statistiques du professionnel
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { periode } = await req.json(); // 'semaine', 'mois', 'annee'

    // Récupérer le profil professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ email: user.email });
    const pro = proList[0];

    if (!pro) {
      return Response.json({ error: 'Profil professionnel non trouvé' }, { status: 404 });
    }

    // Calculer les dates de la période
    const now = new Date();
    let dateDebut = new Date();
    
    switch (periode) {
      case 'semaine':
        dateDebut.setDate(now.getDate() - 7);
        break;
      case 'mois':
        dateDebut.setMonth(now.getMonth() - 1);
        break;
      case 'annee':
        dateDebut.setFullYear(now.getFullYear() - 1);
        break;
      default:
        dateDebut.setMonth(now.getMonth() - 1);
    }

    // Récupérer tous les RDV du professionnel
    const allRdv = await base44.asServiceRole.entities.RendezVous.filter({
      professionnel_id: pro.id
    });

    // Filtrer par période
    const rdvPeriode = allRdv.filter(rdv => new Date(rdv.date_rdv) >= dateDebut);

    // Calculer les statistiques
    const stats = {
      total_rdv: rdvPeriode.length,
      rdv_termines: rdvPeriode.filter(r => r.statut === 'termine').length,
      rdv_annules: rdvPeriode.filter(r => r.statut === 'annule').length,
      rdv_confirmes: rdvPeriode.filter(r => r.statut === 'confirme').length,
      rdv_en_attente: rdvPeriode.filter(r => r.statut === 'planifie').length,
      
      // Par type de consultation
      par_type: {
        cabinet: rdvPeriode.filter(r => r.type_consultation === 'cabinet').length,
        clinique: rdvPeriode.filter(r => r.type_consultation === 'clinique').length,
        hopital: rdvPeriode.filter(r => r.type_consultation === 'hopital').length,
        telephone: rdvPeriode.filter(r => r.type_consultation === 'telephone').length,
        visio: rdvPeriode.filter(r => r.type_consultation === 'visio').length,
      },

      // Taux de complétion
      taux_completion: rdvPeriode.length > 0 
        ? Math.round((rdvPeriode.filter(r => r.statut === 'termine').length / rdvPeriode.length) * 100)
        : 0,

      // Taux d'annulation
      taux_annulation: rdvPeriode.length > 0
        ? Math.round((rdvPeriode.filter(r => r.statut === 'annule').length / rdvPeriode.length) * 100)
        : 0
    };

    // Récupérer les patients uniques
    const patientsUniques = [...new Set(allRdv.map(r => r.created_by))];
    stats.nombre_patients = patientsUniques.length;

    // Nouveaux patients sur la période
    const rdvAvantPeriode = allRdv.filter(rdv => new Date(rdv.date_rdv) < dateDebut);
    const anciensPatients = new Set(rdvAvantPeriode.map(r => r.created_by));
    const nouveauxPatients = patientsUniques.filter(p => !anciensPatients.has(p));
    stats.nouveaux_patients = nouveauxPatients.length;

    // RDV par jour de la semaine
    const parJour = { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 };
    const jours = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    rdvPeriode.forEach(rdv => {
      const jour = new Date(rdv.date_rdv).getDay();
      parJour[jours[jour]]++;
    });
    stats.par_jour = parJour;

    // Récupérer les avis
    const avis = await base44.asServiceRole.entities.AvisProfessionnel.filter({
      professionnel_id: pro.id
    });

    stats.nombre_avis = avis.length;
    stats.note_moyenne = avis.length > 0
      ? Math.round((avis.reduce((sum, a) => sum + (a.note || 0), 0) / avis.length) * 10) / 10
      : 0;

    // Revenus estimés (basé sur les tarifs)
    const tarifs = pro.tarifs_par_type || {};
    let revenus = 0;
    rdvPeriode.filter(r => r.statut === 'termine').forEach(rdv => {
      revenus += tarifs[rdv.type_consultation] || pro.tarif_consultation || 0;
    });
    stats.revenus_estimes = revenus;

    return Response.json({
      success: true,
      periode,
      date_debut: dateDebut.toISOString(),
      date_fin: now.toISOString(),
      statistiques: stats
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});