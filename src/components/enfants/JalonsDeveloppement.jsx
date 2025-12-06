import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity, AlertCircle, CheckCircle, Trash2, Camera, Video, Target, X, Loader2 } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";

// New imports for dialog and form components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { CardTransition, ListTransition } from '@/components/ui/page-transition';
import { Touchable } from '@/components/ui/native-interactions';

// Jalons prédéfinis par catégorie et âge
const jalonsPredefinis = {
  moteur: [
    { jalon: 'Tient sa tête', age_attendu_mois: 3 },
    { jalon: 'Se retourne', age_attendu_mois: 5 },
    { jalon: 'S\'assoit seul', age_attendu_mois: 7 },
    { jalon: 'Rampe ou se déplace à 4 pattes', age_attendu_mois: 9 },
    { jalon: 'Se tient debout avec appui', age_attendu_mois: 10 },
    { jalon: 'Marche seul', age_attendu_mois: 13 },
    { jalon: 'Monte les escaliers', age_attendu_mois: 18 },
    { jalon: 'Court', age_attendu_mois: 24 },
    { jalon: 'Pédale sur un tricycle', age_attendu_mois: 36 }
  ],
  langage: [
    { jalon: 'Émet des sons (gazouille)', age_attendu_mois: 3 },
    { jalon: 'Babille (ba-ba, ma-ma)', age_attendu_mois: 7 },
    { jalon: 'Dit 1-2 mots', age_attendu_mois: 12 },
    { jalon: 'Dit 10-20 mots', age_attendu_mois: 18 },
    { jalon: 'Fait des phrases de 2 mots', age_attendu_mois: 24 },
    { jalon: 'Fait des phrases de 3-4 mots', age_attendu_mois: 36 },
    { jalon: 'Parle clairement', age_attendu_mois: 48 }
  ],
  social: [
    { jalon: 'Sourit en réponse', age_attendu_mois: 2 },
    { jalon: 'Reconnaît les visages familiers', age_attendu_mois: 4 },
    { jalon: 'Répond à son prénom', age_attendu_mois: 9 },
    { jalon: 'Fait "au revoir" de la main', age_attendu_mois: 10 },
    { jalon: 'Joue à faire semblant', age_attendu_mois: 18 },
    { jalon: 'Joue avec d\'autres enfants', age_attendu_mois: 30 },
    { jalon: 'Exprime ses émotions', age_attendu_mois: 36 }
  ],
  cognitif: [
    { jalon: 'Suit des objets des yeux', age_attendu_mois: 2 },
    { jalon: 'Explore avec les mains', age_attendu_mois: 5 },
    { jalon: 'Cherche un objet caché', age_attendu_mois: 9 },
    { jalon: 'Pointe du doigt', age_attendu_mois: 12 },
    { jalon: 'Nomme des objets familiers', age_attendu_mois: 18 },
    { jalon: 'Trie par forme et couleur', age_attendu_mois: 30 },
    { jalon: 'Compte jusqu\'à 10', age_attendu_mois: 48 }
  ]
};

export default function JalonsDeveloppement({ enfant, isEditable = false }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [formData, setFormData] = useState({
    categorie: 'moteur',
    jalon: '',
    age_attendu_mois: null,
    atteint: false,
    date_atteint: null,
    notes: '',
    photo_url: '',
    video_url: ''
  });

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [type === 'photo' ? 'photo_url' : 'video_url']: file_url
      }));
    } catch (error) {
      alert('Erreur lors de l\'upload');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const ajouterJalonMutation = useMutation({
    mutationFn: async (newJalon) => {
      const jalons = [...(enfant.jalons_developpement || [])];
      jalons.push(newJalon);
      return base44.entities.EnfantCarnet.update(enfant.id, { jalons_developpement: jalons });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] }); // Added
      queryClient.invalidateQueries({ queryKey: ['dossier_patient'] }); // Added
      setShowAddDialog(false);
      setFormData({
        categorie: 'moteur',
        jalon: '',
        age_attendu_mois: null,
        atteint: false,
        date_atteint: null,
        notes: '',
        photo_url: '',
        video_url: ''
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout du jalon:", error);
      alert("Une erreur est survenue lors de l'ajout du jalon."); // Added
    }
  });

  const marquerAtteintMutation = useMutation({
    mutationFn: async ({ index, atteint, date_atteint }) => {
      const jalons = [...(enfant.jalons_developpement || [])];
      if (jalons[index]) { // Ensure the jalon exists at the given index
        jalons[index] = {
          ...jalons[index],
          atteint,
          date_atteint: date_atteint ? format(date_atteint, 'yyyy-MM-dd') : null
        };
      }
      return base44.entities.EnfantCarnet.update(enfant.id, { jalons_developpement: jalons });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] }); // Added
      queryClient.invalidateQueries({ queryKey: ['dossier_patient'] }); // Added
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du jalon:", error);
    }
  });

  const supprimerMutation = useMutation({
    mutationFn: async (indexToRemove) => {
      const jalons = (enfant.jalons_developpement || []).filter((_, index) => index !== indexToRemove);
      return base44.entities.EnfantCarnet.update(enfant.id, { jalons_developpement: jalons });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] }); // Added
      queryClient.invalidateQueries({ queryKey: ['dossier_patient'] }); // Added
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du jalon:", error);
    }
  });

  // Calculer l'âge actuel en mois
  const ageEnMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));

  // Regrouper les jalons par catégorie et ajouter les jalons suggérés
  const jalonsParCategorie = (enfant.jalons_developpement || []).reduce((acc, jalon, index) => {
    if (!acc[jalon.categorie]) acc[jalon.categorie] = [];
    acc[jalon.categorie].push({ ...jalon, index }); // Keep original index for mutations
    return acc;
  }, {});

  // Ajouter les jalons manquants (prédéfinis mais pas encore ajoutés) comme "suggérés"
  Object.keys(jalonsPredefinis).forEach(categorie => {
    jalonsPredefinis[categorie].forEach(jalonPred => {
      const exists = (enfant.jalons_developpement || []).some(
        j => j.categorie === categorie && j.jalon === jalonPred.jalon
      );
      // Suggest if not already added AND if age_attendu_mois is within a reasonable range (e.g., up to 6 months in the future)
      if (!exists && jalonPred.age_attendu_mois <= ageEnMois + 6 && jalonPred.age_attendu_mois >= ageEnMois - 12) {
        if (!jalonsParCategorie[categorie]) jalonsParCategorie[categorie] = [];
        jalonsParCategorie[categorie].push({
          ...jalonPred,
          categorie,
          atteint: false,
          notes: "",
          index: -1 // Indique que c'est un jalon suggéré
        });
      }
    });
  });

  // Ensure all categories are present, even if empty
  Object.keys(jalonsPredefinis).forEach(cat => {
    if (!jalonsParCategorie[cat]) {
      jalonsParCategorie[cat] = [];
    }
  });

  const categorieInfo = {
    moteur: { label: 'Motricité', color: 'from-blue-400 to-cyan-500', icon: '🏃' },
    langage: { label: 'Langage', color: 'from-purple-400 to-violet-500', icon: '💬' },
    social: { label: 'Social', color: 'from-pink-400 to-rose-500', icon: '🤝' },
    cognitif: { label: 'Cognitif', color: 'from-amber-400 to-orange-500', icon: '🧠' }
  };

  const handleMarquerAtteint = (index, currentlyAtteint) => {
    if (currentlyAtteint) {
      // If already achieved, uncheck
      marquerAtteintMutation.mutate({ index, atteint: false, date_atteint: null });
    } else {
      // If not achieved, check with today's date
      marquerAtteintMutation.mutate({ index, atteint: true, date_atteint: new Date() });
    }
  };

  const ajouterJalonSuggere = async (jalonSuggere) => {
    const newJalonData = {
      categorie: jalonSuggere.categorie,
      jalon: jalonSuggere.jalon,
      age_attendu_mois: jalonSuggere.age_attendu_mois,
      atteint: true, // When adding from suggestion, it's typically marked as achieved
      date_atteint: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    };
    await ajouterJalonMutation.mutateAsync(newJalonData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newJalon = {
      ...formData,
      date_atteint: formData.atteint ? format(new Date(), 'yyyy-MM-dd') : null,
      age_attendu_mois: formData.age_attendu_mois ? parseInt(formData.age_attendu_mois, 10) : null
    };
    ajouterJalonMutation.mutate(newJalon);
  };

  // Calculer alertes jalons
  const jalonsEnRetard = (enfant.jalons_developpement || []).filter(j => 
    !j.atteint && j.age_attendu_mois && ageEnMois > j.age_attendu_mois + 2
  );

  const prochainJalon = (enfant.jalons_developpement || [])
    .filter(j => !j.atteint && j.age_attendu_mois >= ageEnMois)
    .sort((a, b) => a.age_attendu_mois - b.age_attendu_mois)[0];

  return (
    <div className="space-y-4">
      {/* Alerte jalons en retard */}
      {jalonsEnRetard.length > 0 && (
        <CardTransition>
          <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-2xl shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-orange-900 dark:text-orange-100 mb-2">
                    ⚠️ {jalonsEnRetard.length} jalon(s) en retard
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Certaines étapes de développement attendues ne sont pas encore atteintes. Parlez-en à votre pédiatre lors de la prochaine consultation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardTransition>
      )}

      {/* Prochain jalon */}
      {prochainJalon && (
        <CardTransition delay={0.05}>
          <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                    🎯 Prochain jalon attendu
                  </p>
                  <p className="text-base text-blue-800 dark:text-blue-200 font-semibold">
                    {prochainJalon.jalon}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Âge attendu : {prochainJalon.age_attendu_mois} mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardTransition>
      )}

      <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              Jalons de développement
            </CardTitle>
            {isEditable && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Touchable haptic>
                    <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un jalon
                    </Button>
                  </Touchable>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau jalon</DialogTitle>
                  <DialogDescription>
                    Enregistrez un nouveau jalon de développement pour {enfant.prenom}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categorie" className="text-right">
                      Catégorie
                    </Label>
                    <Select value={formData.categorie} onValueChange={(val) => handleSelectChange('categorie', val)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(categorieInfo).map((key) => (
                          <SelectItem key={key} value={key}>
                            {categorieInfo[key].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="jalon" className="text-right">
                      Jalon
                    </Label>
                    <Input
                      id="jalon"
                      value={formData.jalon}
                      onChange={handleChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="age_attendu_mois" className="text-right">
                      Âge attendu (mois)
                    </Label>
                    <Input
                      id="age_attendu_mois"
                      type="number"
                      value={formData.age_attendu_mois || ''}
                      onChange={handleChange}
                      className="col-span-3"
                      placeholder="Ex: 12"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="col-span-3"
                      placeholder="Observations supplémentaires..."
                    />
                  </div>
                  {/* Photo */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Photo</Label>
                    <div className="col-span-3">
                      {formData.photo_url ? (
                        <div className="relative inline-block">
                          <img src={formData.photo_url} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, photo_url: ''})}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                          <Camera className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">Ajouter une photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMediaUpload(e, 'photo')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Vidéo */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Vidéo</Label>
                    <div className="col-span-3">
                      {formData.video_url ? (
                        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                          <Video className="w-5 h-5 text-gray-600" />
                          <span className="text-sm flex-1">Vidéo ajoutée</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, video_url: ''})}
                            className="text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                          <Video className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">Ajouter une vidéo</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleMediaUpload(e, 'video')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {uploadingMedia && (
                    <div className="flex items-center gap-2 text-blue-600 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Upload en cours...</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 justify-end">
                    <Checkbox
                      id="atteint"
                      checked={formData.atteint}
                      onCheckedChange={(checked) => handleSelectChange('atteint', checked)}
                    />
                    <Label htmlFor="atteint">Jalon déjà atteint</Label>
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={ajouterJalonMutation.isPending || uploadingMedia}>
                    {ajouterJalonMutation.isPending ? "Ajout en cours..." : "Ajouter le jalon"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
        <CardContent className="space-y-6 p-5">
          {/* Statistiques par catégorie optimisées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(categorieInfo).map((cat, idx) => {
              const jalonsCateg = (jalonsParCategorie[cat] || []).filter(j => j.index !== -1);
              const atteints = jalonsCateg.filter(j => j.atteint).length;
              const total = jalonsCateg.length;
              const pourcentage = total > 0 ? Math.round((atteints / total) * 100) : 0;

              return (
                <CardTransition key={cat} delay={idx * 0.05}>
                  <div className={`p-5 rounded-2xl bg-gradient-to-br ${categorieInfo[cat].color} text-white shadow-lg`}>
                    <div className="text-4xl mb-3">{categorieInfo[cat].icon}</div>
                    <p className="font-bold text-sm mb-2">{categorieInfo[cat].label}</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">{pourcentage}</p>
                      <p className="text-lg mb-0.5">%</p>
                    </div>
                    <p className="text-xs opacity-90 mt-1">{atteints}/{total} atteints</p>
                  </div>
                </CardTransition>
              );
            })}
          </div>

          {/* Jalons par catégorie */}
          <Tabs defaultValue="moteur">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-white rounded-2xl shadow-md">
              {Object.keys(categorieInfo).map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="rounded-xl py-3 text-xs md:text-sm data-[state=active]:shadow-md"
                >
                  <span className="text-lg mr-1 md:mr-2">{categorieInfo[cat].icon}</span>
                  <span className="hidden md:inline">{categorieInfo[cat].label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

          {Object.keys(categorieInfo).map(cat => (
            <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
              <ListTransition staggerDelay={0.03}>
                {(jalonsParCategorie[cat] || [])
                  .sort((a, b) => (a.age_attendu_mois || 0) - (b.age_attendu_mois || 0))
                  .map((jalon, i) => {
                    const estEnRetard = !jalon.atteint && jalon.age_attendu_mois && ageEnMois > jalon.age_attendu_mois + 2;
                    const estSuggere = jalon.index === -1;
                    const estBientot = !jalon.atteint && jalon.age_attendu_mois && Math.abs(ageEnMois - jalon.age_attendu_mois) <= 1;

                    return (
                      <div
                        key={i}
                        className={`p-4 border-2 rounded-2xl transition-all shadow-sm ${
                          jalon.atteint
                            ? 'bg-green-50 border-green-400 dark:bg-green-950/30 dark:border-green-700'
                            : estEnRetard
                            ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/30 dark:border-orange-700'
                            : estSuggere
                            ? 'bg-blue-50 border-blue-400 border-dashed dark:bg-blue-950/30 dark:border-blue-700'
                            : estBientot
                            ? 'bg-purple-50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-700'
                            : 'bg-white dark:bg-gray-800 dark:border-gray-700 border-gray-300'
                        }`}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {!estSuggere && isEditable && ( // Only show checkbox for actual, added jalons
                            <Checkbox
                              checked={jalon.atteint}
                              onCheckedChange={() => handleMarquerAtteint(jalon.index, jalon.atteint)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100">{jalon.jalon}</h4>
                              {jalon.age_attendu_mois && (
                                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">
                                  ~{jalon.age_attendu_mois} mois
                                </Badge>
                              )}
                              {jalon.atteint && (
                                <Badge className="bg-green-600 text-white text-xs dark:bg-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Atteint
                                </Badge>
                              )}
                              {estEnRetard && (
                                <Badge className="bg-orange-600 text-white text-xs dark:bg-orange-700">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  En retard
                                </Badge>
                              )}
                              {estSuggere && (
                                <Badge className="bg-blue-500 text-white text-xs shadow-sm">
                                  💡 Suggéré
                                </Badge>
                              )}
                              {estBientot && !estSuggere && (
                                <Badge className="bg-purple-500 text-white text-xs shadow-sm">
                                  🎯 Bientôt
                                </Badge>
                              )}
                            </div>
                            {jalon.date_atteint && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Atteint le {format(new Date(jalon.date_atteint), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                            )}
                            {jalon.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{jalon.notes}</p>
                            )}
                            {/* Médias */}
                            {(jalon.photo_url || jalon.video_url) && (
                              <div className="flex gap-2 mt-2">
                                {jalon.photo_url && (
                                  <img src={jalon.photo_url} alt={jalon.jalon} className="w-16 h-16 object-cover rounded-lg" />
                                )}
                                {jalon.video_url && (
                                  <a href={jalon.video_url} target="_blank" rel="noopener noreferrer" 
                                     className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                                    <Video className="w-6 h-6 text-white" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {estSuggere && isEditable && (
                            <Touchable 
                              onPress={() => ajouterJalonSuggere(jalon)}
                              disabled={ajouterJalonMutation.isPending}
                              haptic
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={ajouterJalonMutation.isPending}
                                className="rounded-xl"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            </Touchable>
                          )}
                          {!estSuggere && isEditable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => supprimerMutation.mutate(jalon.index)}
                              disabled={supprimerMutation.isPending}
                              aria-label="Supprimer le jalon"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ListTransition>

              {((jalonsParCategorie[cat] || []).filter(j => j.index !== -1).length === 0 && (jalonsParCategorie[cat] || []).filter(j => j.index === -1).length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Aucun jalon enregistré ni suggéré pour cette catégorie.</p>
                  {isEditable && (
                    <Button size="sm" className="mt-4" onClick={() => { setFormData({ ...formData, categorie: cat }); setShowAddDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter le premier
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}