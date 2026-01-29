import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, User, Settings, Stethoscope, Camera, Upload, X, Award, CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import Configuration2FA from '@/components/security/Configuration2FA';
import AuthGuard from '../components/auth/AuthGuard';
import MonCodeLiaison from '@/components/pro/MonCodeLiaison';

const SPECIALITES = [
  { value: 'gynecologie', label: 'Gynécologie' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'sage_femme', label: 'Sage-femme' },
  { value: 'medecin_generaliste', label: 'Médecin généraliste' },
  { value: 'nutritionniste', label: 'Nutritionniste' },
  { value: 'infirmier', label: 'Infirmier(ère)' }
];

const DOMAINES_EXPERTISE = {
  gynecologie: [
    "Grossesse à risque", "Infertilité", "Endométriose", "Ménopause", "Contraception", "Cancers gynécologiques"
  ],
  pediatrie: [
    "Néonatologie", "Vaccination", "Maladies infantiles", "Nutrition pédiatrique", "Développement de l'enfant", "Urgences pédiatriques"
  ],
  sage_femme: [
    "Accouchement naturel", "Suivi grossesse", "Allaitement", "Rééducation périnéale", "Préparation à l'accouchement"
  ],
  medecin_generaliste: [
    "Médecine familiale", "Maladies chroniques", "Santé préventive", "Soins primaires"
  ],
  nutritionniste: [
    "Nutrition grossesse", "Nutrition infantile", "Perte de poids", "Diabète", "Allergies alimentaires"
  ],
  infirmier: [
    "Soins à domicile", "Soins post-opératoires", "Gestion des plaies", "Administration de traitements"
  ]
};

const ASSURANCES = [
  "CMU (Couverture Maladie Universelle)", "MUGEF-CI", "CGRAE", "AXA Assurances",
  "NSIA Assurances", "Saham Assurance", "SUNU Assurances", "Allianz", "AGF", "Aucune assurance"
];

const regions = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

export default function ProfilProfessionnel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedExpertises, setSelectedExpertises] = useState([]);
  const [selectedAssurances, setSelectedAssurances] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tarifsParType, setTarifsParType] = useState({
    cabinet: '',
    clinique: '',
    hopital: '',
    telephone: '',
    visio: ''
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profiles, isLoading: loadingPro } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);
      
      const proProfil = proProfiles.find(p => p.email === user.email);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
    staleTime: 0,
  });

  const profilProRaw = profiles?.pro;

  React.useEffect(() => {
    if (!loadingPro && !profilProRaw && user) {
      navigate(createPageUrl('Parametres'), { replace: true });
    }
  }, [profilProRaw, loadingPro, user, navigate]);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { isSubmitting, errors, isDirty } } = useForm({
    mode: 'onChange',
    defaultValues: {
      display_name: '',
      email: '',
      photo: '',
      specialite: '',
      telephone: '',
      adresse: '',
      structure_sante: '',
      tarif_consultation: '',
      biographie: '',
      accepte_cmu: true,
      ville: '',
      region: '',
      langue_preferee: 'francais',
      theme_prefere: 'clair',
    }
  });

  const photoValue = watch('photo');
  const selectedSpecialite = watch('specialite');
  const watchedValues = watch(['display_name', 'specialite', 'region', 'ville', 'telephone', 'biographie']);

  const champsObligatoiresAgenda = {
    display_name: watchedValues[0],
    specialite: watchedValues[1],
    region: watchedValues[2],
    ville: watchedValues[3],
    telephone: watchedValues[4],
    biographie: watchedValues[5],
  };

  const champsMananquants = Object.entries(champsObligatoiresAgenda)
    .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
    .map(([key]) => {
      const labels = {
        display_name: "Nom d'affichage",
        specialite: 'Spécialité',
        region: 'Région',
        ville: 'Ville',
        telephone: 'Téléphone professionnel',
        biographie: 'Présentation professionnelle'
      };
      return labels[key] || key;
    });

  const profilComplet = champsMananquants.length === 0;

  const isFieldComplete = (fieldName) => {
    const value = champsObligatoiresAgenda[fieldName];
    return value && (typeof value !== 'string' || value.trim() !== '');
  };

  useEffect(() => {
    if (user && profilProRaw) {
      const formData = {
        display_name: profilProRaw.display_name || profilProRaw.nom_complet || user.full_name || '',
        email: user.email || '',
        photo: profilProRaw.photo || '',
        specialite: profilProRaw.specialite || '',
        ville: profilProRaw.ville || '',
        region: profilProRaw.region || '',
        telephone: profilProRaw.telephone || '',
        adresse: profilProRaw.adresse || '',
        structure_sante: profilProRaw.structure_sante || '',
        tarif_consultation: profilProRaw.tarif_consultation || '',
        biographie: profilProRaw.biographie || '',
        accepte_cmu: profilProRaw.accepte_cmu !== false,
        langue_preferee: profilProRaw.langue_preferee || 'francais',
        theme_prefere: profilProRaw.theme_prefere || 'clair',
      };
      
      reset(formData);
      setSelectedExpertises(profilProRaw.certifications || []);
      setSelectedAssurances(profilProRaw.assurances_acceptees || []);
      setTarifsParType(profilProRaw.tarifs_par_type || {
        cabinet: '',
        clinique: '',
        hopital: '',
        telephone: '',
        visio: ''
      });
    }
  }, [user, profilProRaw, reset]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setValue('photo', file_url);
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      alert('❌ Erreur lors du téléchargement de la photo. Veuillez réessayer.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddExpertise = (expertise) => {
    if (!selectedExpertises.includes(expertise)) {
      setSelectedExpertises([...selectedExpertises, expertise]);
    }
  };

  const handleRemoveExpertise = (expertise) => {
    setSelectedExpertises(selectedExpertises.filter(e => e !== expertise));
  };

  const handleToggleAssurance = (assurance) => {
    if (selectedAssurances.includes(assurance)) {
      setSelectedAssurances(selectedAssurances.filter(a => a !== assurance));
    } else {
      setSelectedAssurances([...selectedAssurances, assurance]);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      setSaveError(null);
      setSaveSuccess(false);
      
      if (!user || !user.email) {
        throw new Error('❌ Utilisateur non connecté. Veuillez vous reconnecter.');
      }

      // ÉTAPE 1: Mise à jour/Création Professionnel avec display_name
      try {
        const professionnelData = {
          display_name: data.display_name?.trim(),
          nom_complet: data.display_name?.trim(),
          email: user.email,
          photo: data.photo || '',
          specialite: data.specialite,
          ville: data.ville?.trim(),
          region: data.region,
          telephone: data.telephone?.trim(),
          adresse: data.adresse?.trim() || '',
          structure_sante: data.structure_sante?.trim() || '',
          tarif_consultation: data.tarif_consultation ? parseFloat(data.tarif_consultation) : null,
          tarifs_par_type: {
            cabinet: tarifsParType.cabinet ? parseFloat(tarifsParType.cabinet) : null,
            clinique: tarifsParType.clinique ? parseFloat(tarifsParType.clinique) : null,
            hopital: tarifsParType.hopital ? parseFloat(tarifsParType.hopital) : null,
            telephone: tarifsParType.telephone ? parseFloat(tarifsParType.telephone) : null,
            visio: tarifsParType.visio ? parseFloat(tarifsParType.visio) : null,
          },
          biographie: data.biographie?.trim(),
          accepte_cmu: data.accepte_cmu === true,
          certifications: selectedExpertises || [],
          assurances_acceptees: selectedAssurances || [],
          langue_preferee: data.langue_preferee,
          theme_prefere: data.theme_prefere,
          onboarding_completed: true,
        };

        const allProfiles = await base44.entities.Professionnel.list();
        const existing = allProfiles.filter(p => p.email === user.email);

        let savedProfile;

        if (existing.length > 0) {
          savedProfile = await base44.entities.Professionnel.update(existing[0].id, professionnelData);
          
          // Nettoyer doublons
          if (existing.length > 1) {
            for (let i = 1; i < existing.length; i++) {
              await base44.entities.Professionnel.delete(existing[i].id);
            }
          }
        } else {
          savedProfile = await base44.entities.Professionnel.create(professionnelData);
        }
        
        return savedProfile;
        
      } catch (error) {
        let userMessage = '';
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userMessage = '🌐 Erreur de connexion. Vérifiez votre internet.';
        } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
          userMessage = '🔒 Permissions insuffisantes. Reconnectez-vous.';
        } else {
          userMessage = `❌ ${error.message}`;
        }
        
        throw new Error(userMessage);
      }
    },
    onSuccess: async (savedProfile) => {
      setSaveSuccess(true);
      setSaveError(null);
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      
      const isComplete = savedProfile && 
        (savedProfile.display_name?.trim() || savedProfile.nom_complet?.trim()) &&
        savedProfile.specialite?.trim() &&
        savedProfile.region?.trim() &&
        savedProfile.ville?.trim() &&
        savedProfile.telephone?.trim() &&
        savedProfile.biographie?.trim() &&
        savedProfile.biographie.trim().length >= 50;
      
      if (isComplete) {
        alert("✅ Profil professionnel enregistré avec succès !\n\n🎉 Redirection vers la configuration de votre agenda...");
        setTimeout(() => navigate(createPageUrl('ConfigurerAgenda')), 1500);
      } else {
        alert("✅ Profil sauvegardé !\n\n⚠️ Complétez les champs obligatoires pour l'agenda.");
      }
    },
    onError: (error) => {
      setSaveError(error.message);
      setSaveSuccess(false);
      alert(`❌ ${error.message}\n\nVos données sont conservées. Réessayez.`);
    }
  });

  const handleRefreshData = async () => {
    queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    alert('🔄 Données rafraîchies !');
  };

  if (userLoading || loadingPro) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!profilProRaw) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      </AuthGuard>
    );
  }

  const domainesDisponibles = DOMAINES_EXPERTISE[selectedSpecialite || profilProRaw.specialite || ''] || [];

  const typesConsultation = [
    { value: 'cabinet', label: 'Cabinet', icon: '🏥' },
    { value: 'clinique', label: 'Clinique', icon: '🏨' },
    { value: 'hopital', label: 'Hôpital', icon: '🏥' },
    { value: 'telephone', label: 'Téléphone', icon: '📞' },
    { value: 'visio', label: 'Visioconférence', icon: '💻' }
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
                  <Stethoscope className="w-10 h-10 text-teal-600" />
                  Profil Professionnel
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gérez vos informations professionnelles et votre visibilité.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>
          </div>

          {saveSuccess && (
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ Sauvegarde réussie !</strong>
                <p className="mt-1 text-sm">Vos modifications ont été enregistrées avec succès.</p>
              </AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription>
                <strong>❌ Erreur de sauvegarde</strong>
                <p className="mt-2 text-sm">{saveError}</p>
                <p className="mt-2 text-xs">
                  💡 Vos données sont conservées. Vérifiez votre connexion et réessayez.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveError(null)}
                  className="mt-3"
                >
                  Fermer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!profilComplet && !saveError && (
            <Alert className="bg-orange-50 border-orange-300">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>⚠️ Profil incomplet</strong>
                <p className="mt-2 text-sm">Complétez les champs obligatoires :</p>
                <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                  {champsMananquants.map((champ, i) => (
                    <li key={i} className="font-semibold">{champ}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {profilComplet && !saveError && (
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ Profil complet !</strong>
                <p className="mt-1 text-sm">
                  {isDirty ? "Sauvegardez pour débloquer l'agenda." : "Vous pouvez configurer votre agenda."}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))}>
            <Card className="shadow-lg border-none bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil Public
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <div className="relative">
                    {photoValue ? (
                      <img
                        src={photoValue}
                        alt="Photo de profil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full cursor-pointer shadow-lg"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">Photo professionnelle</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name" className="flex items-center gap-2">
                    Nom d'affichage 
                    {!isFieldComplete('display_name') ? (
                      <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </Label>
                  <Input 
                    id="display_name" 
                    {...register("display_name", { 
                      required: "Le nom d'affichage est obligatoire",
                      minLength: { value: 2, message: "Minimum 2 caractères" }
                    })} 
                    placeholder="Comment souhaitez-vous être appelé(e) ?"
                    className={!isFieldComplete('display_name') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Ce nom sera affiché aux patients</p>
                  {errors.display_name && <p className="text-xs text-red-600">{errors.display_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} disabled className="bg-gray-100 dark:bg-gray-800" />
                  <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Informations Professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialite" className="flex items-center gap-2">
                    Spécialité 
                    {!isFieldComplete('specialite') ? (
                      <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </Label>
                  <Controller
                    name="specialite"
                    control={control}
                    rules={{ required: "Veuillez sélectionner votre spécialité" }}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={!isFieldComplete('specialite') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}>
                          <SelectValue placeholder="Sélectionner votre spécialité" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALITES.map(spec => (
                            <SelectItem key={spec.value} value={spec.value}>{spec.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.specialite && <p className="text-xs text-red-600">{errors.specialite.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region" className="flex items-center gap-2">
                      Région 
                      {!isFieldComplete('region') ? (
                        <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </Label>
                    <Controller
                      name="region"
                      control={control}
                      rules={{ required: "La région est obligatoire" }}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className={!isFieldComplete('region') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.region && <p className="text-xs text-red-600">{errors.region.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ville" className="flex items-center gap-2">
                      Ville 
                      {!isFieldComplete('ville') ? (
                        <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </Label>
                    <Input 
                      id="ville" 
                      {...register("ville", { 
                        required: "La ville est obligatoire",
                        minLength: { value: 2, message: "Minimum 2 caractères" }
                      })} 
                      className={!isFieldComplete('ville') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}
                      disabled={isSubmitting}
                    />
                    {errors.ville && <p className="text-xs text-red-600">{errors.ville.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse du cabinet</Label>
                  <Input id="adresse" {...register("adresse")} disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure_sante">Structure de santé</Label>
                  <Input id="structure_sante" {...register("structure_sante")} placeholder="Ex: Clinique La Providence" disabled={isSubmitting} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="flex items-center gap-2">
                      Téléphone professionnel 
                      {!isFieldComplete('telephone') ? (
                        <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </Label>
                    <Input 
                      id="telephone" 
                      type="tel" 
                      {...register("telephone", { 
                        required: "Le téléphone pro est obligatoire",
                        minLength: { value: 8, message: "Minimum 8 chiffres" }
                      })} 
                      className={!isFieldComplete('telephone') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}
                      disabled={isSubmitting}
                      placeholder="Ex: +225 07 XX XX XX XX"
                    />
                    {errors.telephone && <p className="text-xs text-red-600">{errors.telephone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tarif_consultation">Tarif consultation (FCFA)</Label>
                    <Input 
                      id="tarif_consultation" 
                      type="number" 
                      {...register("tarif_consultation")} 
                      disabled={isSubmitting}
                      placeholder="Ex: 15000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biographie" className="flex items-center gap-2">
                    Présentation professionnelle 
                    {!isFieldComplete('biographie') ? (
                      <Badge variant="destructive" className="text-xs">OBLIGATOIRE</Badge>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </Label>
                  <Textarea
                    id="biographie"
                    {...register("biographie", { 
                      required: "La présentation est obligatoire",
                      minLength: { value: 50, message: "Minimum 50 caractères" }
                    })}
                    rows={5}
                    placeholder="Parlez de votre expérience, vos spécialisations, votre approche... (minimum 50 caractères)"
                    className={!isFieldComplete('biographie') ? 'border-orange-400 bg-orange-50' : 'border-green-300'}
                    disabled={isSubmitting}
                  />
                  {errors.biographie && <p className="text-xs text-red-600">{errors.biographie.message}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Visible par les patients</p>
                    <p className={`text-xs font-semibold ${
                      (watchedValues[5]?.length || 0) >= 50 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {watchedValues[5]?.length || 0} / 50
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Domaines d'Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Expertises sélectionnées</Label>
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    {selectedExpertises.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune expertise sélectionnée</p>
                    ) : (
                      selectedExpertises.map((exp) => (
                        <Badge key={exp} className="bg-teal-100 text-teal-800 flex items-center gap-2">
                          {exp}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                            onClick={() => !isSubmitting && handleRemoveExpertise(exp)}
                          />
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ajouter des expertises</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {domainesDisponibles.map((domaine) => (
                      <Button
                        key={domaine}
                        type="button"
                        variant="outline"
                        onClick={() => handleAddExpertise(domaine)}
                        disabled={selectedExpertises.includes(domaine) || isSubmitting}
                        className="justify-start"
                      >
                        {domaine}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Tarifs & Assurances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="accepte_cmu"
                    {...register("accepte_cmu")}
                    className="w-5 h-5"
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="accepte_cmu" className="cursor-pointer font-semibold">
                    J'accepte la CMU (Couverture Maladie Universelle)
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">Tarifs par type de consultation</Label>
                    <Badge variant="outline" className="text-xs">FCFA</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Définissez un tarif spécifique pour chaque type de consultation que vous proposez.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typesConsultation.map((type) => (
                      <div key={type.value} className="space-y-2">
                        <Label htmlFor={`tarif_${type.value}`} className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`tarif_${type.value}`}
                            type="number"
                            value={tarifsParType[type.value]}
                            onChange={(e) => setTarifsParType({
                              ...tarifsParType,
                              [type.value]: e.target.value
                            })}
                            placeholder="Ex: 15000"
                            disabled={isSubmitting}
                            className="pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            FCFA
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900">
                      <strong>💡 Astuce:</strong> Ces tarifs seront affichés aux patients lors de la prise de rendez-vous. 
                      Laissez vide si vous ne proposez pas ce type de consultation.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label>Assurances acceptées</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ASSURANCES.map((assurance) => (
                      <div
                        key={assurance}
                        onClick={() => !isSubmitting && handleToggleAssurance(assurance)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          selectedAssurances.includes(assurance)
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedAssurances.includes(assurance)
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAssurances.includes(assurance) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">{assurance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Préférences
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="langue">Langue</Label>
                  <Controller
                    name="langue_preferee"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="francais">Français</SelectItem>
                          <SelectItem value="anglais">English</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème d'affichage</Label>
                  <Controller
                    name="theme_prefere"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clair">Clair</SelectItem>
                          <SelectItem value="sombre">Sombre</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <NotificationPreferences />

            <Configuration2FA user={user} />

            <MonCodeLiaison />

            <div className="mt-8 flex flex-col md:flex-row justify-end gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-lg py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
              
              {profilComplet && !isDirty && (
                <Button
                  type="button"
                  onClick={() => navigate(createPageUrl('ConfigurerAgenda'))}
                  className="bg-purple-600 hover:bg-purple-700 text-lg py-6"
                >
                  Configurer mon agenda
                  <CheckCircle className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}