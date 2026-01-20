import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Upload, CheckCircle, Loader2, ArrowRight, ArrowLeft, MapPin, Phone, Mail, FileText, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REGIONS = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

const TYPES_ETABLISSEMENT = [
  { value: 'clinique_privee', label: 'Clinique privée' },
  { value: 'hopital_public', label: 'Hôpital public' },
  { value: 'centre_sante', label: 'Centre de santé' },
  { value: 'maternite', label: 'Maternité' },
  { value: 'pmi', label: 'PMI' },
];

const SERVICES = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'accouchement', label: 'Accouchement' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'echographie', label: 'Échographie' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'planification_familiale', label: 'Planification familiale' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'suivi_post_partum', label: 'Suivi post-partum' },
];

export default function InscriptionClinique() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    // Étape 1 - Informations établissement
    nom: '',
    type_etablissement: 'clinique_privee',
    description: '',
    numero_agrement: '',
    
    // Étape 2 - Localisation
    region: '',
    ville: '',
    adresse: '',
    telephone: '',
    email_contact: '',
    
    // Étape 3 - Administrateur
    administrateur_nom: '',
    administrateur_email: '',
    administrateur_telephone: '',
    
    // Étape 4 - Services et capacité
    services_offerts: [],
    capacite_lits: '',
    
    // Étape 5 - Documents
    document_agrement: null,
    document_registre_commerce: null,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_offerts: prev.services_offerts.includes(service)
        ? prev.services_offerts.filter(s => s !== service)
        : [...prev.services_offerts, service]
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 5 MB)');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont acceptés');
      return;
    }

    setUploadingDoc(fieldName);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField(fieldName, file_url);
    } catch (error) {
      alert('Erreur lors de l\'upload du document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const soumettreInscription = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Utilisateur non connecté');

      const codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const demande = {
        nom: formData.nom,
        type_etablissement: formData.type_etablissement,
        description: formData.description,
        numero_agrement: formData.numero_agrement,
        region: formData.region,
        ville: formData.ville,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email_contact: formData.email_contact || user.email,
        administrateur_nom: formData.administrateur_nom,
        administrateur_email: formData.administrateur_email || user.email,
        administrateur_telephone: formData.administrateur_telephone,
        administrateurs: [user.email],
        services_offerts: formData.services_offerts,
        capacite_lits: formData.capacite_lits ? parseInt(formData.capacite_lits) : null,
        document_agrement: formData.document_agrement,
        document_registre_commerce: formData.document_registre_commerce,
        code_invitation: codeInvitation,
        statut_validation: 'approuve',
        actif: true,
        date_demande: new Date().toISOString(),
        onboarding_completed: false
      };

      console.log('🏥 Création centre:', demande);
      const result = await base44.entities.Clinique.create(demande);
      console.log('✅ Centre créé:', result);
      return result;
    },
    onSuccess: (centreCreated) => {
      console.log('🎉 Centre créé avec succès:', centreCreated);
      setEtape(6);
      
      // Force le rechargement complet pour rafraîchir les profils
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 2500);
    },
    onError: (error) => {
      console.error('❌ Erreur création:', error);
      alert('Erreur : ' + error.message);
    }
  });

  const peutContinuerEtape1 = formData.nom?.trim() && formData.type_etablissement && formData.numero_agrement?.trim() && formData.description?.trim();
  const peutContinuerEtape2 = formData.region && formData.ville?.trim() && formData.adresse?.trim() && formData.telephone?.trim();
  const peutContinuerEtape3 = formData.administrateur_nom?.trim() && formData.administrateur_telephone?.trim();
  const peutContinuerEtape4 = formData.services_offerts.length > 0;
  const peutContinuerEtape5 = formData.document_agrement && formData.document_registre_commerce;

  // Étape 6 - Succès
  if (etape === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-2xl border-none">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Centre créé avec succès !</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Votre centre de santé <strong>{formData.nom}</strong> a été créé et est maintenant actif sur la plateforme A'lo Maman.
            </p>
            <div className="p-4 bg-teal-50 rounded-xl mb-6">
              <p className="text-sm text-teal-800 font-medium mb-2">
                🎉 Prochaines étapes :
              </p>
              <ul className="text-sm text-teal-700 space-y-1">
                <li>• Complétez votre profil dans le tableau de bord</li>
                <li>• Configurez vos services et horaires</li>
                <li>• Invitez vos collaborateurs</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Redirection automatique vers votre tableau de bord...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto p-4 py-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Building2 className="w-11 h-11 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Inscription Établissement de Santé
          </h1>
          <p className="text-gray-600 text-lg">
            Rejoignez le réseau A'lo Maman
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4, 5].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    etape >= num 
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {num}
                  </div>
                  <p className={`text-xs mt-2 font-medium hidden md:block ${etape >= num ? 'text-teal-600' : 'text-gray-400'}`}>
                    {num === 1 && 'Établissement'}
                    {num === 2 && 'Localisation'}
                    {num === 3 && 'Administrateur'}
                    {num === 4 && 'Services'}
                    {num === 5 && 'Documents'}
                  </p>
                </div>
                {num < 5 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    etape > num ? 'bg-gradient-to-r from-teal-500 to-cyan-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <Card className="shadow-2xl border-none">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-xl flex items-center gap-3">
              {etape === 1 && <><Building2 className="w-6 h-6 text-teal-600" /> Informations de l'établissement</>}
              {etape === 2 && <><MapPin className="w-6 h-6 text-teal-600" /> Localisation</>}
              {etape === 3 && <><Shield className="w-6 h-6 text-teal-600" /> Administrateur principal</>}
              {etape === 4 && <><FileText className="w-6 h-6 text-teal-600" /> Services et capacité</>}
              {etape === 5 && <><Upload className="w-6 h-6 text-teal-600" /> Documents officiels</>}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Étape 1 - Informations établissement */}
            {etape === 1 && (
              <>
                <div>
                  <Label htmlFor="nom">Nom de l'établissement *</Label>
                  <Input
                    id="nom"
                    placeholder="CHU de Cocody"
                    value={formData.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type d'établissement *</Label>
                  <Select value={formData.type_etablissement} onValueChange={(v) => updateField('type_etablissement', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_ETABLISSEMENT.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description de votre établissement *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre établissement, vos valeurs, vos spécialités..."
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cette description sera visible par les utilisateurs de la plateforme
                  </p>
                </div>

                <div>
                  <Label htmlFor="agrement">Numéro d'agrément MSP *</Label>
                  <Input
                    id="agrement"
                    placeholder="AGR/MSP/2024/..."
                    value={formData.numero_agrement}
                    onChange={(e) => updateField('numero_agrement', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numéro officiel d'agrément du Ministère de la Santé Publique
                  </p>
                </div>

                <Button 
                  onClick={() => setEtape(2)}
                  disabled={!peutContinuerEtape1}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                >
                  Continuer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {/* Étape 2 - Localisation */}
            {etape === 2 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Région *</Label>
                    <Select value={formData.region} onValueChange={(v) => updateField('region', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ville">Ville *</Label>
                    <Input
                      id="ville"
                      placeholder="Cocody"
                      value={formData.ville}
                      onChange={(e) => updateField('ville', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse complète *</Label>
                  <Textarea
                    id="adresse"
                    placeholder="II Plateaux, Boulevard Latrille, face à la pharmacie..."
                    value={formData.adresse}
                    onChange={(e) => updateField('adresse', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">Téléphone principal *</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      value={formData.telephone}
                      onChange={(e) => updateField('telephone', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email de contact *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@clinique.ci"
                      value={formData.email_contact}
                      onChange={(e) => updateField('email_contact', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setEtape(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={() => setEtape(3)}
                    disabled={!peutContinuerEtape2}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* Étape 3 - Administrateur */}
            {etape === 3 && (
              <>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <Shield className="w-4 h-4 inline mr-2" />
                    L'administrateur principal aura tous les droits de gestion du centre
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin_nom">Nom complet *</Label>
                  <Input
                    id="admin_nom"
                    placeholder="Dr. Koffi Kouassi"
                    value={formData.administrateur_nom}
                    onChange={(e) => updateField('administrateur_nom', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="admin_email">Email professionnel</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder={user?.email || "admin@clinique.ci"}
                    value={formData.administrateur_email || user?.email}
                    onChange={(e) => updateField('administrateur_email', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Par défaut : {user?.email}
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin_tel">Téléphone *</Label>
                  <Input
                    id="admin_tel"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={formData.administrateur_telephone}
                    onChange={(e) => updateField('administrateur_telephone', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setEtape(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={() => setEtape(4)}
                    disabled={!peutContinuerEtape3}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* Étape 4 - Services */}
            {etape === 4 && (
              <>
                <div>
                  <Label className="mb-3 block">Services offerts * (sélectionnez au moins 1)</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {SERVICES.map(service => (
                      <div 
                        key={service.value}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleService(service.value)}
                      >
                        <Checkbox
                          checked={formData.services_offerts.includes(service.value)}
                          onCheckedChange={() => toggleService(service.value)}
                        />
                        <Label className="cursor-pointer text-sm flex-1">
                          {service.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="lits">Capacité d'accueil (nombre de lits)</Label>
                  <Input
                    id="lits"
                    type="number"
                    placeholder="50"
                    value={formData.capacite_lits}
                    onChange={(e) => updateField('capacite_lits', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optionnel - utile pour l'orientation des patients</p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setEtape(3)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={() => setEtape(5)}
                    disabled={!peutContinuerEtape4}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* Étape 5 - Documents */}
            {etape === 5 && (
              <>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-900 font-medium mb-2">
                    📋 Documents requis pour validation
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 ml-4">
                    <li>• Agrément MSP en cours de validité</li>
                    <li>• Registre de commerce ou équivalent administratif</li>
                    <li>• Format PDF uniquement (max 5 MB par fichier)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  {/* Document 1 */}
                  <div>
                    <Label>Agrément MSP (PDF) *</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 transition-colors">
                      {formData.document_agrement ? (
                        <div className="flex items-center justify-center gap-3 text-green-700">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium">Document uploadé ✓</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateField('document_agrement', null)}
                          >
                            Remplacer
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-3">
                            {uploadingDoc === 'document_agrement' ? 'Upload en cours...' : 'Cliquez pour uploader votre agrément MSP'}
                          </p>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, 'document_agrement')}
                            disabled={uploadingDoc === 'document_agrement'}
                            className="max-w-xs mx-auto"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Document 2 */}
                  <div>
                    <Label>Registre de commerce (PDF) *</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 transition-colors">
                      {formData.document_registre_commerce ? (
                        <div className="flex items-center justify-center gap-3 text-green-700">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium">Document uploadé ✓</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateField('document_registre_commerce', null)}
                          >
                            Remplacer
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-3">
                            {uploadingDoc === 'document_registre_commerce' ? 'Upload en cours...' : 'Cliquez pour uploader votre registre'}
                          </p>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, 'document_registre_commerce')}
                            disabled={uploadingDoc === 'document_registre_commerce'}
                            className="max-w-xs mx-auto"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setEtape(4)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={() => soumettreInscription.mutate()}
                    disabled={!peutContinuerEtape5 || soumettreInscription.isPending}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600"
                  >
                    {soumettreInscription.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Soumettre la demande
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Aide */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Besoin d'aide ?</p>
              <p className="text-blue-700">
                Contactez-nous à <strong>support@alomaman.ci</strong> ou appelez le <strong>+225 07 XX XX XX XX</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}