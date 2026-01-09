import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, User, Settings, Camera, Upload, X, Droplet, AlertTriangle, Pill, CheckCircle, AlertCircle, Trash2, ExternalLink, Download, FileText, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import EncryptionSetup from '@/components/security/EncryptionSetup';
import GestionConsentements from '@/components/security/GestionConsentements';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';
import CalendarSyncSettings from '@/components/teleconsultation/CalendarSyncSettings';

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const regions = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

export default function Parametres() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [allergies, setAllergies] = useState([]);
  const [nouvelleAllergie, setNouvelleAllergie] = useState('');
  const [maladiesChroniques, setMaladiesChroniques] = useState([]);
  const [nouvelleMaladie, setNouvelleMaladie] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportingFHIR, setExportingFHIR] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };

      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.filter({ email: user.email }).catch(() => [])
      ]);

      return {
        maman: mamanProfiles[0] || null,
        pro: proProfiles[0] || null
      };
    },
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0,
  });

  const profilMaman = profiles?.maman;
  const profilPro = profiles?.pro;

  React.useEffect(() => {
    if (profilPro && !profileLoading) {
      navigate(createPageUrl('ProfilProfessionnel'), { replace: true });
    }
  }, [profilPro, profileLoading, navigate]);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { isSubmitting, errors, isDirty } } = useForm({
    mode: 'onChange',
    defaultValues: {
      display_name: '',
      email: '',
      telephone: '',
      langue_preferee: 'francais',
      theme_prefere: 'clair',
      photo_profil: '',
      date_naissance: '',
      numero_cmu: '',
      groupe_sanguin: '',
      ville: '',
      region: '',
      situation_familiale: '',
    }
  });

  const photoValue = watch('photo_profil');
  const displayNameValue = watch('display_name');
  const telephoneValue = watch('telephone');

  const isFieldValid = (fieldName, value, minLength = 0) => {
    if (!value) return false;
    const stringValue = String(value).trim();
    return stringValue.length >= minLength;
  };

  useEffect(() => {
    if (user && profilMaman) {
      reset({
        display_name: profilMaman.display_name || user.full_name || '',
        email: user.email || '',
        telephone: profilMaman.telephone || '',
        langue_preferee: profilMaman.langue_preferee || 'francais',
        theme_prefere: profilMaman.theme_prefere || 'clair',
        photo_profil: profilMaman.photo_profil || '',
        date_naissance: profilMaman.date_naissance || '',
        numero_cmu: profilMaman.numero_cmu || '',
        groupe_sanguin: profilMaman.groupe_sanguin || '',
        ville: profilMaman.ville || '',
        region: profilMaman.region || '',
        situation_familiale: profilMaman.situation_familiale || '',
      });

      setAllergies(profilMaman.allergies || []);
      setMaladiesChroniques(profilMaman.maladies_chroniques || []);
    }
  }, [user, profilMaman, reset]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setValue('photo_profil', file_url);
    } catch (error) {
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const ajouterAllergie = () => {
    if (nouvelleAllergie.trim() && !allergies.includes(nouvelleAllergie.trim())) {
      setAllergies([...allergies, nouvelleAllergie.trim()]);
      setNouvelleAllergie('');
    }
  };

  const supprimerAllergie = (allergie) => {
    setAllergies(allergies.filter(a => a !== allergie));
  };

  const ajouterMaladie = () => {
    if (nouvelleMaladie.trim() && !maladiesChroniques.includes(nouvelleMaladie.trim())) {
      setMaladiesChroniques([...maladiesChroniques, nouvelleMaladie.trim()]);
      setNouvelleMaladie('');
    }
  };

  const supprimerMaladie = (maladie) => {
    setMaladiesChroniques(maladiesChroniques.filter(m => m !== maladie));
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔄 Mise à jour profil maman...');
      setSaveError(null);
      setSaveSuccess(false);

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mise à jour ou création ProfilMaman avec display_name
      const mamanData = {
        display_name: data.display_name,
        telephone: data.telephone,
        langue_preferee: data.langue_preferee,
        theme_prefere: data.theme_prefere,
        photo_profil: data.photo_profil,
        date_naissance: data.date_naissance,
        numero_cmu: data.numero_cmu,
        groupe_sanguin: data.groupe_sanguin,
        ville: data.ville,
        region: data.region,
        situation_familiale: data.situation_familiale,
        allergies: allergies,
        maladies_chroniques: maladiesChroniques,
      };

      if (profilMaman) {
        await base44.entities.ProfilMaman.update(profilMaman.id, mamanData);
      } else {
        await base44.entities.ProfilMaman.create(mamanData);
      }

      console.log('✅ Profil maman sauvegardé');
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] }); // Invalidate the combined profiles query
      queryClient.invalidateQueries({ queryKey: ['profilMaman'] }); // Keep existing for robustness if other parts depend on it
      alert("✅ Profil mis à jour avec succès !");
    },
    onError: (error) => {
      console.error('❌ Erreur:', error);
      setSaveError(error.message || 'Erreur lors de la sauvegarde');
      alert(`❌ ${error.message || "Une erreur est survenue"}\n\nVos données sont conservées. Réessayez.`);
    }
  });

  const handleExportPDF = async () => {
    try {
      setExportingFHIR(true);
      
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Récupérer les données
      const [grossesses, enfants, rendezVous, documents] = await Promise.all([
        base44.entities.SuiviGrossesse.filter({ created_by: user.email }).catch(() => []),
        base44.entities.EnfantCarnet.filter({ created_by: user.email }).catch(() => []),
        base44.entities.RendezVous.filter({ created_by: user.email }).catch(() => []),
        base44.entities.DocumentMedical.filter({ created_by: user.email }).catch(() => [])
      ]);

      let y = 20;
      
      // Titre
      doc.setFontSize(20);
      doc.text("A'lo Maman - Export de mes données", 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, y);
      y += 15;
      
      // Profil
      doc.setFontSize(16);
      doc.text('Profil', 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(`Nom: ${profilMaman?.display_name || user?.full_name || 'N/A'}`, 25, y);
      y += 6;
      doc.text(`Email: ${user?.email || 'N/A'}`, 25, y);
      y += 6;
      doc.text(`Téléphone: ${profilMaman?.telephone || 'N/A'}`, 25, y);
      y += 6;
      doc.text(`Groupe sanguin: ${profilMaman?.groupe_sanguin || 'N/A'}`, 25, y);
      y += 10;
      
      // Allergies
      if (profilMaman?.allergies?.length > 0) {
        doc.setFontSize(14);
        doc.text('Allergies', 20, y);
        y += 6;
        doc.setFontSize(10);
        profilMaman.allergies.forEach(a => {
          doc.text(`• ${a}`, 25, y);
          y += 5;
        });
        y += 5;
      }
      
      // Grossesses
      if (grossesses.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Grossesses', 20, y);
        y += 8;
        grossesses.forEach((g, i) => {
          doc.setFontSize(11);
          doc.text(`Grossesse #${i+1}`, 25, y);
          y += 6;
          doc.setFontSize(10);
          doc.text(`DPA: ${g.date_accouchement_prevue || 'N/A'}`, 30, y);
          y += 5;
          doc.text(`Type: ${g.type_grossesse || 'N/A'}`, 30, y);
          y += 8;
        });
      }
      
      // Enfants
      if (enfants.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Enfants', 20, y);
        y += 8;
        enfants.forEach((e, i) => {
          doc.setFontSize(11);
          doc.text(`${e.nom_complet}`, 25, y);
          y += 6;
          doc.setFontSize(10);
          doc.text(`Né(e) le: ${e.date_naissance}`, 30, y);
          y += 5;
          doc.text(`Sexe: ${e.sexe}`, 30, y);
          y += 8;
        });
      }
      
      // Rendez-vous
      if (rendezVous.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text(`Rendez-vous (${rendezVous.length})`, 20, y);
        y += 8;
        rendezVous.slice(0, 10).forEach((r) => {
          doc.setFontSize(10);
          doc.text(`${r.date_rdv} - ${r.type_consultation || 'Consultation'}`, 25, y);
          y += 5;
        });
      }
      
      // Sauvegarder
      doc.save(`donnees-alomaman-${Date.now()}.pdf`);
      alert('✅ Export PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      setExportingFHIR(false);
    }
  };

  const handleRequestDataEmail = () => {
    const subject = 'Demande d\'export de mes données';
    const body = `Bonjour,\n\nJe souhaite recevoir un export complet de toutes mes données personnelles stockées sur A'lo Maman.\n\nEmail du compte : ${user?.email}\n\nMerci.`;
    window.open(`mailto:minagepi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  if (userLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-600">Chargement de vos paramètres...</p>
      </div>
    );
  }

  if (profilPro) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!profilMaman) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-600">Initialisation de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
            <Settings className="w-10 h-10 text-gray-500" />
            Paramètres
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les informations de votre compte et vos préférences.
          </p>
        </div>

        {saveSuccess && (
          <Alert className="bg-green-50 border-green-300">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>✅ Sauvegarde réussie !</strong>
              <p className="mt-1 text-sm">Vos modifications ont été enregistrées.</p>
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive" className="shadow-lg">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>
              <strong>❌ Erreur de sauvegarde</strong>
              <p className="mt-2 text-sm">{saveError}</p>
              <p className="mt-2 text-xs">Vos données sont conservées. Réessayez.</p>
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
                      className="w-32 h-32 rounded-full object-cover border-4 border-pink-100"
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
                    className="absolute bottom-0 right-0 bg-pink-600 hover:bg-pink-700 text-white p-2 rounded-full cursor-pointer shadow-lg"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </label>
                </div>
                <p className="text-sm text-gray-600">Photo de profil</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="flex items-center gap-2">
                  Nom d'affichage
                  {!isFieldValid('display_name', displayNameValue, 2) ? (
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
                  placeholder="Comment souhaitez-vous être appelée ?"
                  className={!isFieldValid('display_name', displayNameValue, 2) ? 'border-orange-400 bg-orange-50' : 'border-green-300'}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">Ce nom sera affiché dans l'application</p>
                {errors.display_name && <p className="text-xs text-red-600">{errors.display_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} disabled className="bg-gray-100 dark:bg-gray-800" />
                <p className="text-xs text-gray-500 dark:text-gray-400">L'email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="flex items-center gap-2">
                  Numéro de téléphone
                  {telephoneValue && isFieldValid('telephone', telephoneValue, 8) && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </Label>
                <Input
                  id="telephone"
                  type="tel"
                  {...register("telephone", {
                    minLength: { value: 8, message: "Minimum 8 chiffres" }
                  })}
                  className={telephoneValue && !isFieldValid('telephone', telephoneValue, 8) ? 'border-orange-400 bg-orange-50' : (telephoneValue ? 'border-green-300' : '')}
                  disabled={isSubmitting}
                  placeholder="+225 07 XX XX XX XX"
                />
                {errors.telephone && <p className="text-xs text-red-600">{errors.telephone.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="w-5 h-5" />
                Informations Médicales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    {...register("date_naissance")}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_cmu">Numéro CMU</Label>
                  <Input
                    id="numero_cmu"
                    {...register("numero_cmu")}
                    placeholder="Votre numéro CMU"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupe_sanguin">Groupe sanguin</Label>
                <Controller
                  name="groupe_sanguin"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {GROUPES_SANGUINS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Controller
                    name="region"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          {regions.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input id="ville" {...register("ville")} disabled={isSubmitting} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="situation_familiale">Situation familiale</Label>
                <Controller
                  name="situation_familiale"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="mariee">Mariée</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mes allergies</Label>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-red-50">
                  {allergies.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune allergie déclarée</p>
                  ) : (
                    allergies.map((allergie) => (
                      <Badge key={allergie} className="bg-red-100 text-red-800 flex items-center gap-2">
                        {allergie}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => supprimerAllergie(allergie)}
                        />
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une allergie (ex: Pénicilline, Arachides...)"
                  value={nouvelleAllergie}
                  onChange={(e) => setNouvelleAllergie(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterAllergie())}
                  disabled={isSubmitting}
                />
                <Button type="button" onClick={ajouterAllergie} variant="outline" disabled={isSubmitting}>
                  Ajouter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-orange-600" />
                Maladies Chroniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mes conditions médicales</Label>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-orange-50">
                  {maladiesChroniques.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune maladie chronique déclarée</p>
                  ) : (
                    maladiesChroniques.map((maladie) => (
                      <Badge key={maladie} className="bg-orange-100 text-orange-800 flex items-center gap-2">
                        {maladie}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-orange-600"
                          onClick={() => supprimerMaladie(maladie)}
                        />
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une condition (ex: Diabète, Asthme...)"
                  value={nouvelleMaladie}
                  onChange={(e) => setNouvelleMaladie(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMaladie())}
                  disabled={isSubmitting}
                />
                <Button type="button" onClick={ajouterMaladie} variant="outline" disabled={isSubmitting}>
                  Ajouter
                </Button>
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

          <PushNotificationManager />

          <NotificationPreferences />

          <CalendarSyncSettings />

          <EncryptionSetup />

          <GestionConsentements user={user} />

          <ExportDonneesGDPR user={user} />

          {/* Section Gestion des données */}
          <Card className="shadow-lg border-none bg-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="w-5 h-5" />
                Gestion des données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Exporter mes données</h3>
                    <p className="text-sm text-blue-800">
                      Téléchargez une copie de toutes vos données
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start border-blue-300 hover:bg-blue-100"
                    onClick={handleExportPDF}
                    disabled={exportingFHIR}
                  >
                    {exportingFHIR ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Export PDF
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRequestDataEmail}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Demander par email
                  </Button>
                </div>
              </div>

              <Alert className="bg-gray-50 border-gray-200">
                <AlertDescription className="text-sm text-gray-700">
                  <strong>Format PDF :</strong> Document lisible contenant votre profil, grossesses, enfants et rendez-vous.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <SuppressionCompte user={user} />

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}