import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Stethoscope, Loader2, User, MapPin, Phone, AlertCircle, CheckCircle, Radio, Building2, FileText, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const SPECIALITES = [
  { value: 'gynecologie', label: 'Gynécologie' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'sage_femme', label: 'Sage-femme' },
  { value: 'medecin_generaliste', label: 'Médecin généraliste' },
  { value: 'nutritionniste', label: 'Nutritionniste' },
  { value: 'infirmier', label: 'Infirmier(ère)' }
];

const regions = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

export default function SelectionCompte() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    telephone: '',
    ville: '',
    region: '',
    specialite: '',
    nom_complet: '',
    biographie: '',
    acceptConditions: false,
    // Centre de santé
    nom_centre: '',
    type_etablissement: 'clinique_privee',
    numero_agrement: '',
    adresse: '',
    email_contact: '',
    administrateur_nom: '',
    administrateur_telephone: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const handleCreateProfile = async () => {
    console.log('🔴 === CRÉATION PROFIL - DÉBUT ===');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        throw new Error('Pas d\'utilisateur connecté');
      }

      if (!formData.acceptConditions) {
        throw new Error('Vous devez accepter les conditions d\'utilisation');
      }

      console.log('👤 User:', user.email);
      console.log('🎯 Type:', selectedType);

      if (selectedType === 'maman') {
        console.log('💗 CRÉATION PROFIL MAMAN');
        
        const mamanData = {
          telephone: formData.telephone || '',
          ville: formData.ville || '',
          region: formData.region || '',
          langue_preferee: 'francais',
          theme_prefere: 'clair',
        };

        console.log('📦 Données:', mamanData);
        const profile = await base44.entities.ProfilMaman.create(mamanData);
        console.log('✅ ProfilMaman créé:', profile.id);
        
        // Invalider le cache et attendre la synchronisation
        queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
        console.log('🔄 Attente de synchronisation (2s)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 Rechargement de la page...');
        window.location.href = createPageUrl('Dashboard');
        
      } else if (selectedType === 'centre_sante') {
        console.log('🏥 CRÉATION PROFIL CENTRE');
        
        // Validation
        if (!formData.nom_centre?.trim()) throw new Error('Nom du centre manquant');
        if (!formData.numero_agrement?.trim()) throw new Error('Numéro d\'agrément manquant');
        if (!formData.region) throw new Error('Région manquante');
        if (!formData.ville?.trim()) throw new Error('Ville manquante');
        if (!formData.adresse?.trim()) throw new Error('Adresse manquante');
        if (!formData.telephone?.trim()) throw new Error('Téléphone manquant');
        if (!formData.administrateur_nom?.trim()) throw new Error('Nom administrateur manquant');
        if (!formData.administrateur_telephone?.trim()) throw new Error('Téléphone administrateur manquant');

        const codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const centreData = {
          nom: formData.nom_centre.trim(),
          type_etablissement: formData.type_etablissement,
          numero_agrement: formData.numero_agrement.trim(),
          region: formData.region,
          ville: formData.ville.trim(),
          adresse: formData.adresse.trim(),
          telephone: formData.telephone.trim(),
          email_contact: formData.email_contact?.trim() || user.email,
          administrateur_nom: formData.administrateur_nom.trim(),
          administrateur_email: user.email,
          administrateur_telephone: formData.administrateur_telephone.trim(),
          administrateurs: [user.email],
          code_invitation: codeInvitation,
          statut_validation: 'en_attente',
          date_demande: new Date().toISOString(),
          onboarding_completed: false
        };

        console.log('📦 Données Centre:', centreData);
        const profile = await base44.entities.Clinique.create(centreData);
        console.log('✅ Centre créé:', profile.id);
        
        // Invalider le cache et attendre
        queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
        console.log('🔄 Attente de synchronisation (2s)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 Rechargement de la page...');
        window.location.href = createPageUrl('Dashboard');
        
      } else {
        console.log('👨‍⚕️ CRÉATION PROFIL PROFESSIONNEL');
        
        // Validation
        if (!formData.specialite) throw new Error('Spécialité manquante');
        if (!formData.nom_complet?.trim() || formData.nom_complet.trim().length < 3) {
          throw new Error('Nom complet invalide (min 3 caractères)');
        }
        if (!formData.telephone?.trim() || formData.telephone.trim().length < 8) {
          throw new Error('Téléphone invalide (min 8 caractères)');
        }
        if (!formData.ville?.trim()) throw new Error('Ville manquante');
        if (!formData.region) throw new Error('Région manquante');
        if (!formData.biographie?.trim() || formData.biographie.trim().length < 50) {
          throw new Error('Biographie trop courte (min 50 caractères)');
        }

        const proData = {
          nom_complet: formData.nom_complet.trim(),
          email: user.email,
          specialite: formData.specialite,
          telephone: formData.telephone.trim(),
          ville: formData.ville.trim(),
          region: formData.region,
          biographie: formData.biographie.trim(),
          langue_preferee: 'francais',
          theme_prefere: 'clair',
          accepte_cmu: true,
          onboarding_completed: false,
        };

        console.log('📦 Données Professionnel:', {
          nom_complet: proData.nom_complet,
          email: proData.email,
          specialite: proData.specialite,
        });
        
        console.log('⏳ Appel API...');
        const profile = await base44.entities.Professionnel.create(proData);
        console.log('✅ Professionnel créé:', profile.id);
        
        // Invalider le cache et attendre la synchronisation
        queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
        console.log('🔄 Attente de synchronisation (2s)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 Rechargement de la page...');
        window.location.href = createPageUrl('Dashboard');
      }
      
    } catch (err) {
      console.error('❌ ERREUR:', err);
      setError(err.message || 'Erreur lors de la création du profil');
      setSuccess(false);
      setLoading(false);
    }
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setShowForm(true);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateProfile();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {!showForm ? (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Bienvenue sur A'lo Maman ! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Bonjour <strong>{user.full_name}</strong>, choisissez votre type de compte :
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-pink-400 group"
                onClick={() => handleSelectType('maman')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Heart className="w-12 h-12 text-white fill-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Je suis une Maman</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Suivi de grossesse, carnets de santé de vos enfants, téléconsultations et communauté
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-gray-500">
                    <p>✓ Gratuit et complet</p>
                    <p>✓ Suivi grossesse personnalisé</p>
                    <p>✓ Carnets de santé numériques</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-teal-400 group"
                onClick={() => handleSelectType('professionnel')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Stethoscope className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Je suis Professionnel</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Gynécologue, pédiatre, sage-femme, médecin ou infirmier(ère)
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-gray-500">
                    <p>✓ Gratuit pour les professionnels</p>
                    <p>✓ Gestion d'agenda en ligne</p>
                    <p>✓ Téléconsultations sécurisées</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-400 group"
                onClick={() => handleSelectType('centre_sante')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Radio className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Centre de Santé</h2>
                    <p className="text-gray-600 leading-relaxed">
                      PMI, clinique, hôpital ou centre offrant des services de maternité
                    </p>
                    <div className="mt-6 space-y-2 text-sm text-gray-500">
                      <p>✓ Gestion des rendez-vous</p>
                      <p>✓ Profil public détaillé</p>
                      <p>✓ Intégration plateforme</p>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="shadow-2xl border-none">
            <CardContent className="p-8">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedType(null);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="mb-4"
                  disabled={loading}
                >
                  ← Retour
                </Button>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                 {selectedType === 'maman' ? (
                   <>
                     <Heart className="w-8 h-8 text-pink-500" />
                     Créer mon compte Maman
                   </>
                 ) : selectedType === 'centre_sante' ? (
                   <>
                     <Radio className="w-8 h-8 text-purple-500" />
                     Créer mon compte Centre de Santé
                   </>
                 ) : (
                   <>
                     <Stethoscope className="w-8 h-8 text-teal-500" />
                     Créer mon compte Professionnel
                   </>
                 )}
                </h2>
                <p className="text-gray-600 mt-2">
                  {selectedType === 'maman' 
                    ? 'Quelques informations pour personnaliser votre expérience'
                    : selectedType === 'centre_sante'
                    ? 'Informations du centre pour créer votre compte'
                    : 'Informations professionnelles obligatoires pour votre profil'}
                </p>
              </div>

              {success && (
                <Alert className="mb-6 bg-green-50 border-green-300">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Profil créé avec succès ! Redirection en cours...
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {selectedType === 'professionnel' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nom_complet" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nom complet *
                      </Label>
                      <Input
                        id="nom_complet"
                        value={formData.nom_complet}
                        onChange={(e) => handleChange('nom_complet', e.target.value)}
                        placeholder="Dr. Jean Kouassi"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialite" className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Spécialité *
                      </Label>
                      <Select
                        value={formData.specialite}
                        onValueChange={(value) => handleChange('specialite', value)}
                        required
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner votre spécialité" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALITES.map(spec => (
                            <SelectItem key={spec.value} value={spec.value}>
                              {spec.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {selectedType === 'centre_sante' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nom_centre" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Nom de l'établissement *
                      </Label>
                      <Input
                        id="nom_centre"
                        value={formData.nom_centre}
                        onChange={(e) => handleChange('nom_centre', e.target.value)}
                        placeholder="CHU Cocody"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type_etablissement">Type d'établissement *</Label>
                      <Select
                        value={formData.type_etablissement}
                        onValueChange={(value) => handleChange('type_etablissement', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinique_privee">Clinique privée</SelectItem>
                          <SelectItem value="hopital_public">Hôpital public</SelectItem>
                          <SelectItem value="centre_sante">Centre de santé</SelectItem>
                          <SelectItem value="maternite">Maternité</SelectItem>
                          <SelectItem value="pmi">PMI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_agrement" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Numéro d'agrément MSP *
                      </Label>
                      <Input
                        id="numero_agrement"
                        value={formData.numero_agrement}
                        onChange={(e) => handleChange('numero_agrement', e.target.value)}
                        placeholder="AGR/MSP/2024/..."
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region_centre" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Région *
                        </Label>
                        <Select
                          value={formData.region}
                          onValueChange={(value) => handleChange('region', value)}
                          disabled={loading}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ville_centre">Ville *</Label>
                        <Input
                          id="ville_centre"
                          value={formData.ville}
                          onChange={(e) => handleChange('ville', e.target.value)}
                          placeholder="Cocody"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adresse">Adresse complète *</Label>
                      <textarea
                        id="adresse"
                        value={formData.adresse}
                        onChange={(e) => handleChange('adresse', e.target.value)}
                        placeholder="II Plateaux, Boulevard Latrille..."
                        rows={2}
                        required
                        disabled={loading}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telephone_centre" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Téléphone du centre *
                        </Label>
                        <Input
                          id="telephone_centre"
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => handleChange('telephone', e.target.value)}
                          placeholder="+225 XX XX XX XX XX"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email_contact" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email de contact
                        </Label>
                        <Input
                          id="email_contact"
                          type="email"
                          value={formData.email_contact}
                          onChange={(e) => handleChange('email_contact', e.target.value)}
                          placeholder={user.email}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Administrateur principal
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="administrateur_nom">Nom complet *</Label>
                          <Input
                            id="administrateur_nom"
                            value={formData.administrateur_nom}
                            onChange={(e) => handleChange('administrateur_nom', e.target.value)}
                            placeholder="Dr. Koffi Kouassi"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="administrateur_telephone">Téléphone *</Label>
                          <Input
                            id="administrateur_telephone"
                            type="tel"
                            value={formData.administrateur_telephone}
                            onChange={(e) => handleChange('administrateur_telephone', e.target.value)}
                            placeholder="+225..."
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg mt-4">
                      <p className="text-xs text-blue-800">
                        ℹ️ Votre demande sera examinée sous 48h. Vous recevrez un email de confirmation.
                      </p>
                    </div>
                  </>
                )}

                {selectedType !== 'centre_sante' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telephone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Téléphone {selectedType === 'professionnel' && '*'}
                        </Label>
                        <Input
                          id="telephone"
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => handleChange('telephone', e.target.value)}
                          placeholder="+225 07 XX XX XX XX"
                          required={selectedType === 'professionnel'}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Région {selectedType === 'professionnel' && '*'}
                        </Label>
                        <Select
                          value={formData.region}
                          onValueChange={(value) => handleChange('region', value)}
                          disabled={loading}
                          required={selectedType === 'professionnel'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ville" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Ville {selectedType === 'professionnel' && '*'}
                      </Label>
                      <Input
                        id="ville"
                        value={formData.ville}
                        onChange={(e) => handleChange('ville', e.target.value)}
                        placeholder="Abidjan"
                        required={selectedType === 'professionnel'}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {selectedType === 'professionnel' && (
                  <div className="space-y-2">
                    <Label htmlFor="biographie">
                      Présentation professionnelle * (minimum 50 caractères)
                    </Label>
                    <textarea
                      id="biographie"
                      value={formData.biographie}
                      onChange={(e) => handleChange('biographie', e.target.value)}
                      placeholder="Décrivez votre expérience, vos spécialisations, votre approche..."
                      rows={4}
                      required
                      disabled={loading}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className={`text-xs ${formData.biographie.length >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                      {formData.biographie.length} / 50 caractères
                    </p>
                  </div>
                )}

                {/* Conditions */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="conditions"
                    checked={formData.acceptConditions}
                    onCheckedChange={(checked) => handleChange('acceptConditions', checked)}
                  />
                  <label htmlFor="conditions" className="text-sm text-gray-700 cursor-pointer">
                    J'accepte les{" "}
                    <a href={createPageUrl('Conditions')} className="text-pink-600 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                      conditions d'utilisation
                    </a>
                    , la{" "}
                    <a href={createPageUrl('Politique')} className="text-pink-600 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                      politique de confidentialité
                    </a>
                    {" "}et les{" "}
                    <a href="https://alomaman.com/security" className="text-pink-600 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                      conditions de sécurité
                    </a>
                    {" "}*
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedType(null);
                      setError(null);
                      setSuccess(false);
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || success || (selectedType === 'centre_sante' && !formData.acceptConditions)}
                    className={`flex-1 ${
                      selectedType === 'maman' ? 'bg-pink-600 hover:bg-pink-700' : 
                      selectedType === 'centre_sante' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Profil créé !
                      </>
                    ) : selectedType === 'centre_sante' ? (
                      'Continuer vers l\'inscription'
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}