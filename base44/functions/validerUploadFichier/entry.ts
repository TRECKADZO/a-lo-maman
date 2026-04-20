import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valide les fichiers uploadés avant de les accepter
 * Contrôle: type, taille, contenu
 */

const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();
    const file = formData.get('file');
    const docInfo = JSON.parse(formData.get('info') || '{}');

    if (!file) {
      return Response.json({
        valid: false,
        error: 'Aucun fichier fourni'
      }, { status: 400 });
    }

    // ✅ Vérification 1: Type MIME
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return Response.json({
        valid: false,
        error: `Type de fichier non autorisé. Acceptés: ${CONFIG.ALLOWED_TYPES.join(', ')}`
      }, { status: 400 });
    }

    // ✅ Vérification 2: Extension du fichier
    const fileName = file.name.toLowerCase();
    const hasValidExtension = CONFIG.ALLOWED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return Response.json({
        valid: false,
        error: `Extension non autorisée. Acceptées: ${CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      }, { status: 400 });
    }

    // ✅ Vérification 3: Taille du fichier
    const fileSize = file.size;
    if (fileSize > CONFIG.MAX_FILE_SIZE) {
      return Response.json({
        valid: false,
        error: `Fichier trop volumineux (${(fileSize / 1024 / 1024).toFixed(2)}MB). Maximum: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // ✅ Vérification 4: Contenu du fichier (magic bytes)
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);

    // Vérifier les signatures de fichiers (magic bytes)
    const isPDF = view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44; // %PD
    const isJPEG = view[0] === 0xFF && view[1] === 0xD8; // FF D8
    const isPNG = view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47; // 89 50 4E 47
    const isWEBP = view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50; // WEBP

    if (!isPDF && !isJPEG && !isPNG && !isWEBP) {
      return Response.json({
        valid: false,
        error: 'Fichier invalide ou corrompu'
      }, { status: 400 });
    }

    // ✅ Vérification 5: Champs requis
    if (!docInfo.nom || !docInfo.type) {
      return Response.json({
        valid: false,
        error: 'Nom et type de document requis'
      }, { status: 400 });
    }

    // ✅ Upload sécurisé
    const uploadedFile = new File([buffer], file.name, { type: file.type });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
      file: uploadedFile
    });

    // 📋 LOG D'AUDIT
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: await base44.auth.me().then(u => u?.email),
        user_role: 'professionnel',
        action: 'create',
        entity_type: 'DocumentMedical',
        details: {
          doc_name: docInfo.nom,
          doc_type: docInfo.type,
          file_size: fileSize,
          file_type: file.type,
          validation_passed: true
        }
      });
    } catch (auditError) {
      console.warn('Audit log non disponible');
    }

    return Response.json({
      valid: true,
      file_uri: file_uri,
      message: 'Fichier validé et uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur validation upload:', error);
    return Response.json({
      valid: false,
      error: error.message
    }, { status: 500 });
  }
});