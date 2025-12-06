import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Star,
  Sparkles,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

/**
 * Composant pour partager des expériences et témoignages
 * Les mamans peuvent partager leurs histoires, conseils, et moments spéciaux
 */
export default function ExperienceSharing({ onClose, defaultCategorie }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titre: '',
    histoire: '',
    categorie: defaultCategorie || 'temoignages',
    tags: [],
    evaluation: 5,
    conseil_principal: '',
    photos: []
  });
  const [nouveauTag, setNouveauTag] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({
    titre: '',
    histoire: '',
    categorie: '',
    photo: ''
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const categoriesExperience = [
    { value: 'grossesse_1er_trimestre', label: 'Mon 1er trimestre', icon: '🤰' },
    { value: 'grossesse_2eme_trimestre', label: 'Mon 2ème trimestre', icon: '🤰' },
    { value: 'grossesse_3eme_trimestre', label: 'Mon 3ème trimestre', icon: '🤰' },
    { value: 'accouchement', label: 'Mon accouchement', icon: '👶' },
    { value: 'post_partum', label: 'Mon post-partum', icon: '💕' },
    { value: 'allaitement', label: 'Mon expérience allaitement', icon: '🍼' },
    { value: 'sante_nouveau_ne', label: 'Nouveau-né', icon: '👶' },
    { value: 'sante_nourrisson', label: 'Nourrisson', icon: '👶' },
    { value: 'developpement_enfant', label: 'Développement enfant', icon: '🎯' },
    { value: 'temoignages', label: 'Témoignage général', icon: '💬' }
  ];

  const tagsPopulaires = [
    'première grossesse',
    'grossesse gémellaire',
    'accouchement naturel',
    'césarienne',
    'allaitement mixte',
    'baby blues',
    'retour au travail',
    'adoption',
    'prématuré',
    'sommeil',
    'alimentation',
    'crèche',
    'papa poule'
  ];

  const ajouterTag = () => {
    if (nouveauTag.trim() && !formData.tags.includes(nouveauTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, nouveauTag.trim()]
      });
      setNouveauTag('');
    }
  };

  const supprimerTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const compressImage = (file, maxSizeMB = 5) => {
    return new Promise((resolve, reject) => {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > maxSizeMB) {
        reject(new Error(`La photo est trop volumineuse (${fileSizeMB.toFixed(1)} Mo). Maximum autorisé : ${maxSizeMB} Mo`));
        return;
      }

      if (fileSizeMB < 1) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, photo: 'Veuillez sélectionner une image valide' });
      return;
    }

    setUploadingPhoto(true);
    setErrors({ ...errors, photo: '' });

    try {
      const compressedFile = await compressImage(file);
      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
      
      console.log(`Image compressée: ${compressedSizeMB} Mo`);

      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
      setFormData({
        ...formData,
        photos: [...formData.photos, file_url]
      });
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setErrors({ ...errors, photo: error.message || 'Erreur lors du téléchargement de la photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const supprimerPhoto = (photoUrl) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter(p => p !== photoUrl)
    });
  };

  const validateForm = () => {
    const newErrors = {
      titre: '',
      histoire: '',
      categorie: '',
      photo: ''
    };

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est obligatoire';
    } else if (formData.titre.length > 100) {
      newErrors.titre = 'Le titre ne doit pas dépasser 100 caractères';
    }

    if (!formData.histoire.trim()) {
      newErrors.histoire = 'Veuillez raconter votre histoire';
    } else if (formData.histoire.length < 50) {
      newErrors.histoire = 'Votre histoire doit contenir au moins 50 caractères';
    }

    if (!formData.categorie) {
      newErrors.categorie = 'Veuillez sélectionner une catégorie';
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(error => error !== '');
  };

  const publierExperienceMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Veuillez corriger les erreurs dans le formulaire');
      }
      const contenuComplet = `
${formData.histoire}

${formData.conseil_principal ? `\n💡 **Mon conseil principal :** ${formData.conseil_principal}` : ''}

${formData.evaluation ? `\n⭐ **Mon expérience : ${formData.evaluation}/5 étoiles**` : ''}

${formData.photos.length > 0 ? `\n📸 **Photos partagées : ${formData.photos.length}**` : ''}
      `.trim();

      const specialites = ['gynecologie', 'pediatrie', 'sage_femme', 'medecin_generaliste', 'infirmier', 'nutritionniste'];
      const isSpecialist = userProfile?.type_compte && specialites.includes(userProfile.type_compte);

      const messageData = {
        sujet: formData.titre,
        contenu: contenuComplet,
        categorie: formData.categorie,
        sous_forum: 'temoignages',
        auteur_nom: user.full_name || 'Anonyme',
        auteur_type: isSpecialist ? 'specialiste' : 'maman',
        auteur_specialite: isSpecialist ? userProfile.type_compte : undefined,
        auteur_anonyme: false,
        tags: formData.tags,
        reactions: {},
        reponses: [],
        upvotes: [],
        statut_moderation: 'approuve',
        signalements: [],
        metadata: {
          type: 'experience',
          evaluation: formData.evaluation,
          photos: formData.photos,
          conseil_principal: formData.conseil_principal
        }
      };

      return base44.entities.MessageCommunaute.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
      alert('✅ Votre expérience a été partagée avec succès !');
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erreur: ${error.message}`);
    }
  });

  const scrollToTop = () => {
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
      modalContent.scrollTo({ top: modalContent.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-0 md:p-4">
      <div className="relative w-full h-full md:h-auto md:max-w-3xl md:my-8 flex flex-col">
        {/* Boutons de défilement flottants */}
        <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 z-[101]">
          <Button
            onClick={scrollToTop}
            size="icon"
            className="bg-pink-500 hover:bg-pink-600 shadow-lg rounded-full"
            title="Défiler vers le haut"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="bg-pink-500 hover:bg-pink-600 shadow-lg rounded-full"
            title="Défiler vers le bas"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>

        <div 
          id="modal-content"
          className="w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Card className="w-full shadow-2xl md:rounded-lg rounded-none min-h-full md:min-h-0">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                  Partagez votre expérience
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Votre histoire peut aider et inspirer d'autres mamans
              </p>
            </CardHeader>

            <CardContent className="space-y-6 p-4 md:p-6">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="titre">
                  Titre de votre expérience * <span className="text-xs text-gray-500">(max 100 caractères)</span>
                </Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData({ ...formData, titre: newValue });
                    if (errors.titre) {
                      setErrors({ ...errors, titre: '' });
                    }
                  }}
                  placeholder="Ex: Mon accouchement naturel à la maternité de Cocody"
                  className={`text-lg ${errors.titre ? 'border-red-500 focus:ring-red-500' : ''}`}
                  maxLength={100}
                />
                <div className="flex justify-between items-center">
                  {errors.titre && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.titre}
                    </p>
                  )}
                  <p className={`text-xs ${formData.titre.length > 90 ? 'text-orange-600 font-semibold' : 'text-gray-500'} ml-auto`}>
                    {formData.titre.length}/100
                  </p>
                </div>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select 
                  value={formData.categorie} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, categorie: value });
                    if (errors.categorie) {
                      setErrors({ ...errors, categorie: '' });
                    }
                  }}
                >
                  <SelectTrigger className={errors.categorie ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesExperience.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categorie && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.categorie}
                  </p>
                )}
              </div>

              {/* Histoire */}
              <div className="space-y-2">
                <Label htmlFor="histoire">
                  Racontez votre histoire * <span className="text-xs text-gray-500">(min 50 caractères)</span>
                </Label>
                <Textarea
                  id="histoire"
                  value={formData.histoire}
                  onChange={(e) => {
                    setFormData({ ...formData, histoire: e.target.value });
                    if (errors.histoire) {
                      setErrors({ ...errors, histoire: '' });
                    }
                  }}
                  placeholder="Partagez votre expérience, vos émotions, ce qui vous a aidée..."
                  rows={8}
                  className={`resize-none ${errors.histoire ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <div className="flex justify-between items-center">
                  {errors.histoire && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.histoire}
                    </p>
                  )}
                  <p className={`text-xs ${formData.histoire.length < 50 ? 'text-orange-600' : 'text-gray-500'} ml-auto`}>
                    {formData.histoire.length} caractères {formData.histoire.length < 50 && `(encore ${50 - formData.histoire.length} minimum)`}
                  </p>
                </div>
              </div>

              {/* Conseil principal */}
              <div className="space-y-2">
                <Label htmlFor="conseil">
                  💡 Votre conseil principal aux autres mamans
                </Label>
                <Input
                  id="conseil"
                  value={formData.conseil_principal}
                  onChange={(e) => setFormData({ ...formData, conseil_principal: e.target.value })}
                  placeholder="Ex: N'hésitez pas à demander de l'aide, ce n'est pas un signe de faiblesse"
                />
              </div>

              {/* Évaluation */}
              <div className="space-y-2">
                <Label>⭐ Comment évalueriez-vous cette expérience ?</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, evaluation: rating })}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 ${rating <= formData.evaluation ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.evaluation}/5
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>🏷️ Tags (pour aider les autres à trouver votre histoire)</Label>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-gray-50">
                  {formData.tags.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun tag ajouté</p>
                  ) : (
                    formData.tags.map((tag) => (
                      <Badge key={tag} className="bg-purple-100 text-purple-800 flex items-center gap-2">
                        {tag}
                        <button onClick={() => supprimerTag(tag)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={nouveauTag}
                    onChange={(e) => setNouveauTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterTag())}
                  />
                  <Button type="button" onClick={ajouterTag} variant="outline">
                    Ajouter
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-gray-600 w-full mb-1">Tags populaires :</p>
                  {tagsPopulaires.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(tag)) {
                          setFormData({ ...formData, tags: [...formData.tags, tag] });
                        }
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-white border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label>
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Photos (optionnel) <span className="text-xs text-gray-500">(max 5 Mo par photo)</span>
                </Label>
                
                {errors.photo && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {errors.photo}
                    </AlertDescription>
                  </Alert>
                )}
                
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => supprimerPhoto(photo)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.photos.length < 5 && (
                  <>
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={uploadPhoto}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPhoto}
                      className="w-full"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Ajouter une photo ({formData.photos.length}/5)
                        </>
                      )}
                    </Button>
                  </>
                )}
                <p className="text-xs text-gray-500">
                  📸 Partagez des photos de moments spéciaux (max 5). Les images sont automatiquement compressées.
                </p>
              </div>

              {/* Info */}
              <Alert className="bg-pink-50 border-pink-200">
                <Heart className="w-4 h-4 text-pink-600" />
                <AlertDescription className="text-pink-900">
                  <strong>💝 Merci de partager votre histoire !</strong>
                  <p className="text-sm mt-1">
                    Votre expérience peut apporter du réconfort, des conseils et de l'espoir à d'autres mamans.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-safe">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (validateForm()) {
                      publierExperienceMutation.mutate();
                    }
                  }}
                  disabled={publierExperienceMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {publierExperienceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Partager
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}