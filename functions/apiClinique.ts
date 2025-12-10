import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * API REST pour les cliniques et établissements de santé (B2B)
 * Endpoints:
 * - GET /api/clinique/stats : Statistiques de la clinique
 * - GET /api/clinique/patients : Liste des patients
 * - GET /api/clinique/rendez-vous : Rendez-vous de la clinique
 * - GET /api/clinique/professionnels : Professionnels de la clinique
 * - GET /api/clinique/rapports : Rapports de santé
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin ou professionnel
    const isPro = user.role === 'admin';
    if (!isPro) {
      const proProfile = await base44.entities.Professionnel.filter({ email: user.email });
      if (!proProfile || proProfile.length === 0) {
        return Response.json({ error: 'Accès réservé aux professionnels' }, { status: 403 });
      }
    }

    const url = new URL(req.url);
    const { endpoint, clinique_id, date_debut, date_fin } = await req.json().catch(() => ({}));

    // Récupérer la clinique de l'utilisateur
    let clinique = null;
    if (clinique_id) {
      const cliniques = await base44.asServiceRole.entities.Clinique.filter({ id: clinique_id });
      clinique = cliniques[0];
    } else {
      const cliniques = await base44.asServiceRole.entities.Clinique.filter({
        administrateurs: { $in: [user.email] }
      });
      clinique = cliniques[0];
    }

    if (!clinique) {
      return Response.json({ error: 'Clinique non trouvée' }, { status: 404 });
    }

    switch (endpoint) {
      case 'stats': {
        // Statistiques de la clinique
        const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
          id: { $in: clinique.professionnels_ids || [] }
        });

        const rdvs = await base44.asServiceRole.entities.RendezVous.filter({
          professionnel_id: { $in: clinique.professionnels_ids || [] }
        });

        const rdvsActifs = rdvs.filter(r => 
          new Date(r.date_rdv) > new Date() && r.statut !== 'annule'
        );

        const rdvsMois = rdvs.filter(r => {
          const date = new Date(r.date_rdv);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const rdvsTermines = rdvs.filter(r => r.statut === 'termine');

        const stats = {
          clinique: {
            nom: clinique.nom,
            type: clinique.type_etablissement,
            region: clinique.region
          },
          professionnels: {
            total: professionnels.length,
            par_specialite: professionnels.reduce((acc, p) => {
              acc[p.specialite] = (acc[p.specialite] || 0) + 1;
              return acc;
            }, {})
          },
          rendez_vous: {
            total: rdvs.length,
            actifs: rdvsActifs.length,
            mois_en_cours: rdvsMois.length,
            termines: rdvsTermines.length,
            par_type: rdvs.reduce((acc, r) => {
              acc[r.type_consultation] = (acc[r.type_consultation] || 0) + 1;
              return acc;
            }, {})
          },
          statistiques_mois: clinique.statistiques_mois || {}
        };

        return Response.json(stats);
      }

      case 'patients': {
        // Liste des patients suivis par la clinique
        const enfants = await base44.asServiceRole.entities.EnfantCarnet.filter({
          professionnels_suivi: { $in: clinique.professionnels_ids || [] }
        });

        const patients = enfants.map(e => ({
          id: e.id,
          prenom: e.prenom,
          nom: e.nom,
          date_naissance: e.date_naissance,
          sexe: e.sexe,
          numero_cmu: e.numero_cmu,
          derniere_vaccination: e.vaccins?.[e.vaccins.length - 1]?.date_administration,
          nombre_vaccins: e.vaccins?.length || 0,
          alerte_croissance: e.alertes_developpement?.some(a => !a.lu && a.niveau_urgence === 'urgent')
        }));

        return Response.json({ 
          total: patients.length,
          patients 
        });
      }

      case 'rendez-vous': {
        // Rendez-vous de la période
        const rdvs = await base44.asServiceRole.entities.RendezVous.filter({
          professionnel_id: { $in: clinique.professionnels_ids || [] }
        });

        const rdvsFiltres = rdvs.filter(r => {
          if (!date_debut || !date_fin) return true;
          const dateRdv = new Date(r.date_rdv);
          return dateRdv >= new Date(date_debut) && dateRdv <= new Date(date_fin);
        });

        return Response.json({
          total: rdvsFiltres.length,
          rendez_vous: rdvsFiltres.map(r => ({
            id: r.id,
            date: r.date_rdv,
            type: r.type_consultation,
            statut: r.statut,
            motif: r.motif,
            patient_email: r.created_by,
            professionnel_id: r.professionnel_id
          }))
        });
      }

      case 'professionnels': {
        const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
          id: { $in: clinique.professionnels_ids || [] }
        });

        return Response.json({
          total: professionnels.length,
          professionnels: professionnels.map(p => ({
            id: p.id,
            nom: p.nom_complet,
            specialite: p.specialite,
            email: p.email,
            telephone: p.telephone,
            note_moyenne: p.note_moyenne,
            nombre_avis: p.nombre_avis,
            compte_verifie: p.compte_verifie
          }))
        });
      }

      case 'rapports': {
        // Rapports de santé
        const rapports = await base44.asServiceRole.entities.RapportSante.filter({
          clinique_id: clinique.id
        });

        return Response.json({
          total: rapports.length,
          rapports: rapports.map(r => ({
            id: r.id,
            type: r.type_rapport,
            periode: `${r.periode_debut} - ${r.periode_fin}`,
            statut: r.statut,
            indicateurs: r.indicateurs,
            genere_le: r.genere_le
          }))
        });
      }

      default:
        return Response.json({
          error: 'Endpoint invalide',
          endpoints_disponibles: [
            'stats',
            'patients',
            'rendez-vous',
            'professionnels',
            'rapports'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ 
      error: error.message,
      details: 'Erreur lors du traitement de la requête'
    }, { status: 500 });
  }
});