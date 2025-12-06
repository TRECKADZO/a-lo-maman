// Analyse IA des données de santé
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type_analyse, donnees } = await req.json();

    let prompt = '';
    let schema = {};

    switch (type_analyse) {
      case 'symptomes_grossesse':
        prompt = `
Tu es un assistant médical spécialisé en santé maternelle. Analyse les symptômes suivants rapportés par une femme enceinte:

Symptômes: ${JSON.stringify(donnees.symptomes)}
Semaine de grossesse: ${donnees.semaine_grossesse}
Antécédents: ${donnees.antecedents || 'Aucun'}

Fournis une analyse des symptômes avec:
1. Évaluation du niveau d'urgence (faible/moyen/élevé/urgent)
2. Recommandations
3. Si consultation nécessaire

IMPORTANT: Tu ne poses pas de diagnostic, tu donnes des conseils généraux. En cas de doute, recommande de consulter.
`;
        schema = {
          type: 'object',
          properties: {
            niveau_urgence: { type: 'string', enum: ['faible', 'moyen', 'eleve', 'urgent'] },
            analyse: { type: 'string' },
            recommandations: { type: 'array', items: { type: 'string' } },
            consulter: { type: 'boolean' },
            motif_consultation: { type: 'string' }
          }
        };
        break;

      case 'croissance_enfant':
        prompt = `
Tu es un assistant pédiatrique. Analyse les données de croissance suivantes pour un enfant:

Âge: ${donnees.age_mois} mois
Poids: ${donnees.poids} kg
Taille: ${donnees.taille} cm
Périmètre crânien: ${donnees.perimetre_cranien || 'Non mesuré'} cm
Historique: ${JSON.stringify(donnees.historique || [])}

Analyse si la croissance est normale selon les courbes OMS et donne des recommandations.
`;
        schema = {
          type: 'object',
          properties: {
            evaluation: { type: 'string' },
            percentile_poids: { type: 'string' },
            percentile_taille: { type: 'string' },
            alerte: { type: 'boolean' },
            recommandations: { type: 'array', items: { type: 'string' } }
          }
        };
        break;

      case 'rappels_vaccins':
        prompt = `
Analyse le calendrier vaccinal de cet enfant en Côte d'Ivoire:

Âge: ${donnees.age_mois} mois
Vaccins reçus: ${JSON.stringify(donnees.vaccins_recus)}

Liste les vaccins manquants ou en retard selon le calendrier vaccinal ivoirien (PEV).
`;
        schema = {
          type: 'object',
          properties: {
            vaccins_jour: { type: 'array', items: { type: 'string' } },
            vaccins_retard: { type: 'array', items: { type: 'string' } },
            prochains_vaccins: { type: 'array', items: { type: 'object', properties: { nom: { type: 'string' }, age_mois: { type: 'integer' } } } },
            recommandation: { type: 'string' }
          }
        };
        break;

      default:
        return Response.json({ error: 'Type d\'analyse non reconnu' }, { status: 400 });
    }

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    return Response.json({
      success: true,
      type_analyse,
      resultat: response
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});