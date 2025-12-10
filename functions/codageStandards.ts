import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Service de codage standardisé (ICD-10, LOINC, ATC)
 * Pour interopérabilité et statistiques de santé publique
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, query, code, category } = await req.json();

    switch (action) {
      case 'search_icd10':
        return searchICD10(query);
      
      case 'search_loinc':
        return searchLOINC(query);
      
      case 'search_medication':
        return searchMedicationATC(query);
      
      case 'validate_code':
        return validateCode(code, category);
      
      case 'get_stats':
        return getHealthStats(base44, user);
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Codage Standards Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Base de données ICD-10 (sous-ensemble grossesse/enfant)
const ICD10_DATABASE = {
  // Grossesse
  'O00': { code: 'O00', display: 'Grossesse extra-utérine', category: 'grossesse' },
  'O10': { code: 'O10', display: 'Hypertension préexistante compliquant la grossesse', category: 'grossesse' },
  'O14': { code: 'O14', display: 'Pré-éclampsie', category: 'grossesse' },
  'O20': { code: 'O20', display: 'Hémorragie précoce de la grossesse', category: 'grossesse' },
  'O24': { code: 'O24', display: 'Diabète sucré au cours de la grossesse', category: 'grossesse' },
  'O26': { code: 'O26', display: 'Soins maternels pour autres affections', category: 'grossesse' },
  'O30': { code: 'O30', display: 'Grossesse multiple', category: 'grossesse' },
  'O42': { code: 'O42', display: 'Rupture prématurée des membranes', category: 'grossesse' },
  'O60': { code: 'O60', display: 'Travail prématuré', category: 'grossesse' },
  'O80': { code: 'O80', display: 'Accouchement unique spontané', category: 'accouchement' },
  'O82': { code: 'O82', display: 'Accouchement unique par césarienne', category: 'accouchement' },
  
  // Nouveau-né
  'P07': { code: 'P07', display: 'Troubles liés à une courte durée de gestation et un poids faible à la naissance', category: 'nouveau_ne' },
  'P22': { code: 'P22', display: 'Détresse respiratoire du nouveau-né', category: 'nouveau_ne' },
  'P55': { code: 'P55', display: 'Maladie hémolytique du fœtus et du nouveau-né', category: 'nouveau_ne' },
  'P59': { code: 'P59', display: 'Ictère néonatal', category: 'nouveau_ne' },
  
  // Pédiatrie
  'A09': { code: 'A09', display: 'Diarrhée et gastro-entérite', category: 'pediatrie' },
  'B05': { code: 'B05', display: 'Rougeole', category: 'pediatrie' },
  'J06': { code: 'J06', display: 'Infections aiguës des voies respiratoires supérieures', category: 'pediatrie' },
  'J18': { code: 'J18', display: 'Pneumonie', category: 'pediatrie' },
  'R50': { code: 'R50', display: 'Fièvre', category: 'symptome' },
  'R63': { code: 'R63', display: 'Anomalie de la prise alimentaire', category: 'symptome' },
  'E40': { code: 'E40', display: 'Malnutrition protéino-énergétique sévère', category: 'nutrition' },
  'E46': { code: 'E46', display: 'Malnutrition protéino-énergétique, sans précision', category: 'nutrition' }
};

// Base LOINC (tests courants grossesse/pédiatrie)
const LOINC_DATABASE = {
  // Hématologie
  '718-7': { code: '718-7', display: 'Hémoglobine', unit: 'g/dL', normalRange: '12-16' },
  '6690-2': { code: '6690-2', display: 'Leucocytes', unit: '10^9/L', normalRange: '4-10' },
  '777-3': { code: '777-3', display: 'Plaquettes', unit: '10^9/L', normalRange: '150-400' },
  
  // Métabolisme
  '2339-0': { code: '2339-0', display: 'Glucose', unit: 'mg/dL', normalRange: '70-100' },
  '2345-7': { code: '2345-7', display: 'Glucose à jeun', unit: 'mg/dL', normalRange: '70-100' },
  '14749-6': { code: '14749-6', display: 'Glucose post-prandial', unit: 'mg/dL', normalRange: '<140' },
  
  // Rénal
  '2160-0': { code: '2160-0', display: 'Créatinine', unit: 'mg/dL', normalRange: '0.6-1.2' },
  '3094-0': { code: '3094-0', display: 'Urée', unit: 'mg/dL', normalRange: '15-40' },
  
  // Hépatique
  '1742-6': { code: '1742-6', display: 'ALAT (GPT)', unit: 'U/L', normalRange: '7-56' },
  '1920-8': { code: '1920-8', display: 'ASAT (GOT)', unit: 'U/L', normalRange: '10-40' },
  
  // Sérologies grossesse
  '22314-9': { code: '22314-9', display: 'Toxoplasmose IgG', unit: 'UI/mL', normalRange: 'Négatif/<10' },
  '22602-7': { code: '22602-7', display: 'Rubéole IgG', unit: 'UI/mL', normalRange: 'Négatif/<10' },
  '5195-3': { code: '5195-3', display: 'Hépatite B (HBsAg)', unit: '', normalRange: 'Négatif' },
  '7905-3': { code: '7905-3', display: 'VIH 1+2 anticorps', unit: '', normalRange: 'Négatif' },
  
  // Signes vitaux
  '8480-6': { code: '8480-6', display: 'Pression artérielle systolique', unit: 'mmHg', normalRange: '90-140' },
  '8462-4': { code: '8462-4', display: 'Pression artérielle diastolique', unit: 'mmHg', normalRange: '60-90' },
  '8867-4': { code: '8867-4', display: 'Fréquence cardiaque', unit: 'bpm', normalRange: '60-100' },
  '8310-5': { code: '8310-5', display: 'Température corporelle', unit: '°C', normalRange: '36.5-37.5' },
  '29463-7': { code: '29463-7', display: 'Poids corporel', unit: 'kg', normalRange: 'Variable' }
};

// Base ATC (médicaments courants)
const ATC_DATABASE = {
  // Antalgiques
  'N02BE01': { code: 'N02BE01', display: 'Paracétamol', dci: 'Paracétamol', grossesse: 'Autorisé', allaitement: 'Autorisé' },
  'N02BA01': { code: 'N02BA01', display: 'Aspirine', dci: 'Acide acétylsalicylique', grossesse: 'Contre-indiqué T3', allaitement: 'Précaution' },
  
  // Antibiotiques
  'J01CA04': { code: 'J01CA04', display: 'Amoxicilline', dci: 'Amoxicilline', grossesse: 'Autorisé', allaitement: 'Autorisé' },
  'J01CR02': { code: 'J01CR02', display: 'Amoxicilline/Acide clavulanique', dci: 'Amoxicilline', grossesse: 'Autorisé', allaitement: 'Autorisé' },
  
  // Vitamines grossesse
  'A11CC01': { code: 'A11CC01', display: 'Vitamine D', dci: 'Cholécalciférol', grossesse: 'Recommandé', allaitement: 'Recommandé' },
  'B03BA01': { code: 'B03BA01', display: 'Vitamine B9 (Acide folique)', dci: 'Acide folique', grossesse: 'Recommandé', allaitement: 'Recommandé' },
  'B03AA07': { code: 'B03AA07', display: 'Sulfate ferreux', dci: 'Fer', grossesse: 'Recommandé', allaitement: 'Autorisé' },
  
  // Anti-hypertenseurs
  'C03AA03': { code: 'C03AA03', display: 'Hydrochlorothiazide', dci: 'Hydrochlorothiazide', grossesse: 'Contre-indiqué', allaitement: 'Contre-indiqué' },
  'C09AA02': { code: 'C09AA02', display: 'Enalapril', dci: 'Enalapril', grossesse: 'Contre-indiqué', allaitement: 'Contre-indiqué' },
  'C08CA01': { code: 'C08CA01', display: 'Amlodipine', dci: 'Amlodipine', grossesse: 'Précaution', allaitement: 'Précaution' },
  
  // Anti-émétiques
  'A04AD01': { code: 'A04AD01', display: 'Scopolamine', dci: 'Scopolamine', grossesse: 'Autorisé', allaitement: 'Précaution' },
  'A03FA01': { code: 'A03FA01', display: 'Métoclopramide', dci: 'Métoclopramide', grossesse: 'Autorisé', allaitement: 'Contre-indiqué' }
};

async function searchICD10(query) {
  const lowerQuery = query.toLowerCase();
  const results = Object.values(ICD10_DATABASE).filter(item =>
    item.code.toLowerCase().includes(lowerQuery) ||
    item.display.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );

  return Response.json({
    success: true,
    results: results.slice(0, 20),
    total: results.length
  });
}

async function searchLOINC(query) {
  const lowerQuery = query.toLowerCase();
  const results = Object.values(LOINC_DATABASE).filter(item =>
    item.code.toLowerCase().includes(lowerQuery) ||
    item.display.toLowerCase().includes(lowerQuery)
  );

  return Response.json({
    success: true,
    results: results.slice(0, 20),
    total: results.length
  });
}

async function searchMedicationATC(query) {
  const lowerQuery = query.toLowerCase();
  const results = Object.values(ATC_DATABASE).filter(item =>
    item.code.toLowerCase().includes(lowerQuery) ||
    item.display.toLowerCase().includes(lowerQuery) ||
    item.dci.toLowerCase().includes(lowerQuery)
  );

  return Response.json({
    success: true,
    results: results.slice(0, 20),
    total: results.length
  });
}

async function validateCode(code, category) {
  let database, found;
  
  switch (category) {
    case 'icd10':
      database = ICD10_DATABASE;
      break;
    case 'loinc':
      database = LOINC_DATABASE;
      break;
    case 'atc':
      database = ATC_DATABASE;
      break;
    default:
      return Response.json({ error: 'Invalid category' }, { status: 400 });
  }

  found = database[code];

  return Response.json({
    success: true,
    valid: !!found,
    details: found || null
  });
}

async function getHealthStats(base44, user) {
  // Statistiques basées sur les codes ICD-10 utilisés
  const enfants = await base44.entities.EnfantCarnet.filter({ created_by: user.email });
  
  const stats = {
    total_enfants: enfants.length,
    pathologies_detectees: [],
    tests_recents: [],
    medicaments_actifs: []
  };

  // Analyser historique médical pour pathologies
  for (const enfant of enfants) {
    if (enfant.historique_medical) {
      for (const event of enfant.historique_medical) {
        if (event.diagnostic) {
          // Chercher code ICD-10 dans diagnostic
          const match = Object.keys(ICD10_DATABASE).find(code => 
            event.diagnostic.includes(code)
          );
          if (match) {
            stats.pathologies_detectees.push({
              enfant_nom: enfant.prenom,
              code: match,
              display: ICD10_DATABASE[match].display,
              date: event.date
            });
          }
        }
      }
    }
  }

  return Response.json({
    success: true,
    stats
  });
}