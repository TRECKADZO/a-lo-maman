/**
 * Middleware de sécurité pour endpoints FHIR
 * Vérification des autorisations basée sur les rôles et scopes
 */

export class FHIRSecurityMiddleware {
  
  /**
   * Vérifier si une clinique/professionnel a accès à une ressource
   */
  static async verifyAccess(base44, apiKey, resourceType, resource, operation) {
    // 1. Récupérer la clinique depuis l'API key
    const cliniques = await base44.asServiceRole.entities.Clinique.filter({
      api_key: apiKey
    });

    if (cliniques.length === 0) {
      return { allowed: false, reason: 'Invalid API key' };
    }

    const clinique = cliniques[0];

    // 2. Vérifier les scopes de la clinique
    const requiredScope = this.getRequiredScope(resourceType, operation);
    const cliniqueScopes = clinique.api_scopes || [];

    if (!cliniqueScopes.includes(requiredScope) && !cliniqueScopes.includes('*')) {
      return { 
        allowed: false, 
        reason: `Missing required scope: ${requiredScope}` 
      };
    }

    // 3. Pour les ressources liées à un patient, vérifier la relation
    if (resource?.patient_email) {
      const hasRelation = await this.verifyPatientRelation(
        base44, 
        clinique, 
        resource.patient_email
      );

      if (!hasRelation) {
        return { 
          allowed: false, 
          reason: 'No active relationship with this patient' 
        };
      }
    }

    // 4. Vérifier le consentement patient si applicable
    if (resource?.patient_email && this.requiresConsent(resourceType)) {
      const hasConsent = await this.verifyPatientConsent(
        base44,
        resource.patient_email,
        resourceType
      );

      if (!hasConsent) {
        return {
          allowed: false,
          reason: 'Patient has not consented to data sharing'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Déterminer le scope requis pour une opération
   */
  static getRequiredScope(resourceType, operation) {
    const scopeMap = {
      'Patient': {
        'read': 'read:patients',
        'create': 'write:patients',
        'update': 'write:patients',
        'delete': 'write:patients'
      },
      'Practitioner': {
        'read': 'read:practitioners',
        'create': 'write:practitioners',
        'update': 'write:practitioners',
        'delete': 'write:practitioners'
      },
      'Organization': {
        'read': 'read:organizations',
        'create': 'write:organizations',
        'update': 'write:organizations',
        'delete': 'write:organizations'
      },
      'Encounter': {
        'read': 'read:encounters',
        'create': 'write:encounters',
        'update': 'write:encounters',
        'delete': 'write:encounters'
      },
      'Observation': {
        'read': 'read:observations',
        'create': 'write:observations',
        'update': 'write:observations',
        'delete': 'write:observations'
      },
      'Appointment': {
        'read': 'read:appointments',
        'create': 'write:appointments',
        'update': 'write:appointments',
        'delete': 'write:appointments'
      },
      'Immunization': {
        'read': 'read:immunizations',
        'create': 'write:immunizations',
        'update': 'write:immunizations',
        'delete': 'write:immunizations'
      }
    };

    return scopeMap[resourceType]?.[operation] || 'admin:*';
  }

  /**
   * Vérifier la relation patient-clinique
   */
  static async verifyPatientRelation(base44, clinique, patientEmail) {
    // Récupérer les professionnels de la clinique
    const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
      structure_sante: clinique.nom
    });

    if (professionnels.length === 0) return false;

    const proIds = professionnels.map(p => p.id);

    // Vérifier si le patient a un RDV avec un professionnel de cette clinique
    const rdvs = await base44.asServiceRole.entities.RendezVous.filter({
      created_by: patientEmail,
      professionnel_id: { $in: proIds }
    });

    return rdvs.length > 0;
  }

  /**
   * Vérifier le consentement patient
   */
  static async verifyPatientConsent(base44, patientEmail, resourceType) {
    const consentements = await base44.asServiceRole.entities.ConsentementBPPC.filter({
      patient_email: patientEmail,
      status: 'active',
      decision: 'permit',
      scope: 'document-sharing'
    });

    return consentements.length > 0;
  }

  /**
   * Déterminer si un type de ressource nécessite un consentement
   */
  static requiresConsent(resourceType) {
    const sensitiveResources = [
      'Observation',
      'DiagnosticReport',
      'Condition',
      'MedicationRequest',
      'DocumentReference'
    ];
    return sensitiveResources.includes(resourceType);
  }

  /**
   * Logger l'accès pour audit trail
   */
  static async logAccess(base44, clinique, resourceType, resourceId, operation, result) {
    try {
      await base44.asServiceRole.entities.DocumentXDS.create({
        document_id: crypto.randomUUID(),
        class_code: 'AUDIT_LOG',
        type_code: 'FHIR_API_ACCESS',
        title: `FHIR ${operation} ${resourceType}/${resourceId}`,
        creation_time: new Date().toISOString(),
        author: {
          name: clinique.nom,
          institution: clinique.type_etablissement,
          role: 'API_CLIENT'
        },
        availability_status: 'Approved',
        confidentiality: 'N'
      });
    } catch (error) {
      console.error('[FHIR Security] Logging failed:', error);
    }
  }
}

export default FHIRSecurityMiddleware;