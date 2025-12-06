import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Upload,
  X,
  Loader2,
  Send,
  CheckCircle,
  File,
  Pill,
  Image as ImageIcon
} from 'lucide-react';

export default function EnvoyerDocumentConsultation({ patientEmail, conversationId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titre: '',
    type_document: 'ordonnance',
    description: '',
    date_document: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user
  });

  const envoyerDocumentMutation = useMutation({
    mutationFn: async ({ fileUri, fileName, fileType, fileSize }) => {
      const documentData = {
        titre: formData.titre,
        type_document: formData.type_document,
        file_uri: fileUri,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        date_document: formData.date_document,
        patient_email: patientEmail,
        professionnel_emetteur_id: profilPro?.id,
        professionnel_emetteur_nom: profilPro?.nom_complet,
        professionnel_emetteur_specialite: profilPro?.specialite,
        description: formData.description || null,
      };

      const doc = await base44.entities.DocumentMedical.create(documentData);

      await base44.entities.Notification.create({
        destinataire_email: patientEmail,
        type: 'message_nouveau',
        titre: 'Nouveau document médical',
        message: `${profilPro?.nom_complet} vous a envoyé : ${formData.titre}`,
        action_page: 'MonEspaceSante',
        priorite: 'haute',
        icone: 'FileText',
      });

      if (conversationId) {
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_email: user.email,
          content: `📄 Document envoyé : ${formData.titre}`,
          attachment_uri: fileUri,
          attachment_name: fileName,
          attachment_type: fileType,
        });
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_medicaux'] });
      alert('✅ Document envoyé avec succès !');
      onClose();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      
      await envoyerDocumentMutation.mutateAsync({
        fileUri: file_uri,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Erreur lors de l\'envoi du document');
    } finally {
      setUploading(false);
    }
  };

  const typesLabels = {
    'ordonnance': { label: 'Ordonnance', icon: Pill },
    'resultat_labo': { label: 'Résultat labo', icon: FileText },
    'compte_rendu': { label: 'Compte rendu', icon: FileText },
    'radio': { label: 'Radiographie', icon: ImageIcon },
    'echographie': { label: 'Échographie', icon: ImageIcon },
    'rapport_specialiste': { label: 'Rapport spécialiste', icon: FileText },
    'certificat_medical': { label: 'Certificat médical', icon: FileText },
    'autre': { label: 'Autre', icon: File }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Envoyer un document
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type de document</Label>
              <select
                value={formData.type_document}
                onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {Object.entries(typesLabels).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Titre du document *</Label>
              <Input
                placeholder="Ex: Ordonnance du 15/01/2025"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date du document</Label>
              <Input
                type="date"
                value={formData.date_document}
                onChange={(e) => setFormData({ ...formData, date_document: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fichier *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour sélectionner un fichier</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Textarea
                placeholder="Notes ou instructions pour le patient..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={uploading || envoyerDocumentMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {uploading || envoyerDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}