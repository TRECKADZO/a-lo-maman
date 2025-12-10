/**
 * Helper pour gérer les codes cliniques (ICD-10, LOINC, SNOMED CT, ATC)
 */
export class ClinicalCodesHelper {
  
  // ICD-10 Codes fréquents en santé maternelle et infantile
  static ICD10_COMMON = {
    // Grossesse
    "O00-O09": { display: "Grossesse avec issue abortive", category: "grossesse" },
    "O10": { display: "Hypertension préexistante compliquant la grossesse", category: "grossesse" },
    "O11": { display: "Troubles hypertensifs préexistants avec protéinurie", category: "grossesse" },
    "O12": { display: "Œdème et protéinurie gestationnels sans hypertension", category: "grossesse" },
    "O13": { display: "Hypertension gestationnelle sans protéinurie", category: "grossesse" },
    "O14": { display: "Hypertension gestationnelle avec protéinurie (pré-éclampsie)", category: "grossesse", severity: "high" },
    "O14.0": { display: "Pré-éclampsie modérée", category: "grossesse", severity: "medium" },
    "O14.1": { display: "Pré-éclampsie sévère", category: "grossesse", severity: "critical" },
    "O15": { display: "Éclampsie", category: "grossesse", severity: "critical" },
    "O24": { display: "Diabète sucré au cours de la grossesse", category: "grossesse", severity: "high" },
    "O24.0": { display: "Diabète sucré préexistant, type 1", category: "grossesse" },
    "O24.1": { display: "Diabète sucré préexistant, type 2", category: "grossesse" },
    "O24.4": { display: "Diabète sucré gestationnel", category: "grossesse", severity: "medium" },
    "O26.0": { display: "Prise de poids excessive au cours de la grossesse", category: "grossesse" },
    "O36": { display: "Soins maternels pour problèmes fœtaux", category: "grossesse" },
    "O80": { display: "Accouchement unique spontané", category: "grossesse" },
    "O82": { display: "Accouchement unique par césarienne", category: "grossesse" },
    
    // Pédiatrie
    "P00-P96": { display: "Affections périnatales", category: "pediatrie" },
    "P05": { display: "Retard de croissance du fœtus et malnutrition fœtale", category: "pediatrie", severity: "high" },
    "P07": { display: "Troubles liés à une durée de gestation courte et un poids faible", category: "pediatrie" },
    "P22": { display: "Détresse respiratoire du nouveau-né", category: "pediatrie", severity: "critical" },
    "P59": { display: "Ictère néonatal", category: "pediatrie", severity: "medium" },
    "Z00.1": { display: "Examen de santé de l'enfant", category: "pediatrie" },
    "Z20-Z29": { display: "Vaccinations", category: "pediatrie" },
    "Z23": { display: "Vaccination unique contre une maladie bactérienne", category: "pediatrie" },
    "Z25": { display: "Vaccination unique contre une maladie virale", category: "pediatrie" },
    
    // Contraception
    "Z30": { display: "Soins relatifs à la contraception", category: "contraception" },
    "Z30.0": { display: "Conseil et avis généraux sur la contraception", category: "contraception" },
    "Z30.1": { display: "Insertion de dispositif contraceptif", category: "contraception" },
    "Z30.2": { display: "Stérilisation", category: "contraception" },
    "Z30.4": { display: "Surveillance de l'utilisation de moyens contraceptifs", category: "contraception" },
  };

  // LOINC Codes pour tests de laboratoire
  static LOINC_COMMON = {
    // Hématologie
    "718-7": { display: "Hémoglobine", unit: "g/dL", normal_range: { min: 12, max: 16 }, category: "laboratoire" },
    "787-2": { display: "Hématocrite", unit: "%", normal_range: { min: 36, max: 46 }, category: "laboratoire" },
    "6690-2": { display: "Leucocytes", unit: "/mm³", category: "laboratoire" },
    "777-3": { display: "Plaquettes", unit: "/mm³", category: "laboratoire" },
    
    // Glycémie
    "2339-0": { display: "Glucose (sérum/plasma)", unit: "mg/dL", category: "laboratoire" },
    "1558-6": { display: "Glucose à jeun", unit: "mg/dL", normal_range: { min: 70, max: 100 }, category: "laboratoire" },
    "1521-4": { display: "Glucose post-prandial 2h", unit: "mg/dL", category: "laboratoire" },
    "4548-4": { display: "HbA1c", unit: "%", normal_range: { max: 5.7 }, category: "laboratoire" },
    
    // Sérologies grossesse
    "5195-3": { display: "Hépatite B surface antigen", category: "laboratoire" },
    "22314-9": { display: "HIV 1+2 tests", category: "laboratoire" },
    "5290-2": { display: "Toxoplasma gondii IgG", category: "laboratoire" },
    "5301-7": { display: "Toxoplasma gondii IgM", category: "laboratoire" },
    "5334-8": { display: "Rubella virus IgG", category: "laboratoire" },
    
    // Fonction rénale
    "2160-0": { display: "Créatinine", unit: "mg/dL", category: "laboratoire" },
    "3094-0": { display: "Urée", unit: "mg/dL", category: "laboratoire" },
    "2889-4": { display: "Protéinurie", unit: "g/24h", category: "laboratoire" },
    
    // Croissance enfant
    "29463-7": { display: "Poids corporel", unit: "kg", category: "observation" },
    "8302-2": { display: "Taille", unit: "cm", category: "observation" },
    "9843-4": { display: "Périmètre crânien", unit: "cm", category: "observation" },
    "39156-5": { display: "IMC", unit: "kg/m²", category: "observation" },
    
    // Signes vitaux
    "8310-5": { display: "Température corporelle", unit: "°C", category: "observation" },
    "8867-4": { display: "Fréquence cardiaque", unit: "bpm", category: "observation" },
    "8480-6": { display: "Pression artérielle systolique", unit: "mmHg", category: "observation" },
    "8462-4": { display: "Pression artérielle diastolique", unit: "mmHg", category: "observation" },
  };

  // SNOMED CT Codes (sélection)
  static SNOMED_CT_COMMON = {
    // Grossesse
    "77386006": { display: "Grossesse", category: "diagnostic" },
    "72892002": { display: "Grossesse normale", category: "diagnostic" },
    "47200007": { display: "Hypertension artérielle gravidique", category: "diagnostic" },
    "398254007": { display: "Pré-éclampsie", category: "diagnostic" },
    "11687002": { display: "Diabète gestationnel", category: "diagnostic" },
    
    // Accouchement
    "3950001": { display: "Accouchement par voie basse", category: "procedure" },
    "11466000": { display: "Césarienne", category: "procedure" },
    "236973005": { display: "Délivrance", category: "procedure" },
    
    // Pédiatrie
    "276610007": { display: "Nouveau-né en bonne santé", category: "diagnostic" },
    "414916001": { display: "Prématurité", category: "diagnostic" },
    "267258002": { display: "Retard de croissance", category: "diagnostic" },
    
    // Vaccinations
    "33879002": { display: "Administration de vaccin", category: "procedure" },
    "170433008": { display: "Vaccination BCG", category: "procedure" },
    "170370000": { display: "Vaccination DTP", category: "procedure" },
  };

  // ATC Codes (médicaments)
  static ATC_COMMON = {
    // Vitamines grossesse
    "A11CC01": { display: "Vitamine B9 (Acide folique)", pregnancy_safe: true, category: "medicament" },
    "A11CC04": { display: "Vitamine B12", pregnancy_safe: true, category: "medicament" },
    "A11CA01": { display: "Vitamine A (Rétinol)", pregnancy_safe: false, category: "medicament" },
    "A11CC05": { display: "Vitamine D3", pregnancy_safe: true, category: "medicament" },
    
    // Fer
    "B03AA": { display: "Préparations de fer oral", pregnancy_safe: true, category: "medicament" },
    "B03AA07": { display: "Sulfate ferreux", pregnancy_safe: true, category: "medicament" },
    
    // Analgésiques
    "N02BE01": { display: "Paracétamol", pregnancy_safe: true, breastfeeding_safe: true, category: "medicament" },
    "M01AE01": { display: "Ibuprofène", pregnancy_safe: false, category: "medicament" },
    
    // Antibiotiques sûrs grossesse
    "J01CA04": { display: "Amoxicilline", pregnancy_safe: true, category: "medicament" },
    "J01CR02": { display: "Amoxicilline + Acide clavulanique", pregnancy_safe: true, category: "medicament" },
    
    // Contraception
    "G03AA": { display: "Progestatifs et estrogènes, associations séquentielles", category: "medicament" },
    "G03AC": { display: "Progestatifs", category: "medicament" },
  };

  // Recherche de code
  static searchCode(query, standard = "all") {
    const results = [];
    const lowerQuery = query.toLowerCase();

    const searchIn = (codes, standardName) => {
      Object.entries(codes).forEach(([code, data]) => {
        if (
          code.toLowerCase().includes(lowerQuery) ||
          data.display.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            standard: standardName,
            code,
            ...data
          });
        }
      });
    };

    if (standard === "all" || standard === "ICD10") {
      searchIn(this.ICD10_COMMON, "ICD10");
    }
    if (standard === "all" || standard === "LOINC") {
      searchIn(this.LOINC_COMMON, "LOINC");
    }
    if (standard === "all" || standard === "SNOMED_CT") {
      searchIn(this.SNOMED_CT_COMMON, "SNOMED_CT");
    }
    if (standard === "all" || standard === "ATC") {
      searchIn(this.ATC_COMMON, "ATC");
    }

    return results;
  }

  // Obtenir un code spécifique
  static getCode(code, standard) {
    const maps = {
      ICD10: this.ICD10_COMMON,
      LOINC: this.LOINC_COMMON,
      SNOMED_CT: this.SNOMED_CT_COMMON,
      ATC: this.ATC_COMMON
    };

    return maps[standard]?.[code];
  }

  // Vérifier si un médicament est sûr pendant la grossesse
  static isSafeInPregnancy(atcCode) {
    const med = this.ATC_COMMON[atcCode];
    return med?.pregnancy_safe === true;
  }

  // Vérifier si un médicament est sûr pendant l'allaitement
  static isSafeInBreastfeeding(atcCode) {
    const med = this.ATC_COMMON[atcCode];
    return med?.breastfeeding_safe === true;
  }
}

export default ClinicalCodesHelper;