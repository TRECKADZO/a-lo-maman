/**
 * 📄 CONTRAT D'UTILISATION API - A'lo Maman
 * Modèle de contrat pour établissements de santé partenaires
 */

export const contratPartenaireAPI = {
  metadata: {
    titre: "Contrat d'Accès et d'Utilisation de l'API A'lo Maman",
    version: "1.0",
    date_effet: "2025-01-01",
    juridiction: "Abidjan, Côte d'Ivoire",
    droit_applicable: "Droit ivoirien + RGPD européen"
  },

  // ============================================
  // ARTICLE 1 - OBJET DU CONTRAT
  // ============================================
  objet: `
Le présent contrat a pour objet de définir les conditions d'accès et d'utilisation
de l'API (Interface de Programmation Applicative) de la plateforme A'lo Maman
par les établissements de santé et professionnels partenaires.

L'API permet l'intégration de la plateforme A'lo Maman avec les systèmes d'information
hospitaliers (SIH), logiciels de gestion de cabinet, et applications tierces,
dans le respect strict de la réglementation en vigueur (RGPD, loi ivoirienne, HDS).
  `,

  // ============================================
  // ARTICLE 2 - DÉFINITIONS
  // ============================================
  definitions: {
    "API": "Interface de programmation permettant l'échange de données entre la plateforme A'lo Maman et le système du Partenaire",
    "Partenaire": "Établissement de santé, clinique, hôpital ou professionnel de santé utilisant l'API",
    "Patiente": "Utilisatrice de la plateforme A'lo Maman ayant créé un compte",
    "Données de Santé": "Données à caractère personnel concernant la santé physique ou mentale d'une personne (RGPD Art. 9)",
    "Clé API": "Identifiant secret permettant l'authentification du Partenaire",
    "DPA": "Data Processing Agreement (Accord de Traitement de Données)",
    "INS": "Identifiant National de Santé",
    "DMP": "Dossier Médical Partagé",
    "PSC": "Pro Santé Connect (authentification professionnels de santé)"
  },

  // ============================================
  // ARTICLE 3 - OBLIGATIONS DU PARTENAIRE
  // ============================================
  obligations_partenaire: [
    {
      titre: "3.1 - Sécurité de la Clé API",
      clauses: [
        "Le Partenaire s'engage à conserver la clé API de manière sécurisée",
        "La clé ne doit JAMAIS être exposée côté client (JavaScript navigateur, application mobile)",
        "La clé doit être stockée chiffrée (AES-256 minimum) côté serveur",
        "Rotation de la clé tous les 90 jours recommandée",
        "En cas de compromission suspectée, notification à A'lo Maman sous 24h"
      ]
    },
    {
      titre: "3.2 - Protection des Données de Santé",
      clauses: [
        "Le Partenaire s'engage à ne traiter les données que pour les finalités convenues",
        "Chiffrement obligatoire des données en transit (TLS 1.3) et au repos (AES-256)",
        "Pas de transfert hors Union Européenne sans accord écrit préalable",
        "Conservation limitée à la durée nécessaire (max 3 ans sauf obligation légale)",
        "Anonymisation ou pseudonymisation quand possible"
      ]
    },
    {
      titre: "3.3 - Consentement des Patientes",
      clauses: [
        "Le Partenaire ne peut accéder aux données d'une patiente qu'avec son consentement explicite",
        "Vérification du consentement via l'endpoint /api/consent/verify avant tout accès",
        "Respect du droit de retrait du consentement (effet immédiat)",
        "Information claire à la patiente sur les données partagées et les finalités"
      ]
    },
    {
      titre: "3.4 - Respect des Limites Techniques",
      clauses: [
        "Rate limiting : 1000 requêtes/heure par défaut (plan Freemium)",
        "Taille maximale des uploads : 10 MB par fichier",
        "Timeout des requêtes : 30 secondes",
        "Retry en cas d'erreur : backoff exponentiel requis (pas de flood)"
      ]
    },
    {
      titre: "3.5 - Audit et Traçabilité",
      clauses: [
        "Le Partenaire autorise A'lo Maman à logger toutes les requêtes API (audit trail)",
        "Logs conservés 10 ans pour données de santé (exigence HDS)",
        "Audit annuel de sécurité obligatoire (ISO 27001 ou équivalent)",
        "Notification de toute faille de sécurité sous 72h (RGPD Art. 33)"
      ]
    },
    {
      titre: "3.6 - Formation du Personnel",
      clauses: [
        "Formation RGPD annuelle obligatoire pour tout personnel accédant à l'API",
        "Sensibilisation à la confidentialité des données de santé",
        "Procédures internes documentées pour gestion des incidents"
      ]
    }
  ],

  // ============================================
  // ARTICLE 4 - OBLIGATIONS DE A'LO MAMAN
  // ============================================
  obligations_alomaman: [
    {
      titre: "4.1 - Disponibilité de l'API",
      engagement: "SLA 99.5% hors maintenance programmée",
      maintenance: "Fenêtre de maintenance : Dimanche 2h-5h GMT",
      notification: "Préavis 7 jours pour maintenance majeure"
    },
    {
      titre: "4.2 - Support Technique",
      canaux: [
        "Email : api@alomaman.com (réponse sous 24h ouvrées)",
        "Urgence : support-urgent@alomaman.com (réponse sous 4h)",
        "Documentation : https://alomaman.com/api-docs (mise à jour continue)"
      ]
    },
    {
      titre: "4.3 - Rétrocompatibilité",
      engagement: "Préavis 6 mois pour breaking changes",
      versioning: "Politique de versions sémantiques (MAJOR.MINOR.PATCH)",
      deprecation: "Endpoints dépréciés maintenus 12 mois minimum"
    },
    {
      titre: "4.4 - Sécurité",
      mesures: [
        "Chiffrement TLS 1.3 en transit",
        "Chiffrement AES-256 au repos",
        "Tests d'intrusion annuels par organisme tiers",
        "Bug bounty program actif",
        "Certification ISO 27001 en cours"
      ]
    }
  ],

  // ============================================
  // ARTICLE 5 - DATA PROCESSING AGREEMENT (DPA)
  // ============================================
  dpa: {
    titre: "Accord de Traitement de Données (RGPD Art. 28)",
    
    responsable_traitement: {
      nom: "La Patiente (personne concernée)",
      role: "Responsable de traitement de ses propres données de santé"
    },

    sous_traitant_1: {
      nom: "A'lo Maman SAS",
      role: "Sous-traitant (hébergement et traitement des données)",
      obligations: [
        "Traiter les données uniquement sur instruction",
        "Garantir la confidentialité",
        "Aider le responsable de traitement (export, suppression)",
        "Notifier toute violation dans les 24h"
      ]
    },

    sous_traitant_2: {
      nom: "Le Partenaire (clinique/hôpital)",
      role: "Sous-traitant ultérieur",
      obligations: [
        "Respecter les mêmes obligations que le sous-traitant principal",
        "Ne pas engager d'autre sous-traitant sans autorisation écrite",
        "Notifier A'lo Maman de toute violation sous 24h",
        "Restituer ou détruire les données en fin de contrat"
      ]
    },

    finalites_autorisees: [
      "Prise en charge médicale de la patiente",
      "Suivi de grossesse et post-partum",
      "Suivi pédiatrique 0-3 ans",
      "Téléconsultation et messagerie sécurisée",
      "Transmission de résultats d'examens",
      "Coordination des soins entre professionnels"
    ],

    finalites_interdites: [
      "Marketing direct sans consentement spécifique",
      "Revente ou cession de données à des tiers",
      "Profilage ou scoring sans base légale",
      "Recherche médicale sans consentement explicite séparé",
      "Transfert hors UE sans garanties appropriées"
    ],

    mesures_securite: [
      "Chiffrement bout-en-bout pour messagerie",
      "Contrôle d'accès basé sur les rôles (RBAC)",
      "Logs d'accès horodatés et signés",
      "Tests de pénétration annuels",
      "Formation RGPD du personnel"
    ],

    duree_conservation: {
      donnees_medicales: "10 ans après dernier acte (Code de la Santé Publique)",
      donnees_administratives: "3 ans après fin de relation",
      logs_audit: "10 ans (exigence HDS)",
      anonymisation: "Possible après durées légales minimales"
    },

    droits_personnes_concernees: [
      "Droit d'accès (export JSON/PDF dans les 30 jours)",
      "Droit de rectification (correction erreurs factuelles)",
      "Droit à l'effacement (sauf obligations légales)",
      "Droit à la portabilité (format JSON structuré)",
      "Droit d'opposition au traitement",
      "Droit de retrait du consentement (effet immédiat)"
    ]
  },

  // ============================================
  // ARTICLE 6 - TARIFICATION
  // ============================================
  tarification: {
    plans: [
      {
        nom: "Freemium",
        prix: "Gratuit",
        limite_requetes: "10 000 requêtes/mois",
        support: "Email (72h)",
        sla: "95%",
        ideal_pour: "Professionnels libéraux, petits cabinets"
      },
      {
        nom: "Professional",
        prix: "0.001 € par requête au-delà du quota Freemium",
        limite_requetes: "Illimité",
        support: "Email (24h)",
        sla: "99%",
        ideal_pour: "Cliniques moyennes, laboratoires",
        inclus: [
          "Webhooks illimités",
          "Accès API FHIR",
          "Dashboard analytics",
          "Support prioritaire"
        ]
      },
      {
        nom: "Enterprise",
        prix: "Sur devis (forfait mensuel)",
        limite_requetes: "Illimité",
        support: "Email + Téléphone (4h)",
        sla: "99.9%",
        ideal_pour: "CHU, grands groupes hospitaliers",
        inclus: [
          "Tous les avantages Professional",
          "Déploiement on-premise possible",
          "Intégration personnalisée",
          "Account manager dédié",
          "SLA sur-mesure"
        ]
      }
    ],

    facturation: {
      periode: "Mensuelle",
      paiement: "Virement bancaire ou carte (Stripe)",
      facturation_details: "Détail par endpoint et par jour",
      monnaie: "Euro (€)"
    },

    depassement: {
      notification: "Email automatique à 80% du quota",
      action: "Limitation à 100% (HTTP 429) sauf upgrade automatique activé",
      tarif_supplementaire: "0.001€ par requête supplémentaire"
    }
  },

  // ============================================
  // ARTICLE 7 - DURÉE ET RÉSILIATION
  // ============================================
  duree_resiliation: {
    duree_initiale: "12 mois à compter de la signature",
    renouvellement: "Tacite par période de 12 mois",
    
    resiliation_ordinaire: {
      preavis: "3 mois par lettre recommandée avec AR",
      effet: "Fin de la période en cours",
      restitution_donnees: "Export complet fourni sous 30 jours"
    },

    resiliation_immediate: {
      motifs: [
        "Violation grave des obligations de sécurité",
        "Utilisation frauduleuse de l'API",
        "Non-paiement après relance (plan payant)",
        "Atteinte à la réputation d'A'lo Maman",
        "Non-respect du RGPD après mise en demeure"
      ],
      consequences: [
        "Révocation immédiate de la clé API",
        "Suppression des accès",
        "Conservation des données pour preuve (10 ans max)",
        "Facturation prorata temporis"
      ]
    },

    fin_de_contrat: {
      acces_api: "Révocation immédiate",
      donnees_partenaire: "Suppression sous 30 jours sauf obligations légales",
      export_possible: "Oui, dans les 15 jours suivant résiliation",
      webhooks: "Désactivation automatique"
    }
  },

  // ============================================
  // ARTICLE 8 - RESPONSABILITÉ
  // ============================================
  responsabilite: {
    alomaman: {
      engage_sur: [
        "Disponibilité API selon SLA du plan souscrit",
        "Sécurité de l'infrastructure (chiffrement, sauvegardes)",
        "Conformité RGPD de la plateforme",
        "Support technique selon plan souscrit"
      ],
      limite: [
        "Responsabilité limitée au montant des sommes versées (12 derniers mois)",
        "Exclusion : dommages indirects (perte d'exploitation, manque à gagner)",
        "Exclusion : force majeure (catastrophe naturelle, cyberattaque massive)",
        "Exclusion : mauvaise utilisation de l'API par le Partenaire"
      ]
    },

    partenaire: {
      responsable_de: [
        "Exactitude des données transmises via l'API",
        "Sécurité de sa propre infrastructure (serveurs, réseau)",
        "Formation de son personnel au RGPD",
        "Obtention des consentements patients",
        "Respect du secret médical",
        "Incidents de sécurité côté Partenaire"
      ],
      assurance: "Assurance responsabilité civile professionnelle obligatoire (minimum 1M€)"
    },

    partage_responsabilite: {
      scenario: "Violation de données impliquant les deux parties",
      principe: "Responsabilité proportionnelle à la faute de chacun",
      enquete: "Investigation conjointe sous 48h",
      notification_cnil: "Sous-traitant détecteur doit notifier sous 24h"
    }
  },

  // ============================================
  // ARTICLE 9 - PROPRIÉTÉ INTELLECTUELLE
  // ============================================
  propriete_intellectuelle: {
    api: "A'lo Maman reste propriétaire exclusif de l'API, documentation, et marques",
    licence: "Licence d'utilisation non exclusive, non cessible, révocable",
    donnees_patientes: "Les patientes restent propriétaires de leurs données de santé",
    developments_partenaire: "Le Partenaire reste propriétaire de ses propres développements utilisant l'API",
    restrictions: [
      "Interdiction de reverse engineering de l'API",
      "Interdiction de créer une API concurrente basée sur A'lo Maman",
      "Usage de la marque 'A'lo Maman' limité à la promotion de l'intégration"
    ]
  },

  // ============================================
  // ARTICLE 10 - CONFIDENTIALITÉ
  // ============================================
  confidentialite: {
    informations_confidentielles: [
      "Clé API et credentials d'accès",
      "Documentation technique non publique",
      "Données de santé des patientes",
      "Termes commerciaux du contrat",
      "Données statistiques agrégées"
    ],
    duree: "Pendant la durée du contrat + 5 ans après résiliation",
    exceptions: [
      "Informations du domaine public",
      "Divulgation requise par la loi ou autorité judiciaire",
      "Informations développées indépendamment par le destinataire"
    ]
  },

  // ============================================
  // ARTICLE 11 - SCOPES ET PERMISSIONS
  // ============================================
  scopes_oauth: {
    description: "Scopes granulaires pour contrôle d'accès fin",
    
    scopes_disponibles: [
      {
        scope: "read:patients",
        description: "Lister et lire les profils des patientes de la clinique",
        sensibilite: "Moyenne",
        use_case: "Affichage liste patients dans SIH"
      },
      {
        scope: "write:patients",
        description: "Créer et modifier les profils patientes",
        sensibilite: "Haute",
        use_case: "Création dossier patient lors de première consultation"
      },
      {
        scope: "read:pregnancy",
        description: "Accéder aux suivis de grossesse",
        sensibilite: "Très haute",
        use_case: "Consultation des données obstétriques"
      },
      {
        scope: "write:pregnancy",
        description: "Enregistrer consultations prénatales, échographies",
        sensibilite: "Très haute",
        use_case: "Saisie compte-rendu consultation"
      },
      {
        scope: "read:children",
        description: "Accéder aux carnets de santé enfants",
        sensibilite: "Très haute",
        use_case: "Consultation calendrier vaccinal"
      },
      {
        scope: "write:vaccinations",
        description: "Enregistrer les vaccinations",
        sensibilite: "Haute",
        use_case: "Saisie vaccination après acte"
      },
      {
        scope: "read:documents",
        description: "Télécharger documents médicaux (ordonnances, résultats)",
        sensibilite: "Très haute",
        use_case: "Accès résultats labo depuis SIH"
      },
      {
        scope: "write:documents",
        description: "Uploader des documents médicaux",
        sensibilite: "Haute",
        use_case: "Transmission compte-rendu, ordonnance"
      },
      {
        scope: "read:appointments",
        description: "Consulter les rendez-vous",
        sensibilite: "Moyenne",
        use_case: "Synchronisation agenda"
      },
      {
        scope: "write:appointments",
        description: "Créer, modifier, annuler des rendez-vous",
        sensibilite: "Moyenne",
        use_case: "Prise de RDV intégrée"
      },
      {
        scope: "read:messages",
        description: "Lire la messagerie sécurisée",
        sensibilite: "Haute",
        use_case: "Consultation messages patients"
      },
      {
        scope: "write:messages",
        description: "Envoyer des messages aux patientes",
        sensibilite: "Haute",
        use_case: "Réponse aux questions patients"
      },
      {
        scope: "admin:webhooks",
        description: "Gérer les webhooks",
        sensibilite: "Basse",
        use_case: "Configuration notifications temps réel"
      },
      {
        scope: "admin:statistics",
        description: "Accéder statistiques agrégées anonymisées",
        sensibilite: "Basse",
        use_case: "Tableau de bord clinique"
      }
    ],

    combinaisons_recommandees: {
      cabinet_liberal: ["read:patients", "read:appointments", "write:appointments"],
      clinique_complete: ["read:patients", "write:patients", "read:pregnancy", "write:pregnancy", "read:documents", "write:documents", "admin:statistics"],
      laboratoire: ["read:patients", "write:documents"],
      pharmacie: ["read:patients", "read:documents"]
    }
  },

  // ============================================
  // ARTICLE 12 - ANNEXES
  // ============================================
  annexes: {
    annexe_a: {
      titre: "Liste des endpoints disponibles",
      url: "https://alomaman.com/api-docs"
    },
    annexe_b: {
      titre: "Politique de sécurité",
      contenu: "Voir components/api/SecurityCompliance.jsx"
    },
    annexe_c: {
      titre: "Format des webhooks",
      exemple: {
        event: "patient.created",
        timestamp: "2025-12-10T14:30:00Z",
        data: {
          patient_id: "pat_123",
          email: "patient@example.com",
          created_date: "2025-12-10T14:30:00Z"
        }
      },
      verification: "Header X-Alomaman-Signature (HMAC-SHA256)"
    },
    annexe_d: {
      titre: "Procédure de gestion des incidents",
      etapes: [
        "1. Détection et qualification de l'incident (< 1h)",
        "2. Notification A'lo Maman et patientes concernées (< 24h)",
        "3. Investigation conjointe (< 72h)",
        "4. Notification CNIL si violation RGPD (< 72h)",
        "5. Mesures correctives et rapport final (< 30 jours)"
      ]
    }
  },

  // ============================================
  // SIGNATURES
  // ============================================
  signatures: {
    pour_alomaman: {
      nom: "Représentant légal A'lo Maman SAS",
      fonction: "Directeur Général",
      date: "__/__/____",
      signature: "____________________"
    },
    pour_partenaire: {
      nom: "Représentant légal de l'établissement partenaire",
      fonction: "____________________",
      cachet_etablissement: "Obligatoire",
      date: "__/__/____",
      signature: "____________________"
    }
  }
};

export default contratPartenaireAPI;