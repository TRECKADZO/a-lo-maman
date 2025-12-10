/**
 * ⚠️ IMPORTANT : Ce fichier contient la spécification OpenAPI 3.1 complète
 * À copier dans un fichier .yaml séparé pour génération de documentation Swagger/Redoc
 * 
 * URL recommandée : https://alomaman.com/api-spec.yaml
 * Visualisation : https://editor.swagger.io ou Redoc
 */

export const openAPISpec = `
openapi: 3.1.0
info:
  title: "A'lo Maman Health API"
  version: "1.0.0"
  description: |
    **API RESTful sécurisée pour intégrations B2B cliniques, hôpitaux, laboratoires**
    
    🏥 **Cas d'usage :**
    - Cliniques privées : gestion patientes, consultations, télémédecine
    - Laboratoires : transmission résultats sécurisée
    - Pharmacies : accès ordonnances validées
    - Applications tierces : services complémentaires
    
    🔐 **Sécurité :**
    - Authentication: API Key (header X-API-Key)
    - TLS 1.3 obligatoire en production
    - Chiffrement AES-256 au repos
    - Rate limiting: 1000 req/h par défaut
    - Audit trail complet
    
    ✅ **Conformité :**
    - RGPD : consentement, droit à l'oubli, portabilité
    - Préparation HDS (Hébergement Données de Santé) France
    - Traçabilité accès données sensibles
    
    📧 **Support :** api@alomaman.com
  contact:
    name: "API Support A'lo Maman"
    email: "api@alomaman.com"
  license:
    name: "Propriétaire"
    url: "https://alomaman.com/api-terms"

servers:
  - url: "https://alomaman.com/functions"
    description: "Production"
  - url: "https://staging.alomaman.com/functions"
    description: "Staging"

security:
  - ApiKeyAuth: []

tags:
  - name: "Cliniques"
  - name: "Patientes"
  - name: "Grossesse"
  - name: "Enfants"
  - name: "Documents"
  - name: "Webhooks"
  - name: "FHIR"

paths:
  /apiClinique:
    post:
      tags: ["Cliniques"]
      summary: "API Clinique - Endpoints multiples"
      description: |
        Endpoint unifié pour les cliniques partenaires.
        Paramètre \`endpoint\` détermine l'action.
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: "#/components/schemas/StatsRequest"
                - $ref: "#/components/schemas/PatientsRequest"
                - $ref: "#/components/schemas/RdvRequest"
            examples:
              stats:
                value:
                  endpoint: "stats"
                  clinique_id: "clinic_123"
              patients:
                value:
                  endpoint: "patients"
                  clinique_id: "clinic_123"
              rdv:
                value:
                  endpoint: "rendez-vous"
                  date_debut: "2025-01-01"
                  date_fin: "2025-12-31"
      responses:
        "200":
          description: "Succès"
        "401":
          $ref: "#/components/responses/Unauthorized"

  /apiPublic:
    post:
      tags: ["Patientes"]
      summary: "API Publique - MSP & Assurances"
      description: "Statistiques agrégées anonymisées pour institutions"
      security:
        - ApiKeyAuth: []
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                - $ref: "#/components/schemas/StatsRegionRequest"
                - $ref: "#/components/schemas/VerificationProRequest"
      responses:
        "200":
          description: "Données publiques"

  /webhookManager:
    post:
      tags: ["Webhooks"]
      summary: "Gestion des webhooks"
      description: |
        Enregistrer/supprimer/lister webhooks pour notifications temps réel.
        **Events supportés :**
        - patient.created
        - appointment.created
        - document.uploaded
        - vaccination.recorded
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                - $ref: "#/components/schemas/RegisterWebhookRequest"
                - $ref: "#/components/schemas/ListWebhooksRequest"
      responses:
        "200":
          description: "Webhook géré"

  /fhirSync:
    post:
      tags: ["FHIR"]
      summary: "Synchronisation FHIR R4"
      description: |
        Création/mise à jour ressources FHIR (Observation, Appointment).
        Compatible DMP et systèmes FHIR.
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/FHIRSyncRequest"
      responses:
        "200":
          description: "Ressource FHIR synchronisée"

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: |
        Clé API fournie après signature contrat partenaire.
        **IMPORTANT :** Ne jamais exposer côté client.

  schemas:
    StatsRequest:
      type: object
      required: [endpoint]
      properties:
        endpoint:
          type: string
          enum: [stats]
        clinique_id:
          type: string

    PatientsRequest:
      type: object
      required: [endpoint]
      properties:
        endpoint:
          type: string
          enum: [patients]
        clinique_id:
          type: string

    RdvRequest:
      type: object
      required: [endpoint, date_debut, date_fin]
      properties:
        endpoint:
          type: string
          enum: [rendez-vous]
        date_debut:
          type: string
          format: date
        date_fin:
          type: string
          format: date

    StatsRegionRequest:
      type: object
      required: [endpoint, region]
      properties:
        endpoint:
          type: string
          enum: [statistiques-region]
        region:
          type: string

    VerificationProRequest:
      type: object
      required: [endpoint, numero_ordre]
      properties:
        endpoint:
          type: string
          enum: [verification-professionnel]
        numero_ordre:
          type: string

    RegisterWebhookRequest:
      type: object
      required: [action, data]
      properties:
        action:
          type: string
          enum: [register]
        data:
          type: object
          required: [clinique_id, url, events]
          properties:
            clinique_id:
              type: string
            url:
              type: string
              format: uri
              description: "URL HTTPS de destination"
            events:
              type: array
              items:
                type: string
                enum:
                  - patient.created
                  - patient.updated
                  - appointment.created
                  - document.uploaded
                  - vaccination.recorded
            secret:
              type: string
              description: "Secret pour signature HMAC (auto-généré si omis)"

    ListWebhooksRequest:
      type: object
      required: [action, data]
      properties:
        action:
          type: string
          enum: [list]
        data:
          type: object
          required: [clinique_id]
          properties:
            clinique_id:
              type: string

    FHIRSyncRequest:
      type: object
      required: [action, data]
      properties:
        action:
          type: string
          enum: [syncVitals, syncGrowth, syncAppointment]
        data:
          type: object
          description: "Varie selon l'action"

    Error:
      type: object
      properties:
        error:
          type: string
        details:
          type: string
        timestamp:
          type: string
          format: date-time

  responses:
    Unauthorized:
      description: "Non autorisé - Clé API invalide"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
`;

export default openAPISpec;