import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Upload,
  Loader2,
  FileText,
  Baby,
  User,
  Users,
  Plus,
  Tag
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';

const TYPES_DOCUMENTS = [
  { id: 'ordonnance', label: 'Ordonnance' },
  { id: 'resultat_labo', label: 'Résultat laboratoire' },
  { id: 'certificat_medical', label: 'Certificat médical' },
  { id: 'certificat_vaccination', label: 'Certificat de vaccination' },
  { id: 'radio_imagerie', label: 'Radio / Imagerie' },
  { id: 'echographie', label: 'Échographie' },
  { id: 'compte_rendu', label: 'Compte-rendu consultation' },
  { id: 'courrier_specialiste', label: 'Courrier spécialiste' },
  { id: 'carnet_sante', label: 'Carnet de santé' },
  { id: 'facture', label: 'Facture / Remboursement' },
  { id: 'autre', label: 'Autre document' },
];

export default function AjouterDocument({ enfants, onClose }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [motCle, setMotCle] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    type_document: '',
    membre_type: 'maman',
    enfant_id: '',
    date_document: new Date().toISOString().split('T')[0],
    professionnel: '',
    etablissement: '',
    description: '',
    mots_cles: [],
    file_uri: null,
    file_name: null,
    file_type: null,
    file_size: null,
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFormData({
        ...formData,
        file_uri,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const addMotCle = () => {
    if (motCle.trim() && !formData.mots_cles.includes(motCle.trim())) {
      setFormData({
        ...formData,
        mots_cles: [...formData.mots_cles, motCle.trim()]
      });
      setMotCle('');
    }
  };

  const removeMotCle = (index) => {
    setFormData({
      ...formData,
      mots_cles: formData.mots_cles.filter((_, i) => i !== index)
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const enfant = enfants.find(e => e.id === data.enfant_id);
      await base44.entities.DocumentFamille.create({
        ...data,
        enfant_prenom: enfant?.prenom || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_famille'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.file_uri) {
      alert('Veuillez sélectionner un fichier');
      return;
    }
    createMutation.mutate(formData);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title="Ajouter un document"
      fullHeight
    >
      <div className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload fichier */}
          <div>
            <Label>Fichier *</Label>
            <div className="mt-2">
              {formData.file_uri ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900 truncate">{formData.file_name}</p>
                    <p className="text-xs text-green-700">{formatFileSize(formData.file_size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, file_uri: null, file_name: null })}
                    className="text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Cliquer pour sélectionner un fichier</span>
                  <span className="text-xs text-gray-400">PDF, images, documents</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Upload en cours...</span>
                </div>
              )}
            </div>
          </div>

          {/* Titre */}
          <div>
            <Label>Titre du document *</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Ordonnance Dr. Martin - Février 2025"
              required
            />
          </div>

          {/* Type */}
          <div>
            <Label>Type de document *</Label>
            <Select
              value={formData.type_document}
              onValueChange={(value) => setFormData({ ...formData, type_document: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENTS.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Membre */}
          <div>
            <Label>Pour qui ? *</Label>
            <Select
              value={formData.membre_type}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                membre_type: value,
                enfant_id: value === 'enfant' ? formData.enfant_id : ''
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maman">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Moi
                  </div>
                </SelectItem>
                <SelectItem value="enfant">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4" /> Un enfant
                  </div>
                </SelectItem>
                <SelectItem value="famille">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Toute la famille
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sélection enfant */}
          {formData.membre_type === 'enfant' && (
            <div>
              <Label>Enfant concerné *</Label>
              <Select
                value={formData.enfant_id}
                onValueChange={(value) => setFormData({ ...formData, enfant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un enfant" />
                </SelectTrigger>
                <SelectContent>
                  {enfants.map(enfant => (
                    <SelectItem key={enfant.id} value={enfant.id}>
                      {enfant.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div>
            <Label>Date du document</Label>
            <Input
              type="date"
              value={formData.date_document}
              onChange={(e) => setFormData({ ...formData, date_document: e.target.value })}
            />
          </div>

          {/* Professionnel */}
          <div>
            <Label>Professionnel de santé</Label>
            <Input
              value={formData.professionnel}
              onChange={(e) => setFormData({ ...formData, professionnel: e.target.value })}
              placeholder="Nom du médecin ou spécialiste"
            />
          </div>

          {/* Établissement */}
          <div>
            <Label>Établissement</Label>
            <Input
              value={formData.etablissement}
              onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
              placeholder="Hôpital, clinique, laboratoire..."
            />
          </div>

          {/* Description */}
          <div>
            <Label>Notes / Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={2}
            />
          </div>

          {/* Mots-clés */}
          <div>
            <Label>Mots-clés (pour la recherche)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={motCle}
                onChange={(e) => setMotCle(e.target.value)}
                placeholder="Ajouter un mot-clé"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMotCle();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addMotCle}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.mots_cles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.mots_cles.map((mc, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {mc}
                    <button type="button" onClick={() => removeMotCle(i)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || uploading || !formData.file_uri || !formData.titre || !formData.type_document}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}