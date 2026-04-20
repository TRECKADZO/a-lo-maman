// Gestion sécurisée des documents médicaux
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action, document_id, partage_email, permissions, duree_jours } = await req.json();

    switch (action) {
      case 'partager': {
        const docs = await base44.asServiceRole.entities.DocumentFamille.filter({ id: document_id });
        const doc = docs[0];

        if (!doc || doc.created_by !== user.email) {
          return Response.json({ error: 'Document non trouvé ou accès refusé' }, { status: 403 });
        }

        const dateExpiration = new Date();
        dateExpiration.setDate(dateExpiration.getDate() + (duree_jours || 7));

        const partages = doc.partages || [];
        partages.push({
          email: partage_email,
          nom: partage_email,
          type: 'famille',
          permissions: permissions || ['lecture'],
          date_partage: new Date().toISOString(),
          expire_le: dateExpiration.toISOString().split('T')[0]
        });

        await base44.asServiceRole.entities.DocumentFamille.update(document_id, { partages });

        // Notifier le destinataire
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: partage_email,
          type: 'document',
          titre: '📄 Document partagé avec vous',
          message: `${user.full_name || user.email} a partagé un document médical avec vous.`,
          action_page: 'MesDocuments',
          priorite: 'normale',
          icone: 'FileText'
        });

        return Response.json({ success: true, message: 'Document partagé' });
      }

      case 'revoquer_partage': {
        const docs = await base44.asServiceRole.entities.DocumentFamille.filter({ id: document_id });
        const doc = docs[0];

        if (!doc || doc.created_by !== user.email) {
          return Response.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const partages = (doc.partages || []).filter(p => p.email !== partage_email);
        await base44.asServiceRole.entities.DocumentFamille.update(document_id, { partages });

        return Response.json({ success: true, message: 'Partage révoqué' });
      }

      case 'obtenir_lien_signe': {
        const docs = await base44.asServiceRole.entities.DocumentFamille.filter({ id: document_id });
        const doc = docs[0];

        if (!doc) {
          return Response.json({ error: 'Document non trouvé' }, { status: 404 });
        }

        // Vérifier l'accès
        const estProprietaire = doc.created_by === user.email;
        const estPartage = (doc.partages || []).some(p => p.email === user.email);

        if (!estProprietaire && !estPartage) {
          return Response.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // Créer URL signée
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.file_uri,
          expires_in: 300 // 5 minutes
        });

        return Response.json({ success: true, signed_url });
      }

      default:
        return Response.json({ error: 'Action non reconnue' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});