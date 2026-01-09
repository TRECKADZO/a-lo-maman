import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const EQUIPEMENTS_DISPONIBLES = [
  'Salle d\'accouchement',
  'Bloc opératoire',
  'Salle d\'échographie',
  'Laboratoire d\'analyses',
  'Pharmacie',
  'Salle de consultation',
  'Urgences',
  'Ambulance',
  'Materiel de réanimation',
  'Couveuses',
  'Radiologie',
  'Scanner',
  'IRM'
];

export default function EditerProfilCentre({ centre, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    description: centre.description || '',
    adresse: centre.adresse || '',
    capacite_lits: centre.capacite_lits || 0,
    horaires_ouverture: centre.horaires_ouverture || {},
    equipements: centre.equipements || [],
    certifications: centre.certifications || [],
    assurances_partenaires: centre.assurances_partenaires || [],
    photo_centre: centre.photo_centre || '',
    photos_galerie: centre.photos_galerie || []
  });
  const [newCertification, setNewCertification] = useState('');
  const [newAssurance, setNewAssurance] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Clinique.update(centre.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      toast.success('Profil mis à jour avec succès');
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHoraireChange = (jour, value) => {
    setFormData(prev => ({
      ...prev,
      horaires_ouverture: {
        ...prev.horaires_ouverture,
        [jour]: value
      }
    }));
  };

  const toggleEquipement = (equipement) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.includes(equipement)
        ? prev.equipements.filter(e => e !== equipement)
        : [...prev.equipements, equipement]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addAssurance = () => {
    if (newAssurance.trim()) {
      setFormData(prev => ({
        ...prev,
        assurances_partenaires: [...prev.assurances_partenaires, newAssurance.trim()]
      }));
      setNewAssurance('');
    }
  };

  const removeAssurance = (index) => {
    setFormData(prev => ({
      ...prev,
      assurances_partenaires: prev.assurances_partenaires.filter((_, i) => i !== index)
    }));
  };

  const handleUploadPhoto = async (e, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (isGallery) {
        setFormData(prev => ({
          ...prev,
          photos_galerie: [...prev.photos_galerie, file_url]
        }));
      } else {
        setFormData(prev => ({ ...prev, photo_centre: file_url }));
      }
      toast.success('Photo uploadée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'upload : ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeGalleryPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos_galerie: prev.photos_galerie.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader>
          <CardTitle>Compléter le profil de {centre.nom}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description du centre *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez votre centre de santé, votre mission, vos valeurs..."
                rows={4}
                required
              />
            </div>

            {/* Adresse et capacité */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  placeholder="Rue, quartier..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacite_lits">Capacité (nombre de lits)</Label>
                <Input
                  id="capacite_lits"
                  type="number"
                  value={formData.capacite_lits}
                  onChange={(e) => handleChange('capacite_lits', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Horaires d'ouverture */}
            <div className="space-y-3">
              <Label>Horaires d'ouverture</Label>
              <div className="space-y-2">
                {JOURS_SEMAINE.map(jour => (
                  <div key={jour} className="flex items-center gap-3">
                    <span className="w-24 text-sm capitalize">{jour}</span>
                    <Input
                      value={formData.horaires_ouverture[jour] || ''}
                      onChange={(e) => handleHoraireChange(jour, e.target.value)}
                      placeholder="Ex: 08:00-17:00 ou Fermé"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Équipements */}
            <div className="space-y-3">
              <Label>Équipements disponibles</Label>
              <div className="flex flex-wrap gap-2">
                {EQUIPEMENTS_DISPONIBLES.map(equipement => (
                  <Badge
                    key={equipement}
                    variant={formData.equipements.includes(equipement) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleEquipement(equipement)}
                  >
                    {equipement}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-3">
              <Label>Certifications et accréditations</Label>
              <div className="flex gap-2">
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="Ex: ISO 9001, Accréditation MSP..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="gap-2">
                    {cert}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeCertification(index)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Assurances partenaires */}
            <div className="space-y-3">
              <Label>Assurances partenaires</Label>
              <div className="flex gap-2">
                <Input
                  value={newAssurance}
                  onChange={(e) => setNewAssurance(e.target.value)}
                  placeholder="Ex: CNPS, MUGEF-CI, ASCOMA..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAssurance())}
                />
                <Button type="button" onClick={addAssurance} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.assurances_partenaires.map((assurance, index) => (
                  <Badge key={index} variant="secondary" className="gap-2">
                    {assurance}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeAssurance(index)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Photo principale */}
            <div className="space-y-3">
              <Label>Photo principale du centre</Label>
              {formData.photo_centre && (
                <img src={formData.photo_centre} alt="Centre" className="w-full h-48 object-cover rounded-lg mb-2" />
              )}
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadPhoto(e, false)}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
            </div>

            {/* Galerie photos */}
            <div className="space-y-3">
              <Label>Galerie photos (max 5)</Label>
              <div className="grid grid-cols-3 gap-2">
                {formData.photos_galerie.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.photos_galerie.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadPhoto(e, true)}
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto && <Loader2 className="w-5 h-5 animate-spin" />}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
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