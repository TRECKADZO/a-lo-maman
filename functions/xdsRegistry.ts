import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * IHE XDS.b Registry & Repository
 * Registre et dépôt de documents médicaux avec métadonnées ebRIM
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const method = req.method;

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // POST /register - Enregistrer un document dans le registry XDS
    if (url.pathname.includes('/register') && method === 'POST') {
      const body = await req.json();
      const {
        patient_email,
        class_code,
        type_code,
        titre,
        file_uri,
        auteur_id,
        auteur_nom,
        auteur_specialite,
        etablissement,
        confidentialite = 'normal'
      } = body;

      // Générer UID unique (OID)
      const uniqueId = `2.25.${Date.now()}.${Math.random().toString(36).substring(7)}`;

      // Métadonnées ebRIM (format simplifié)
      const metadata_xds = {
        uniqueId,
        patientId: patient_email,
        classCode: {
          code: class_code,
          codingScheme: 'A\'lo Maman Classification'
        },
        typeCode: {
          code: type_code,
          codingScheme: 'LOINC'
        },
        creationTime: new Date().toISOString(),
        serviceStartTime: new Date().toISOString(),
        author: {
          authorPerson: auteur_nom,
          authorInstitution: etablissement,
          authorRole: auteur_specialite
        },
        confidentiality: confidentialite,
        languageCode: 'fr-CI',
        mimeType: 'application/pdf',
        sourcePatientId: patient_email,
        sourcePatientInfo: {}
      };

      // Calculer hash du fichier
      const fileResponse = await fetch(file_uri);
      const fileBuffer = await fileResponse.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const file_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const xdsDocument = await base44.asServiceRole.entities.XDSDocument.create({
        unique_id: uniqueId,
        patient_email,
        class_code,
        type_code,
        format_code: 'PDF',
        titre,
        auteur_nom,
        auteur_id,
        auteur_specialite,
        etablissement,
        date_creation: new Date().toISOString(),
        date_service: new Date().toISOString(),
        confidentialite,
        file_uri,
        file_hash,
        file_size: fileBuffer.byteLength,
        mime_type: 'application/pdf',
        repository_unique_id: 'alomaman.ci.repository.1',
        metadata_xds,
        statut: 'actif',
        consentement_patient: true
      });

      return Response.json({
        success: true,
        documentUniqueId: uniqueId,
        repositoryUniqueId: 'alomaman.ci.repository.1',
        message: 'Document enregistré dans le registry XDS'
      }, { status: 201 });
    }

    // POST /query - Rechercher des documents (PDQ - Patient Document Query)
    if (url.pathname.includes('/query') && method === 'POST') {
      const body = await req.json();
      const { patient_email, class_code, date_from, date_to } = body;

      let query = { patient_email };
      
      if (class_code) {
        query.class_code = class_code;
      }

      if (date_from && date_to) {
        query.date_creation = {
          $gte: date_from,
          $lte: date_to
        };
      }

      const documents = await base44.asServiceRole.entities.XDSDocument.filter(query);

      return Response.json({
        totalResults: documents.length,
        documents: documents.map(doc => ({
          uniqueId: doc.unique_id,
          classCode: doc.class_code,
          typeCode: doc.type_code,
          title: doc.titre,
          author: doc.auteur_nom,
          creationTime: doc.date_creation,
          size: doc.file_size,
          mimeType: doc.mime_type,
          confidentiality: doc.confidentialite
        }))
      });
    }

    // GET /retrieve/:uniqueId - Récupérer un document (avec signed URL si privé)
    if (url.pathname.includes('/retrieve/') && method === 'GET') {
      const uniqueId = url.pathname.split('/').pop();
      
      const documents = await base44.asServiceRole.entities.XDSDocument.filter({ unique_id: uniqueId });
      
      if (documents.length === 0) {
        return Response.json({ error: 'Document not found' }, { status: 404 });
      }

      const doc = documents[0];

      // Vérifier autorisation d'accès
      const isAuthorized = 
        doc.patient_email === user.email ||
        doc.partage_avec.includes(user.id) ||
        user.role === 'admin';

      if (!isAuthorized) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      // Si fichier privé, créer signed URL
      let fileUrl = doc.file_uri;
      if (doc.file_uri.startsWith('private/')) {
        const signedUrlResult = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.file_uri,
          expires_in: 3600 // 1 heure
        });
        fileUrl = signedUrlResult.signed_url;
      }

      return Response.json({
        document: {
          uniqueId: doc.unique_id,
          title: doc.titre,
          mimeType: doc.mime_type,
          size: doc.file_size,
          hash: doc.file_hash,
          downloadUrl: fileUrl
        }
      });
    }

    return Response.json({
      message: 'A\'lo Maman XDS Registry & Repository',
      endpoints: [
        'POST /register - Register document',
        'POST /query - Query documents',
        'GET /retrieve/:uniqueId - Retrieve document'
      ]
    });

  } catch (error) {
    console.error('XDS Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});