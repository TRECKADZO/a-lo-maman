import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Fonction de gestion du registre documentaire IHE XDS.b
 * Permet le partage sécurisé de documents médicaux entre établissements
 * 
 * Endpoints:
 * - POST /xds/register - Enregistrer un document
 * - GET /xds/query - Rechercher des documents
 * - POST /xds/retrieve - Récupérer un document
 * - POST /xds/consent - Gérer les consentements de partage
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const method = req.method;

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // POST /xds/register - Enregistrer un nouveau document
    if (method === 'POST' && path[2] === 'register') {
      const body = await req.json();
      
      const document = {
        patient_email: body.patientEmail,
        document_id_xds: `urn:uuid:${crypto.randomUUID()}`,
        type_document_xds: body.documentType,
        class_code: body.classCode || 'clinical_note',
        format_code: body.formatCode || 'application/pdf',
        titre_document: body.title,
        description: body.description || '',
        date_creation_document: new Date().toISOString(),
        auteur_nom: user.full_name,
        auteur_id: user.id,
        auteur_specialite: body.authorSpecialty || '',
        etablissement_source: body.facilityName || '',
        file_uri: body.fileUri,
        file_hash: body.fileHash, // SHA-256
        mime_type: body.mimeType || 'application/pdf',
        taille_octets: body.fileSize || 0,
        niveau_confidentialite: body.confidentiality || 'normal',
        consentement_partage: body.shareConsent || false,
        codes_snomed: body.snomedCodes || [],
        codes_loinc: body.loincCodes || [],
        codes_icd: body.icdCodes || [],
        statut_validation: body.status || 'final',
        version: 1,
        metadata_fhir: body.fhirMetadata || {}
      };

      const created = await base44.asServiceRole.entities.RegistreDocuments.create(document);

      return Response.json({
        success: true,
        documentId: created.document_id_xds,
        registryResponse: {
          status: 'urn:oasis:names:tc:ebxml-regrep:ResponseStatusType:Success',
          timestamp: new Date().toISOString()
        }
      }, { status: 201 });
    }

    // POST /xds/query - Rechercher des documents
    if (method === 'POST' && path[2] === 'query') {
      const body = await req.json();
      
      const query = {
        patient_email: body.patientEmail
      };

      if (body.documentType) {
        query.type_document_xds = body.documentType;
      }

      if (body.dateFrom) {
        query.date_creation_document = { $gte: body.dateFrom };
      }

      const documents = await base44.entities.RegistreDocuments.filter(query, '-date_creation_document', 50);

      return Response.json({
        success: true,
        totalResults: documents.length,
        documents: documents.map(doc => ({
          documentId: doc.document_id_xds,
          title: doc.titre_document,
          type: doc.type_document_xds,
          author: doc.auteur_nom,
          creationDate: doc.date_creation_document,
          facility: doc.etablissement_source,
          mimeType: doc.mime_type,
          size: doc.taille_octets,
          confidentiality: doc.niveau_confidentialite,
          hash: doc.file_hash
        }))
      });
    }

    // POST /xds/retrieve - Récupérer un document
    if (method === 'POST' && path[2] === 'retrieve') {
      const body = await req.json();
      
      const documents = await base44.entities.RegistreDocuments.filter({
        document_id_xds: body.documentId
      });

      if (documents.length === 0) {
        return Response.json({ error: 'Document not found' }, { status: 404 });
      }

      const doc = documents[0];

      // Vérifier les autorisations
      const isAuthorized = 
        doc.patient_email === user.email ||
        doc.auteur_id === user.id ||
        doc.partage_avec.some(p => p.professionnel_id === user.id) ||
        user.role === 'admin';

      if (!isAuthorized) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      // Générer URL signée si fichier privé
      let fileUrl = doc.file_uri;
      if (doc.file_uri.startsWith('private/')) {
        const signedUrl = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.file_uri,
          expires_in: 300 // 5 minutes
        });
        fileUrl = signedUrl.signed_url;
      }

      return Response.json({
        success: true,
        document: {
          id: doc.document_id_xds,
          title: doc.titre_document,
          type: doc.type_document_xds,
          fileUrl: fileUrl,
          mimeType: doc.mime_type,
          size: doc.taille_octets,
          hash: doc.file_hash,
          creationDate: doc.date_creation_document,
          author: doc.auteur_nom
        }
      });
    }

    // POST /xds/consent - Gérer consentements
    if (method === 'POST' && path[2] === 'consent') {
      const body = await req.json();
      
      const documents = await base44.entities.RegistreDocuments.filter({
        document_id_xds: body.documentId,
        patient_email: user.email
      });

      if (documents.length === 0) {
        return Response.json({ error: 'Document not found or access denied' }, { status: 404 });
      }

      const doc = documents[0];

      // Ajouter/retirer autorisation de partage
      if (body.action === 'grant') {
        const newShare = {
          professionnel_id: body.professionalId,
          etablissement_id: body.facilityId || '',
          date_autorisation: new Date().toISOString(),
          expire_le: body.expiryDate || null
        };

        const updatedShares = [...(doc.partage_avec || []), newShare];

        await base44.entities.RegistreDocuments.update(doc.id, {
          partage_avec: updatedShares,
          consentement_partage: true
        });

        return Response.json({
          success: true,
          message: 'Consent granted successfully'
        });
      }

      if (body.action === 'revoke') {
        const updatedShares = (doc.partage_avec || []).filter(
          p => p.professionnel_id !== body.professionalId
        );

        await base44.entities.RegistreDocuments.update(doc.id, {
          partage_avec: updatedShares,
          consentement_partage: updatedShares.length > 0
        });

        return Response.json({
          success: true,
          message: 'Consent revoked successfully'
        });
      }
    }

    return Response.json({
      error: 'Endpoint not found',
      availableEndpoints: [
        'POST /xds/register',
        'POST /xds/query',
        'POST /xds/retrieve',
        'POST /xds/consent'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('Erreur XDS:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});