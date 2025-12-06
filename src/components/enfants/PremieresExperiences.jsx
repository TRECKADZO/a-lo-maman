import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star,
  Plus,
  Camera,
  Video,
  Heart,
  Baby,
  Footprints,
  MessageCircle,
  Smile,
  Utensils,
  Moon,
  Music,
  BookOpen,
  X,
  Play,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';
import { motion, AnimatePresence } from 'framer-motion';

// Types de premières expériences
const TYPES_EXPERIENCES = [
  { id: 'premier_sourire', label: 'Premier sourire', icon: Smile, color: 'pink', age_moyen: 2 },
  { id: 'premier_rire', label: 'Premier éclat de rire', icon: Heart, color: 'rose', age_moyen: 4 },
  { id: 'tete_levee', label: 'Tient sa tête', icon: Baby, color: 'blue', age_moyen: 3 },
  { id: 'retournement', label: 'Se retourne', icon: Baby, color: 'cyan', age_moyen: 4 },
  { id: 'position_assise', label: 'Assis sans aide', icon: Baby, color: 'teal', age_moyen: 6 },
  { id: 'quatre_pattes', label: 'À quatre pattes', icon: Footprints, color: 'green', age_moyen: 8 },
  { id: 'premiers_pas', label: 'Premiers pas', icon: Footprints, color: 'emerald', age_moyen: 12 },
  { id: 'premier_mot', label: 'Premier mot', icon: MessageCircle, color: 'purple', age_moyen: 12 },
  { id: 'dit_maman', label: 'Dit "Maman"', icon: Heart, color: 'pink', age_moyen: 10 },
  { id: 'dit_papa', label: 'Dit "Papa"', icon: Heart, color: 'blue', age_moyen: 10 },
  { id: 'premiere_dent', label: 'Première dent', icon: Smile, color: 'amber', age_moyen: 6 },
  { id: 'premier_aliment', label: 'Premier aliment solide', icon: Utensils, color: 'orange', age_moyen: 6 },
  { id: 'premiere_nuit', label: 'Première nuit complète', icon: Moon, color: 'indigo', age_moyen: 3 },
  { id: 'premier_bain', label: 'Premier bain', icon: Baby, color: 'sky', age_moyen: 0 },
  { id: 'premiere_chanson', label: 'Chante', icon: Music, color: 'violet', age_moyen: 18 },
  { id: 'premier_livre', label: 'Premier livre', icon: BookOpen, color: 'amber', age_moyen: 6 },
  { id: 'autre', label: 'Autre moment spécial', icon: Star, color: 'yellow', age_moyen: null },
];

export default function PremieresExperiences({ enfant, isEditable = false }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    titre_personnalise: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    photo_url: null,
    video_url: null,
  });
  const [uploading, setUploading] = useState(false);

  // Récupérer les expériences enregistrées
  const experiences = enfant.premieres_experiences || [];

  // Calculer l'âge en mois/jours pour chaque expérience
  const getAgeAtExperience = (dateExperience) => {
    const mois = differenceInMonths(new Date(dateExperience), new Date(enfant.date_naissance));
    const jours = differenceInDays(new Date(dateExperience), new Date(enfant.date_naissance)) % 30;
    if (mois === 0) return `${jours} jours`;
    if (jours === 0) return `${mois} mois`;
    return `${mois} mois et ${jours} jours`;
  };

  // Expériences non encore enregistrées
  const experiencesManquantes = TYPES_EXPERIENCES.filter(
    type => type.id !== 'autre' && !experiences.find(e => e.type === type.id)
  );

  // Upload de fichier
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'photo') {
        setFormData({ ...formData, photo_url: file_url });
      } else {
        setFormData({ ...formData, video_url: file_url });
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  // Mutation pour ajouter une expérience
  const ajouterMutation = useMutation({
    mutationFn: async (data) => {
      const experiencesActuelles = enfant.premieres_experiences || [];
      const typeInfo = TYPES_EXPERIENCES.find(t => t.id === data.type);
      
      const nouvelleExperience = {
        id: Date.now().toString(),
        type: data.type,
        titre: data.titre_personnalise || typeInfo?.label || 'Moment spécial',
        date: data.date,
        description: data.description,
        photo_url: data.photo_url,
        video_url: data.video_url,
        created_at: new Date().toISOString(),
      };

      await base44.entities.EnfantCarnet.update(enfant.id, {
        premieres_experiences: [...experiencesActuelles, nouvelleExperience]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfant.id] });
      setShowAjouter(false);
      setSelectedExperience(null);
      setFormData({
        type: '',
        titre_personnalise: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        photo_url: null,
        video_url: null,
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterMutation.mutate(formData);
  };

  const getTypeInfo = (typeId) => {
    return TYPES_EXPERIENCES.find(t => t.id === typeId) || TYPES_EXPERIENCES.find(t => t.id === 'autre');
  };

  const getColorClasses = (color) => {
    const colors = {
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      rose: 'bg-rose-100 text-rose-600 border-rose-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
      teal: 'bg-teal-100 text-teal-600 border-teal-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      amber: 'bg-amber-100 text-amber-600 border-amber-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      sky: 'bg-sky-100 text-sky-600 border-sky-200',
      violet: 'bg-violet-100 text-violet-600 border-violet-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    };
    return colors[color] || colors.pink;
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="shadow-xl border-none rounded-3xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <span>Premières fois</span>
              <p className="text-sm font-normal text-gray-600 mt-1">
                Les moments magiques de {enfant.prenom}
              </p>
            </div>
          </CardTitle>
          {isEditable && (
            <Touchable onPress={() => setShowAjouter(true)} haptic>
              <Button className="bg-pink-600 hover:bg-pink-700 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un souvenir
              </Button>
            </Touchable>
          )}
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-600">{experiences.length}</p>
            <p className="text-xs text-pink-900">Moments enregistrés</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{experiencesManquantes.length}</p>
            <p className="text-xs text-amber-900">À découvrir</p>
          </CardContent>
        </Card>
      </div>

      {/* Expériences à venir */}
      {experiencesManquantes.length > 0 && isEditable && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              Prochaines étapes à guetter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {experiencesManquantes.slice(0, 6).map((type) => {
                const IconComponent = type.icon;
                return (
                  <Touchable
                    key={type.id}
                    onPress={() => {
                      setFormData({ ...formData, type: type.id });
                      setSelectedExperience(type);
                      setShowAjouter(true);
                    }}
                  >
                    <Badge
                      variant="outline"
                      className={`${getColorClasses(type.color)} cursor-pointer hover:shadow-md transition-all py-2 px-3`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {type.label}
                      {type.age_moyen && (
                        <span className="ml-2 opacity-60">~{type.age_moyen}m</span>
                      )}
                    </Badge>
                  </Touchable>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline des expériences */}
      {experiences.length > 0 ? (
        <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Journal des premières fois
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <AnimatePresence>
                {experiences
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((experience, index) => {
                    const typeInfo = getTypeInfo(experience.type);
                    const IconComponent = typeInfo?.icon || Star;
                    
                    return (
                      <motion.div
                        key={experience.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        <div className={`border-l-4 p-4 rounded-r-2xl shadow-md ${getColorClasses(typeInfo?.color || 'pink')}`}>
                          <div className="flex items-start gap-4">
                            {/* Icône */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 bg-white`}>
                              <IconComponent className="w-6 h-6" />
                            </div>

                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="font-bold text-lg">{experience.titre}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {getAgeAtExperience(experience.date)}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {format(new Date(experience.date), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                              
                              {experience.description && (
                                <p className="text-sm text-gray-700 mb-3">{experience.description}</p>
                              )}

                              {/* Médias */}
                              <div className="flex gap-2 flex-wrap">
                                {experience.photo_url && (
                                  <div className="relative">
                                    <img
                                      src={experience.photo_url}
                                      alt={experience.titre}
                                      className="w-24 h-24 object-cover rounded-xl shadow-md"
                                    />
                                    <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow">
                                      <Camera className="w-3 h-3 text-gray-600" />
                                    </div>
                                  </div>
                                )}
                                {experience.video_url && (
                                  <a
                                    href={experience.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-24 h-24 bg-gray-900 rounded-xl flex items-center justify-center shadow-md"
                                  >
                                    <Play className="w-8 h-8 text-white" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              Aucun moment spécial enregistré pour l'instant
            </p>
            {isEditable && (
              <Button onClick={() => setShowAjouter(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier souvenir
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom Sheet - Ajouter une expérience */}
      <BottomSheet
        isOpen={showAjouter}
        onClose={() => {
          setShowAjouter(false);
          setSelectedExperience(null);
        }}
        title="Enregistrer un moment spécial"
        fullHeight
      >
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélection du type */}
            <div>
              <Label>Type de moment *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value });
                  setSelectedExperience(TYPES_EXPERIENCES.find(t => t.id === value));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_EXPERIENCES.map((type) => {
                    const IconComponent = type.icon;
                    const isDisabled = type.id !== 'autre' && experiences.find(e => e.type === type.id);
                    return (
                      <SelectItem key={type.id} value={type.id} disabled={isDisabled}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {type.label}
                          {isDisabled && <span className="text-xs text-gray-400">(déjà enregistré)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Titre personnalisé pour "Autre" */}
            {formData.type === 'autre' && (
              <div>
                <Label>Titre du moment *</Label>
                <Input
                  value={formData.titre_personnalise}
                  onChange={(e) => setFormData({ ...formData, titre_personnalise: e.target.value })}
                  placeholder="Ex: Premier voyage, Premier Noël..."
                  required
                />
              </div>
            )}

            {/* Date */}
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Racontez ce moment magique..."
                rows={3}
              />
            </div>

            {/* Upload photo */}
            <div>
              <Label>Photo (optionnel)</Label>
              <div className="mt-2">
                {formData.photo_url ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: null })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Ajouter une photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Upload vidéo */}
            <div>
              <Label>Vidéo (optionnel)</Label>
              <div className="mt-2">
                {formData.video_url ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                    <Video className="w-5 h-5 text-gray-600" />
                    <span className="text-sm flex-1 truncate">Vidéo ajoutée</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, video_url: null })}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50">
                    <Video className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Ajouter une vidéo</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Upload en cours...</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAjouter(false);
                  setSelectedExperience(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={ajouterMutation.isPending || uploading || !formData.type}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {ajouterMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </BottomSheet>
    </div>
  );
}