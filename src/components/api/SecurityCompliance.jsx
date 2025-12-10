/**
 * 📋 PLAN DE CONFORMITÉ RGPD / HDS pour A'lo Maman
 * 
 * Ce document guide l'implémentation de la conformité réglementaire
 * pour une plateforme de santé maternelle et infantile en France
 */

export const compliancePlan = {
  // ============================================
  // 1. CONFORMITÉ RGPD (Obligatoire)
  // ============================================
  rgpd: {
    principes: [
      {
        principe: "Minimisation des données",
        actions: [
          "Ne collecter que les données strictement nécessaires au service",
          "Pas de collecte de données sensibles sans justification médicale",
          "Limitation de la durée de conservation (3 ans post-traitement)"
        ],
        statut: "✅ Implémenté dans les entités Base44"
      },
      {
        principe: "Consentement explicite",
        actions: [
          "Email de consentement lors de la création du compte",
          "Cases à cocher pour chaque finalité (soin, recherche, marketing)",
          "Possibilité de retirer le consentement à tout moment",
          "Traçabilité des consentements dans l'entité ConsentementBPPC"
        ],
        statut: "✅ Entité ConsentementBPPC créée",
        implementation: {
          entity: "ConsentementBPPC",
          fields: ["policy_type", "decision", "date_time", "expiration_date"]
        }
      },
      {
        principe: "Droit d'accès et portabilité",
        actions: [
          "Export JSON de toutes les données utilisateur",
          "Génération PDF du dossier médical complet",
          "API pour transférer les données vers autre plateforme"
        ],
        statut: "⚠️ À implémenter",
        priority: "HAUTE",
        code_example: `
// Fonction d'export à créer
export async function exportUserData(userEmail) {
  const data = {
    profil: await base44.entities.ProfilMaman.filter({ created_by: userEmail }),
    grossesses: await base44.entities.SuiviGrossesse.filter({ patient_email: userEmail }),
    enfants: await base44.entities.EnfantCarnet.filter({ created_by: userEmail }),
    documents: await base44.entities.DocumentMedical.filter({ patient_email: userEmail }),
    // ...
  };
  return data;
}
        `
      },
      {
        principe: "Droit à l'oubli",
        actions: [
          "Fonction d'anonymisation (remplacer nom/email par hash)",
          "Conservation anonymisée pour obligations légales (10 ans)",
          "Suppression définitive après délai légal"
        ],
        statut: "⚠️ À implémenter",
        priority: "HAUTE",
        code_example: `
// Fonction d'anonymisation
export async function anonymizeUser(userId) {
  const hash = crypto.randomUUID();
  await base44.entities.ProfilMaman.update(userId, {
    nom_complet: 'ANONYMISÉ_' + hash,
    email: hash + '@anonymise.alomaman.com',
    telephone: null,
    // ...
  });
}
        `
      },
      {
        principe: "Registre des traitements",
        actions: [
          "Documenter chaque traitement de données (finalité, base légale, durée)",
          "Registre accessible à la CNIL sur demande"
        ],
        statut: "📄 Document à créer",
        template: {
          traitement: "Suivi de grossesse",
          finalite: "Prise en charge médicale",
          base_legale: "Consentement explicite",
          categories_donnees: ["Santé", "Identification"],
          duree_conservation: "3 ans après accouchement",
          destinataires: ["Professionnels de santé autorisés"],
          transferts_hors_ue: "Non"
        }
      }
    ],
    
    audit_trail: {
      description: "Traçabilité obligatoire pour données de santé",
      implementation: {
        builtin: "created_by, created_date, updated_date dans toutes les entités",
        custom: "Logs d'accès aux documents sensibles",
        retention: "10 ans minimum"
      },
      code_example: `
// Ajouter un log d'accès
await base44.entities.AuditLog.create({
  action: 'document.accessed',
  user_email: currentUser.email,
  user_role: currentUser.role,
  resource_type: 'DocumentMedical',
  resource_id: documentId,
  patient_email: patientEmail,
  timestamp: new Date().toISOString(),
  ip_address: req.headers.get('x-forwarded-for'),
  success: true
});
      `
    }
  },

  // ============================================
  // 2. CERTIFICATION HDS (Hébergement Données de Santé)
  // ============================================
  hds: {
    description: "Certification obligatoire en France pour héberger des données de santé",
    
    prerequis: [
      {
        exigence: "Hébergeur certifié HDS",
        statut: "⚠️ CRITIQUE",
        action: "Base44 doit être hébergé sur un provider HDS (OVHcloud Santé, Azure France, AWS HIPAA)",
        note: "À vérifier avec Base44 ou migrer l'hébergement"
      },
      {
        exigence: "Chiffrement au repos (AES-256)",
        statut: "✅ Assumé par Base44/Supabase",
        verification: "Vérifier dans les paramètres Supabase"
      },
      {
        exigence: "Chiffrement en transit (TLS 1.3)",
        statut: "✅ HTTPS actif",
        verification: "Forcer TLS 1.3 minimum dans configuration serveur"
      },
      {
        exigence: "Sauvegarde quotidienne chiffrée",
        statut: "✅ Assumé par Base44",
        verification: "Configurer politique backup Supabase"
      },
      {
        exigence: "Plan de reprise d'activité (PRA)",
        statut: "📄 Document à créer",
        contenu: [
          "RPO (Recovery Point Objective): 24h max",
          "RTO (Recovery Time Objective): 4h max",
          "Procédure de restauration documentée",
          "Tests de restauration trimestriels"
        ]
      },
      {
        exigence: "Gestion des accès (IAM)",
        statut: "⚠️ À renforcer",
        actions: [
          "MFA obligatoire pour admins",
          "Révision trimestrielle des droits",
          "Logs des connexions conservés 1 an"
        ]
      }
    ],

    audit_conformite: {
      description: "Audit annuel obligatoire pour maintenir la certification HDS",
      checklist: [
        "Registre des traitements à jour",
        "PRA testé dans les 6 derniers mois",
        "Analyse de risques (EBIOS RM)",
        "Formation RGPD du personnel (annuelle)",
        "Contrats DPA avec sous-traitants",
        "Politique de gestion des incidents de sécurité"
      ],
      organisme: "COFRAC ou organisme accrédité"
    }
  },

  // ============================================
  // 3. SÉCURITÉ API
  // ============================================
  api_security: {
    authentication: {
      method: "API Key (X-API-Key header)",
      storage: "Secrets chiffrés côté serveur uniquement",
      rotation: "Rotation des clés tous les 90 jours recommandée",
      revocation: "Révocation instantanée possible"
    },

    rate_limiting: {
      default: "1000 requêtes/heure par clé",
      burst: "100 requêtes/minute",
      action_on_exceed: "HTTP 429 + Retry-After header"
    },

    input_validation: {
      description: "Validation stricte de tous les inputs",
      rules: [
        "Validation des emails (format + existence MX)",
        "Validation des dates (format ISO 8601)",
        "Sanitization des strings (XSS protection)",
        "Limite taille uploads (10 MB max par défaut)"
      ]
    },

    audit_logging: {
      log_all: [
        "Authentification (succès + échecs)",
        "Accès aux données patient",
        "Modifications de données sensibles",
        "Tentatives d'accès non autorisées"
      ],
      retention: "10 ans (données de santé)",
      format: "JSON structuré avec timestamp, user, action, resource"
    }
  },

  // ============================================
  // 4. WEBHOOKS SÉCURISÉS
  // ============================================
  webhooks_security: {
    https_only: {
      rule: "URL HTTPS obligatoire (TLS 1.3)",
      verification: "Validation au moment de l'enregistrement",
      rejection: "HTTP URLs rejetées automatiquement"
    },

    signature_hmac: {
      algorithm: "HMAC-SHA256",
      header: "X-Alomaman-Signature",
      secret: "Généré automatiquement ou fourni par clinique",
      verification_code: `
// Vérification côté clinique
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
      `
    },

    retry_policy: {
      attempts: 3,
      backoff: "Exponentiel (1s, 5s, 25s)",
      timeout: "30 secondes par tentative",
      failure_notification: "Email admin clinique après 3 échecs"
    }
  },

  // ============================================
  // 5. CONTRAT PARTENAIRE / CGU API
  // ============================================
  legal_documents: {
    contrat_api: {
      clauses_essentielles: [
        {
          clause: "Objet du contrat",
          contenu: "Accès API A'lo Maman pour intégration système d'information clinique"
        },
        {
          clause: "Obligations du partenaire",
          contenu: [
            "Sécuriser la clé API (ne pas exposer)",
            "Respecter le rate limiting",
            "Notifier toute fuite de données sous 72h",
            "Formation personnel à la confidentialité",
            "Audit annuel de sécurité"
          ]
        },
        {
          clause: "Traitement des données (DPA)",
          contenu: [
            "Le partenaire est sous-traitant au sens RGPD",
            "Traitement limité aux finalités convenues",
            "Pas de transfert hors UE sans accord écrit",
            "Suppression des données en fin de contrat"
          ]
        },
        {
          clause: "Responsabilité",
          contenu: [
            "A'lo Maman: disponibilité API 99.5% hors maintenance",
            "Partenaire: exactitude données transmises",
            "Exclusion responsabilité en cas de force majeure"
          ]
        },
        {
          clause: "Tarification",
          contenu: [
            "Freemium: 10 000 requêtes/mois gratuites",
            "Pro: 0.001€ par requête au-delà",
            "Enterprise: forfait sur-mesure"
          ]
        },
        {
          clause: "Durée et résiliation",
          contenu: [
            "Durée: 1 an renouvelable tacitement",
            "Résiliation: 3 mois de préavis",
            "Résiliation immédiate en cas de violation sécurité"
          ]
        }
      ]
    },

    cgu_api: {
      url: "https://alomaman.com/api-terms",
      points_cles: [
        "Acceptation obligatoire avant première utilisation",
        "Mise à jour avec préavis 30 jours",
        "Droit applicable: France",
        "Juridiction: Tribunaux d'Abidjan, Côte d'Ivoire"
      ]
    }
  },

  // ============================================
  // 6. ROADMAP CONFORMITÉ (6 MOIS)
  // ============================================
  roadmap: [
    {
      phase: "Mois 1-2: Fondations RGPD",
      tasks: [
        "✅ Entités Base44 avec RLS (fait)",
        "✅ Consentements BPPC (fait)",
        "⚠️ Implémenter export données utilisateur",
        "⚠️ Implémenter droit à l'oubli/anonymisation",
        "⚠️ Créer registre des traitements"
      ]
    },
    {
      phase: "Mois 3-4: Sécurité API",
      tasks: [
        "✅ API Clinique + API Publique (fait)",
        "✅ Webhooks avec HMAC (fait)",
        "✅ Documentation OpenAPI (fait)",
        "⚠️ Rate limiting avancé",
        "⚠️ Audit logging centralisé"
      ]
    },
    {
      phase: "Mois 5-6: Préparation HDS",
      tasks: [
        "Vérifier hébergement certifié HDS",
        "Rédiger PRA (Plan Reprise Activité)",
        "Analyse de risques EBIOS RM",
        "Contrats DPA avec cliniques pilotes",
        "Audit blanc pré-certification"
      ]
    }
  ],

  // ============================================
  // 7. CONTACTS UTILES
  // ============================================
  contacts: {
    cnil: {
      nom: "Commission Nationale Informatique et Libertés",
      url: "https://www.cnil.fr",
      email: "contact@cnil.fr",
      role: "Autorité de contrôle RGPD en France"
    },
    cofrac: {
      nom: "Comité Français d'Accréditation",
      url: "https://www.cofrac.fr",
      role: "Accréditation organismes certification HDS"
    },
    asip_sante: {
      nom: "Agence du Numérique en Santé",
      url: "https://esante.gouv.fr",
      role: "Interopérabilité DMP, Pro Santé Connect"
    }
  }
};

export default compliancePlan;