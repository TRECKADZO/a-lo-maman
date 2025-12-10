import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Fonction de codage ICD-10/ICD-11
 * Permet le codage standardisé des diagnostics
 * 
 * Endpoints:
 * - POST /icd/code - Coder un diagnostic
 * - GET /icd/search - Rechercher un code ICD
 * - GET /icd/stats - Statistiques épidémiologiques
 */

// Base de codes ICD-10 pour la santé maternelle et infantile
const ICD10_CODES = {
  // Grossesse
  'O00': { libelle: 'Grossesse extra-utérine', contexte: 'grossesse' },
  'O10': { libelle: 'Hypertension préexistante compliquant la grossesse', contexte: 'grossesse' },
  'O14': { libelle: 'Hypertension gravidique avec protéinurie importante [pré-éclampsie]', contexte: 'grossesse' },
  'O14.0': { libelle: 'Pré-éclampsie modérée', contexte: 'grossesse' },
  'O14.1': { libelle: 'Pré-éclampsie sévère', contexte: 'grossesse' },
  'O15': { libelle: 'Éclampsie', contexte: 'grossesse' },
  'O20': { libelle: 'Hémorragie du début de la grossesse', contexte: 'grossesse' },
  'O24': { libelle: 'Diabète sucré au cours de la grossesse', contexte: 'grossesse' },
  'O24.4': { libelle: 'Diabète sucré gestationnel', contexte: 'grossesse' },
  'O26.0': { libelle: 'Gain de poids excessif au cours de la grossesse', contexte: 'grossesse' },
  'O28': { libelle: 'Résultats anormaux de l\'examen prénatal de la mère', contexte: 'grossesse' },
  'O36': { libelle: 'Soins maternels pour autres problèmes fœtaux connus ou présumés', contexte: 'grossesse' },
  'O80': { libelle: 'Accouchement unique spontané', contexte: 'grossesse' },
  'O82': { libelle: 'Accouchement unique par césarienne', contexte: 'grossesse' },
  
  // Post-partum
  'O85': { libelle: 'Sepsis puerpéral', contexte: 'post_partum' },
  'O86': { libelle: 'Autres infections puerpérales', contexte: 'post_partum' },
  'O90': { libelle: 'Complications de la puerpéralité', contexte: 'post_partum' },
  'O92': { libelle: 'Autres affections du sein et de la lactation', contexte: 'post_partum' },
  
  // Pédiatrie - Nouveau-nés
  'P05': { libelle: 'Retard de croissance fœtale et dénutrition fœtale', contexte: 'enfant' },
  'P07': { libelle: 'Troubles liés à une durée de gestation courte et un poids faible', contexte: 'enfant' },
  'P22': { libelle: 'Détresse respiratoire du nouveau-né', contexte: 'enfant' },
  'P55': { libelle: 'Maladie hémolytique du fœtus et du nouveau-né', contexte: 'enfant' },
  'P59': { libelle: 'Ictère néonatal dû à d\'autres causes', contexte: 'enfant' },
  
  // Maladies infectieuses infantiles
  'A00': { libelle: 'Choléra', contexte: 'enfant' },
  'A09': { libelle: 'Diarrhée et gastro-entérite', contexte: 'enfant' },
  'B05': { libelle: 'Rougeole', contexte: 'enfant' },
  'B15': { libelle: 'Hépatite aiguë A', contexte: 'enfant' },
  'B16': { libelle: 'Hépatite aiguë B', contexte: 'enfant' },
  'J00': { libelle: 'Rhinopharyngite aiguë', contexte: 'enfant' },
  'J06': { libelle: 'Infections aiguës des voies respiratoires supérieures', contexte: 'enfant' },
  'J18': { libelle: 'Pneumonie, organisme non précisé', contexte: 'enfant' },
  
  // Malnutrition
  'E40': { libelle: 'Kwashiorkor', contexte: 'enfant' },
  'E41': { libelle: 'Marasme nutritionnel', contexte: 'enfant' },
  'E43': { libelle: 'Malnutrition protéino-énergétique sévère', contexte: 'enfant' },
  'E44': { libelle: 'Malnutrition protéino-énergétique modérée et légère', contexte: 'enfant' },
  'E46': { libelle: 'Malnutrition protéino-énergétique, sans précision', contexte: 'enfant' },
  
  // Retards développement
  'F80': { libelle: 'Troubles spécifiques du développement de la parole et du langage', contexte: 'enfant' },
  'F82': { libelle: 'Trouble spécifique du développement moteur', contexte: 'enfant' },
  'F88': { libelle: 'Autres troubles du développement psychologique', contexte: 'enfant' }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const method = req.method;

    // POST /icd/code - Coder un diagnostic
    if (method === 'POST' && path[2] === 'code') {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();

      const codeDiagnostic = {
        patient_email: body.patientEmail,
        code_icd10: body.icd10Code,
        code_icd11: body.icd11Code || null,
        libelle_diagnostic: ICD10_CODES[body.icd10Code]?.libelle || body.diagnosticLabel,
        type_diagnostic: body.diagnosticType || 'principal',
        date_diagnostic: body.diagnosticDate || new Date().toISOString().split('T')[0],
        professionnel_id: user.id,
        professionnel_nom: user.full_name,
        contexte: body.context || ICD10_CODES[body.icd10Code]?.contexte || 'general',
        severite: body.severity || 'moderate',
        statut: body.status || 'actif',
        notes_cliniques: body.clinicalNotes || '',
        codes_snomed_associes: body.snomedCodes || [],
        consultation_id: body.consultationId || null
      };

      const created = await base44.asServiceRole.entities.CodeDiagnostic.create(codeDiagnostic);

      return Response.json({
        success: true,
        diagnosticId: created.id,
        code: created.code_icd10,
        label: created.libelle_diagnostic
      }, { status: 201 });
    }

    // GET /icd/search?query=diabete
    if (method === 'GET' && path[2] === 'search') {
      const searchQuery = url.searchParams.get('query')?.toLowerCase() || '';
      
      if (!searchQuery) {
        return Response.json({ error: 'Query parameter required' }, { status: 400 });
      }

      const results = Object.entries(ICD10_CODES)
        .filter(([code, data]) => 
          code.toLowerCase().includes(searchQuery) ||
          data.libelle.toLowerCase().includes(searchQuery)
        )
        .map(([code, data]) => ({
          code: code,
          label: data.libelle,
          context: data.contexte
        }))
        .slice(0, 20);

      return Response.json({
        success: true,
        query: searchQuery,
        results: results,
        total: results.length
      });
    }

    // GET /icd/stats - Statistiques épidémiologiques
    if (method === 'GET' && path[2] === 'stats') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      const diagnostics = await base44.asServiceRole.entities.CodeDiagnostic.list();

      // Agrégations
      const stats = {
        total_diagnostics: diagnostics.length,
        par_code: {},
        par_contexte: {},
        par_severite: {},
        tendances_mensuelles: {}
      };

      diagnostics.forEach(diag => {
        // Par code
        stats.par_code[diag.code_icd10] = (stats.par_code[diag.code_icd10] || 0) + 1;
        
        // Par contexte
        stats.par_contexte[diag.contexte] = (stats.par_contexte[diag.contexte] || 0) + 1;
        
        // Par sévérité
        stats.par_severite[diag.severite] = (stats.par_severite[diag.severite] || 0) + 1;
        
        // Tendances mensuelles
        const mois = diag.date_diagnostic?.substring(0, 7); // YYYY-MM
        if (mois) {
          stats.tendances_mensuelles[mois] = (stats.tendances_mensuelles[mois] || 0) + 1;
        }
      });

      // Top 10 diagnostics
      const top10 = Object.entries(stats.par_code)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, count]) => ({
          code: code,
          label: ICD10_CODES[code]?.libelle || code,
          count: count,
          percentage: ((count / diagnostics.length) * 100).toFixed(1)
        }));

      return Response.json({
        success: true,
        stats: {
          ...stats,
          top10_diagnostics: top10
        },
        generated_at: new Date().toISOString()
      });
    }

    return Response.json({
      error: 'Endpoint not found',
      availableEndpoints: [
        'POST /icd/code',
        'GET /icd/search?query=...',
        'GET /icd/stats'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('Erreur ICD:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});