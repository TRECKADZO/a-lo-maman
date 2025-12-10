import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * API Publique pour intégrations externes (MSP, Assurances, etc.)
 * Endpoints:
 * - POST /api/public/statistiques-region : Stats par région
 * - POST /api/public/rapport-sante : Générer rapport santé publique
 * - POST /api/public/verification-professionnel : Vérifier accréditation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authentification par API key (pour services externes)
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== Deno.env.get('API_PUBLIC_KEY')) {
      return Response.json({ error: 'API Key invalide' }, { status: 401 });
    }

    const { endpoint, region, date_debut, date_fin, numero_ordre } = await req.json();

    switch (endpoint) {
      case 'statistiques-region': {
        if (!region) {
          return Response.json({ error: 'Région requise' }, { status: 400 });
        }

        // Compter les professionnels par région
        const professionnels = await base44.asServiceRole.entities.Professionnel.filter({ region });
        
        // Compter les profils maman par région
        const mamans = await base44.asServiceRole.entities.ProfilMaman.filter({ region });

        // Grossesses actives dans la région
        const grossesses = await base44.asServiceRole.entities.SuiviGrossesse.filter({
          grossesse_active: true
        });

        // Enfants dans la région (via profil maman)
        const emails_mamans = mamans.map(m => m.created_by);
        const enfants = await base44.asServiceRole.entities.EnfantCarnet.filter({
          created_by: { $in: emails_mamans }
        });

        return Response.json({
          region,
          statistiques: {
            professionnels_sante: professionnels.length,
            utilisatrices_actives: mamans.length,
            grossesses_en_cours: grossesses.length,
            enfants_suivis: enfants.length,
            taux_vaccination: enfants.filter(e => (e.vaccins?.length || 0) >= 3).length / (enfants.length || 1) * 100
          }
        });
      }

      case 'rapport-sante': {
        if (!date_debut || !date_fin) {
          return Response.json({ error: 'Période requise' }, { status: 400 });
        }

        // Rapports existants
        const rapports = await base44.asServiceRole.entities.RapportSante.filter({
          periode_debut: { $gte: date_debut },
          periode_fin: { $lte: date_fin }
        });

        const rapportGlobal = {
          periode: `${date_debut} - ${date_fin}`,
          nombre_rapports: rapports.length,
          total_grossesses: rapports.reduce((sum, r) => sum + (r.indicateurs?.total_grossesses_suivies || 0), 0),
          total_accouchements: rapports.reduce((sum, r) => sum + (r.indicateurs?.accouchements || 0), 0),
          taux_cesarienne: rapports.reduce((sum, r) => sum + (r.indicateurs?.cesarienne_taux || 0), 0) / (rapports.length || 1),
          complications: rapports.flatMap(r => r.complications || [])
        };

        return Response.json(rapportGlobal);
      }

      case 'verification-professionnel': {
        if (!numero_ordre) {
          return Response.json({ error: 'Numéro d\'ordre requis' }, { status: 400 });
        }

        const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
          numero_ordre
        });

        if (professionnels.length === 0) {
          return Response.json({ 
            verifie: false,
            message: 'Professionnel non trouvé'
          });
        }

        const pro = professionnels[0];

        return Response.json({
          verifie: pro.compte_verifie,
          professionnel: {
            nom: pro.nom_complet,
            specialite: pro.specialite,
            numero_ordre: pro.numero_ordre,
            ville: pro.ville,
            region: pro.region,
            date_verification: pro.date_verification
          }
        });
      }

      default:
        return Response.json({
          error: 'Endpoint invalide',
          endpoints_disponibles: [
            'statistiques-region',
            'rapport-sante',
            'verification-professionnel'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});