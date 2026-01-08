import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Baby,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  Heart,
  ChevronRight,
  Sparkles,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmationDeclaration from './ConfirmationDeclaration';
import ModeHorsLigne, { useOfflineDeclaration } from './ModeHorsLigne';

const REGIONS_CI = [
  "Abidjan",
  "Bas-Sassandra",
  "Comoé",
  "Denguélé",
  "Gôh-Djiboua",
  "Lacs",
  "Lagunes",
  "Montagnes",
  "Sassandra-Marahoué",
  "Savanes",
  "Vallée du Bandama",
  "Woroba",
  "Yamoussoukro",
  "Zanzan"
];

const ETABLISSEMENTS_TYPES = [
  { value: "hopital", label: "CHU / Hôpital" },
  { value: "maternite", label: "Maternité / Clinique" },
  { value: "pmi", label: "Centre PMI" },
  { value: "domicile", label: "À domicile" },
  { value: "autre", label: "Autre" }
];

export default function DeclarationNaissanceForm({ onSuccess, declarationExistante = null }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [declarationId, setDeclarationId] = useState(null);
  const { isOnline, saveDeclaration } = useOfflineDeclaration();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilMaman } = useQuery({
    queryKey: ['profil_maman', user?.email],
    queryFn: async () => {
      const profils = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  const { data: grossesse } = useQuery({
    queryKey: ['derniere_grossesse', user?.email],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter(
        { created_by: user.email },
        '-created_date'
      );
      return grossesses[0] || null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    prenoms_enfant: '',
    nom_famille: profilMaman?.nom_complet?.split(' ').pop() || '',
    sexe: '',
    date_naissance: '',
    heure_naissance: '',
    lieu_naissance: '',
    type_lieu: 'hopital',
    ville: '',
    region: 'Abidjan',
    prenom_pere: '',
    nom_pere: '',
    no_cmu_mere: profilMaman?.no_cmu || '',
    attestation_url: '',
    consentement_transmission: true,
  });

  useEffect(() => {
    if (declarationExistante) {
      setFormData({
        prenoms_enfant: declarationExistante.prenoms_enfant || '',
        nom_famille: declarationExistante.nom_famille || '',
        sexe: declarationExistante.sexe || '',
        date_naissance: declarationExistante.date_naissance || '',
        heure_naissance: declarationExistante.heure_naissance || '',
        lieu_naissance: declarationExistante.lieu_naissance || '',
        type_lieu: declarationExistante.type_lieu || 'hopital',
        ville: declarationExistante.ville || '',
        region: declarationExistante.region || 'Abidjan',
        prenom_pere: declarationExistante.prenom_pere || '',
        nom_pere: declarationExistante.nom_pere || '',
        no_cmu_mere: declarationExistante.no_cmu_mere || '',
        attestation_url: declarationExistante.attestation_url || '',
        consentement_transmission: true,
      });
    } else if (profilMaman) {
      setFormData(prev => ({
        ...prev,
        nom_famille: profilMaman.nom_complet?.split(' ').pop() || '',
        no_cmu_mere: profilMaman.no_cmu || '',
      }));
    }
  }, [declarationExistante, profilMaman]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, attestation_url: file_url }));
      toast.success('Attestation téléchargée');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const creerDeclaration = useMutation({
    mutationFn: async (data) => {
      const numeroSuivi = `DCL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const declaration = await base44.entities.DeclarationNaissance.create({
        ...data,
        numero_suivi: numeroSuivi,
        maman_email: user.email,
        statut: 'soumise',
        date_soumission: new Date().toISOString(),
      });

      // Générer PDF et envoyer notifications
      try {
        await base44.functions.invoke('genererPDFDeclaration', { declarationId: declaration.id });
      } catch (error) {
        console.error('Erreur génération PDF:', error);
      }

      // Créer notification pour la maman
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'systeme',
        titre: '✅ Déclaration de naissance enregistrée',
        message: `Votre déclaration pour ${data.prenoms_enfant} a été enregistrée. Numéro de suivi : ${numeroSuivi}`,
        action_page: 'MesDeclarations',
        priorite: 'haute',
        icone: 'Baby'
      }).catch(() => {});

      return declaration;
    },
    onSuccess: (declaration) => {
      queryClient.invalidateQueries(['declarations_naissance']);
      setDeclarationId(declaration.id);
      setShowConfirmation(true);
      toast.success('Déclaration enregistrée avec succès !');
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    },
  });

  const validerEtape1 = () => {
    if (!formData.prenoms_enfant || !formData.nom_famille || !formData.sexe) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    return true;
  };

  const validerEtape2 = () => {
    if (!formData.date_naissance || !formData.heure_naissance || !formData.lieu_naissance || !formData.ville || !formData.region) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!formData.consentement_transmission) {
      toast.error('Vous devez autoriser la transmission des données');
      return;
    }

    // Mode hors-ligne : sauvegarder localement
    if (!isOnline) {
      try {
        saveDeclaration(formData);
        toast.success('Déclaration sauvegardée. Elle sera envoyée dès la reconnexion.');
        setStep(1);
        setFormData({
          prenoms_enfant: '',
          nom_famille: profilMaman?.nom_complet?.split(' ').pop() || '',
          sexe: '',
          date_naissance: '',
          heure_naissance: '',
          lieu_naissance: '',
          type_lieu: 'hopital',
          ville: '',
          region: 'Abidjan',
          prenom_pere: '',
          nom_pere: '',
          no_cmu_mere: profilMaman?.no_cmu || '',
          attestation_url: '',
          consentement_transmission: true,
        });
      } catch (error) {
        toast.error('Erreur de sauvegarde hors-ligne');
      }
      return;
    }

    creerDeclaration.mutate(formData);
  };

  if (showConfirmation) {
    return (
      <ConfirmationDeclaration
        declarationId={declarationId}
        onCreateCarnet={() => {
          if (onSuccess) onSuccess();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      <ModeHorsLigne />
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Baby className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Déclaration de Naissance
          </h1>
          <p className="text-gray-600 text-sm">
            Déclarez votre bébé en quelques minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex flex-col items-center ${s <= step ? '' : 'opacity-30'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-pink-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                <span className="text-xs mt-1">
                  {s === 1 ? 'Enfant' : s === 2 ? 'Naissance' : 'Révision'}
                </span>
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Info Enfant */}
        {step === 1 && (
          <Card className="shadow-lg border-2 border-pink-100">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-pink-600" />
                Informations de l'enfant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="prenoms">Prénom(s) de l'enfant <span className="text-red-500">*</span></Label>
                <Input
                  id="prenoms"
                  value={formData.prenoms_enfant}
                  onChange={(e) => setFormData({ ...formData, prenoms_enfant: e.target.value })}
                  placeholder="Ex: Jean-Marie"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nom">Nom de famille <span className="text-red-500">*</span></Label>
                <Input
                  id="nom"
                  value={formData.nom_famille}
                  onChange={(e) => setFormData({ ...formData, nom_famille: e.target.value })}
                  placeholder="Nom de famille"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sexe">Sexe <span className="text-red-500">*</span></Label>
                <Select value={formData.sexe} onValueChange={(value) => setFormData({ ...formData, sexe: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="garcon">Garçon</SelectItem>
                    <SelectItem value="fille">Fille</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    if (validerEtape1()) setStep(2);
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 h-12"
                >
                  Continuer
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Info Naissance */}
        {step === 2 && (
          <Card className="shadow-lg border-2 border-pink-100">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-600" />
                Détails de la naissance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date de naissance <span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    className="mt-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="heure">Heure <span className="text-red-500">*</span></Label>
                  <Input
                    id="heure"
                    type="time"
                    value={formData.heure_naissance}
                    onChange={(e) => setFormData({ ...formData, heure_naissance: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type_lieu">Type de lieu <span className="text-red-500">*</span></Label>
                <Select value={formData.type_lieu} onValueChange={(value) => setFormData({ ...formData, type_lieu: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETABLISSEMENTS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lieu">Nom de l'établissement / Adresse <span className="text-red-500">*</span></Label>
                <Input
                  id="lieu"
                  value={formData.lieu_naissance}
                  onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                  placeholder="Ex: CHU de Yopougon"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ville">Ville <span className="text-red-500">*</span></Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Ville"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Région <span className="text-red-500">*</span></Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS_CI.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium text-gray-700">Informations du père (optionnel)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom_pere">Prénom</Label>
                    <Input
                      id="prenom_pere"
                      value={formData.prenom_pere}
                      onChange={(e) => setFormData({ ...formData, prenom_pere: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom_pere">Nom</Label>
                    <Input
                      id="nom_pere"
                      value={formData.nom_pere}
                      onChange={(e) => setFormData({ ...formData, nom_pere: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={() => {
                    if (validerEtape2()) setStep(3);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600"
                >
                  Continuer
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Révision et Soumission */}
        {step === 3 && (
          <Card className="shadow-lg border-2 border-pink-100">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-600" />
                Révision et soumission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enfant</span>
                  <span className="font-semibold">{formData.prenoms_enfant} {formData.nom_famille}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sexe</span>
                  <Badge>{formData.sexe === 'garcon' ? 'Garçon' : 'Fille'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Naissance</span>
                  <span className="font-semibold">
                    {format(new Date(formData.date_naissance), 'dd/MM/yyyy', { locale: fr })} à {formData.heure_naissance}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lieu</span>
                  <span className="font-semibold text-right">{formData.lieu_naissance}, {formData.ville}</span>
                </div>
              </div>

              {/* Upload attestation */}
              <div>
                <Label htmlFor="attestation">Attestation de naissance (optionnel)</Label>
                <div className="mt-2">
                  {formData.attestation_url ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">Attestation téléchargée</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                          <span className="text-sm">Téléchargement...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">Cliquez pour télécharger</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* No CMU */}
              <div>
                <Label htmlFor="no_cmu">Numéro CMU de la mère</Label>
                <Input
                  id="no_cmu"
                  value={formData.no_cmu_mere}
                  onChange={(e) => setFormData({ ...formData, no_cmu_mere: e.target.value })}
                  placeholder="Optionnel"
                  className="mt-1"
                />
              </div>

              {/* Consentement */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Protection des données
                    </p>
                    <p className="text-xs text-blue-700 mb-3">
                      Vos données seront transmises de manière sécurisée à l'état civil pour l'établissement de l'acte de naissance officiel.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="consentement"
                        checked={formData.consentement_transmission}
                        onCheckedChange={(checked) => setFormData({ ...formData, consentement_transmission: checked })}
                      />
                      <Label htmlFor="consentement" className="text-sm text-blue-900 cursor-pointer">
                        J'autorise la transmission sécurisée de ces données
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.consentement_transmission || creerDeclaration.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 h-12"
                >
                  {creerDeclaration.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Soumettre la déclaration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}