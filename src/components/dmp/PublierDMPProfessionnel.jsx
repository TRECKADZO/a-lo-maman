import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

const TYPES_DOCUMENTS = [
  { value: 'resultat', label: 'Résultat d\'examen' },
  { value: 'ordonnance', label: 'Ordonnance' },
  { value: 'compte_rendu', label: 'Compte rendu de consultation' },
  { value: 'certificat', label: 'Certificat médical' },
  { value: 'vaccination', label: 'Certificat de vaccination' },
  { value: 'imagerie', label: 'Imagerie médicale' },
  { value: 'autre', label: 'Autre document' }
];

export default function PublierDMPProfessionnel({ patientEmail, professionnelId, professionnelNom, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titre: '',
    type_document: '',
    description: '',
    classe_document: 'medical',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Mutation pour publier dans le DMP
  const publierMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Upload du fichier si présent
      let documentUri = null;
      let format = null;
      
      if (file) {
        setUploading(true);
        const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });
        documentUri = uploadResult.file_uri;
        format = file.type.split('/')[1] || 'pdf';
      }

      // 2. Créer le document XDS
      const docData = {
        patient_email: patientEmail,
        titre: data.titre,
        type_document: data.type_document,
        description: data.description,
        classe_document: data.classe_document,
        auteur: professionnelNom,
        auteur_id: professionnelId,
        document_uri: documentUri,
        format: format,
        statut: 'valide',
        date_creation: new Date().toISOString(),
        confidentialite: 'normal',
        metadata: {
          source: 'alo_maman_pro',
          version: '1.0'
        }
      };

      const document = await base44.entities.DocumentXDS.create(docData);

      // 3. Publier dans le DMP via l'intégration
      try {
        await base44.functions.invoke('publierDMP', {
          document_id: document.id,
          patient_email: patientEmail,
          professionnel_id: professionnelId
        });
      } catch (err) {
        console.warn('Erreur publication DMP externe:', err);
        // Continue même si la publication externe échoue
      }

      return document;
    },
    onSuccess: () => {
      toast.success('Document ajouté au DMP avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents_dmp'] });
      queryClient.invalidateQueries({ queryKey: ['documents_medicaux'] });
      
      // Reset form
      setFormData({
        titre: '',
        type_document: '',
        description: '',
        classe_document: 'medical',
      });
      setFile(null);
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout au DMP');
      console.error('Erreur:', error);
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.titre.trim()) {
      toast.error('Veuillez entrer un titre');
      return;
    }
    
    if (!formData.type_document) {
      toast.error('Veuillez sélectionner un type de document');
      return;
    }

    publierMutation.mutate(formData);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 10 MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Card className="shadow-lg border-2 border-teal-200">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-teal-600" />
          Publier dans le DMP du patient
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-6 bg-blue-50 border-blue-300">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Les documents publiés seront automatiquement partagés dans le Dossier Médical Partagé du patient
            et accessibles par les autres professionnels autorisés.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">
              Titre du document *
            </Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Résultat prise de sang du 09/01/2026"
              required
              disabled={publierMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type de document *
            </Label>
            <Select
              value={formData.type_document}
              onValueChange={(value) => setFormData({ ...formData, type_document: value })}
              disabled={publierMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENTS.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails complémentaires..."
              rows={3}
              disabled={publierMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">
              Fichier (optionnel, max 10 MB)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={publierMutation.isPending}
                className="flex-1"
              />
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={publierMutation.isPending}
                >
                  ✕
                </Button>
              )}
            </div>
            {file && (
              <p className="text-xs text-gray-600">
                Fichier sélectionné: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={publierMutation.isPending || uploading}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {publierMutation.isPending || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Upload en cours...' : 'Publication...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publier dans le DMP
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}