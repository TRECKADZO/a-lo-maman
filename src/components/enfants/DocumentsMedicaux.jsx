
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, Download, Loader2, X, Image as ImageIcon, File, Pill } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const typesDocuments = [
  { value: 'certificat_vaccination', label: 'Certificat de vaccination', icon: FileText, color: 'text-green-600' },
  { value: 'resultat_labo', label: 'Résultat de laboratoire', icon: FileText, color: 'text-blue-600' },
  { value: 'rapport_specialiste', label: 'Rapport de spécialiste', icon: FileText, color: 'text-purple-600' },
  { value: 'ordonnance', label: 'Ordonnance', icon: Pill, color: 'text-green-600' },
  { value: 'radio', label: 'Radiographie', icon: ImageIcon, color: 'text-orange-600' },
  { value: 'echographie', label: 'Échographie', icon: ImageIcon, color: 'text-pink-600' },
  { value: 'autre', label: 'Autre document', icon: File, color: 'text-gray-600' },
];

export default function DocumentsMedicaux({ enfant, isEditable = false }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'autre',
    date_document: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel_current'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, info }) => {
      setUploading(true);
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        
        const documents = enfant.documents_medicaux || [];
        await base44.entities.EnfantCarnet.update(enfant.id, {
          documents_medicaux: [
            ...documents,
            {
              ...info,
              file_uri: file_uri,
              file_name: file.name,
              file_type: file.type,
              date_upload: new Date().toISOString(),
              professionnel: profilPro?.nom_complet || ''
            }
          ]
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfant.id] });
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setShowAjouter(false);
      setFormData({
        nom: '',
        type: 'autre',
        date_document: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  });

  const handleDownload = async (document) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: document.file_uri,
        expires_in: 3600
      });
      window.open(signed_url, '_blank');
    } catch (error) {
      alert('Erreur lors du téléchargement du document');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('doc-file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    uploadDocumentMutation.mutate({ file, info: formData });
  };

  const getTypeInfo = (type) => {
    return typesDocuments.find(t => t.value === type) || typesDocuments[typesDocuments.length - 1];
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Documents Médicaux
          </CardTitle>
          {isEditable && (
            <Button onClick={() => setShowAjouter(true)} size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Ajouter un document
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {enfant.documents_medicaux && enfant.documents_medicaux.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enfant.documents_medicaux.map((doc, index) => {
              const typeInfo = getTypeInfo(doc.type);
              const Icon = typeInfo.icon;
              
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold truncate">{doc.nom}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Badge variant="outline" className="mb-2">
                          {typeInfo.label}
                        </Badge>
                        
                        <p className="text-xs text-gray-600 mb-1">
                          📅 {format(new Date(doc.date_document), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                        
                        {doc.professionnel && (
                          <p className="text-xs text-gray-500 mb-2">
                            Par: {doc.professionnel}
                          </p>
                        )}
                        
                        {doc.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Aucun document médical enregistré</p>
        )}
      </CardContent>

      {/* Modal Ajouter */}
      {showAjouter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ajouter un document médical</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAjouter(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nom du document *</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Résultats prise de sang"
                    required
                  />
                </div>

                <div>
                  <Label>Type de document *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typesDocuments.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date du document *</Label>
                  <Input
                    type="date"
                    value={formData.date_document}
                    onChange={(e) => setFormData({ ...formData, date_document: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Notes ou remarques sur ce document..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Fichier * (PDF, Image)</Label>
                  <Input
                    type="file"
                    id="doc-file-upload"
                    accept="image/*,.pdf"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAjouter(false)}
                    className="flex-1"
                    disabled={uploading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Télécharger
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
