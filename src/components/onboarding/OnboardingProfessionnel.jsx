import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Loader2,
  Upload,
  X,
  Camera,
  Award,
  FileText,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const REGIONS_CI = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré", 
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo", 
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou", 
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué", 
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé", 
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

const ASSURANCES = [
  "CMU (Couverture Maladie Universelle)",
  "MUGEF-CI",
  "CGRAE",
  "AXA Assurances",
  "NSIA Assurances",
  "Saham Assurance",
  "SUNU Assurances",
  "Allianz",
  "AGF",
  "Aucune assurance"
];

const DOMAINES_EXPERTISE = {
  gynecologie: [
    "Grossesse à risque",
    "Infertilité",
    "Endométriose",
    "Ménopause",
    "Contraception",
    "Cancers gynécologiques"
  ],
  pediatrie: [
    "Néonatologie",
    "Vaccination",
    "Maladies infantiles",
    "Nutrition pédiatrique",
    "Développement de l'enfant",
    "Urgences pédiatriques"
  ],
  sage_femme: [
    "Accouchement naturel",
    "Suivi grossesse",
    "Allaitement",
    "Rééducation périnéale",
    "Préparation à l'accouchement"
  ],
  medecin_generaliste: [
    "Médecine familiale",
    "Maladies chroniques",
    "Santé préventive",
    "Soins primaires"
  ],
  nutritionniste: [
    "Nutrition grossesse",
    "Nutrition infantile",
    "Perte de poids",
    "Diabète",
    "Allergies alimentaires"
  ]
};

export default function OnboardingProfessionnel({ professionnel, onComplete }) {
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    photo: professionnel?.photo || '',
    ville: professionnel?.ville || '',
    region: professionnel?.region || '',
    adresse: professionnel?.adresse || '',
    structure_sante: professionnel?.structure_sante || '',
    telephone: professionnel?.telephone || '',
    tarif_consultation: professionnel?.tarif_consultation || '',
    accepte_cmu: professionnel?.accepte_cmu !== false,
    biographie: professionnel?.biographie || '',
    domaines_expertise: professionnel?.certifications || [],
    assurances_acceptees: [],
  });

  const updateProMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Professionnel.update(professionnel.id, {
        ...data,
        onboarding_completed: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      if (onComplete) onComplete();
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo: file_url });
    } catch (error) {
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddExpertise = (expertise) => {
    if (!formData.domaines_expertise.includes(expertise)) {
      setFormData({
        ...formData,
        domaines_expertise: [...formData.domaines_expertise, expertise]
      });
    }
  };

  const handleRemoveExpertise = (expertise) => {
    setFormData({
      ...formData,
      domaines_expertise: formData.domaines_expertise.filter(e => e !== expertise)
    });
  };

  const handleSubmit = () => {
    updateProMutation.mutate({
      photo: formData.photo,
      ville: formData.ville,
      region: formData.region,
      adresse: formData.adresse,
      structure_sante: formData.structure_sante,
      telephone: formData.telephone,
      tarif_consultation: formData.tarif_consultation ? parseFloat(formData.tarif_consultation) : null,
      accepte_cmu: formData.accepte_cmu,
      biographie: formData.biographie,
      certifications: formData.domaines_expertise,
    });
  };

  const domainesDisponibles = DOMAINES_EXPERTISE[professionnel?.specialite] || [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Progress Bar */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    etape >= step ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {etape > step ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  <span className="text-xs mt-2">
                    {step === 1 && 'Profil'}
                    {step === 2 && 'Localisation'}
                    {step === 3 && 'Expertise'}
                    {step === 4 && 'Tarifs'}
                  </span>
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    etape > step ? 'bg-teal-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: Photo & Bio */}
      {etape === 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-teal-600" />
              Votre Profil Public
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Photo de profil"
                    className="w-32 h-32 rounded-full object-cover"
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
                  className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full cursor-pointer hover:bg-teal-700"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </label>
              </div>
              <p className="text-sm text-gray-600">Photo de profil professionnelle</p>
            </div>

            <div className="space-y-2">
              <Label>Biographie professionnelle *</Label>
              <Textarea
                value={formData.biographie}
                onChange={(e) => setFormData({ ...formData, biographie: e.target.value })}
                rows={6}
                placeholder="Parlez de votre parcours, vos spécialisations, votre approche avec les patients..."
              />
              <p className="text-xs text-gray-500">
                Cette présentation sera visible par vos futurs patients
              </p>
            </div>

            <Button
              onClick={() => setEtape(2)}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!formData.biographie}
            >
              Continuer
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Localisation */}
      {etape === 2 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              Localisation & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Région *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS_CI.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ville *</Label>
                <Input
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Ex: Cocody"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse du cabinet</Label>
              <Input
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Ex: 2 plateaux, Rue des Jardins"
              />
            </div>

            <div className="space-y-2">
              <Label>Structure de santé</Label>
              <Input
                value={formData.structure_sante}
                onChange={(e) => setFormData({ ...formData, structure_sante: e.target.value })}
                placeholder="Ex: Clinique La Providence"
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone professionnel *</Label>
              <Input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+225 XX XX XX XX XX"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setEtape(1)}
                variant="outline"
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={() => setEtape(3)}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                disabled={!formData.region || !formData.ville || !formData.telephone}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Expertise */}
      {etape === 3 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-teal-600" />
              Domaines d'Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                Sélectionnez vos domaines d'expertise pour aider les patients à vous trouver plus facilement.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label>Domaines sélectionnés</Label>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg">
                {formData.domaines_expertise.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun domaine sélectionné</p>
                ) : (
                  formData.domaines_expertise.map((exp) => (
                    <Badge key={exp} className="bg-teal-100 text-teal-800 flex items-center gap-2">
                      {exp}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveExpertise(exp)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Choisir des domaines</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {domainesDisponibles.map((domaine) => (
                  <Button
                    key={domaine}
                    variant="outline"
                    onClick={() => handleAddExpertise(domaine)}
                    disabled={formData.domaines_expertise.includes(domaine)}
                    className="justify-start"
                  >
                    {domaine}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setEtape(2)}
                variant="outline"
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={() => setEtape(4)}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Tarifs */}
      {etape === 4 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-teal-600" />
              Tarifs & Assurances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tarif de consultation (FCFA)</Label>
              <Input
                type="number"
                value={formData.tarif_consultation}
                onChange={(e) => setFormData({ ...formData, tarif_consultation: e.target.value })}
                placeholder="Ex: 15000"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <input
                type="checkbox"
                id="accepte_cmu"
                checked={formData.accepte_cmu}
                onChange={(e) => setFormData({ ...formData, accepte_cmu: e.target.checked })}
                className="w-5 h-5"
              />
              <Label htmlFor="accepte_cmu" className="cursor-pointer">
                J'accepte la CMU (Couverture Maladie Universelle)
              </Label>
            </div>

            <Alert>
              <AlertDescription>
                Les assurances seront affichées sur votre profil pour informer les patients.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => setEtape(3)}
                variant="outline"
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                disabled={updateProMutation.isPending}
              >
                {updateProMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}