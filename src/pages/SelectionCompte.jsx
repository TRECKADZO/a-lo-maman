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
  const [codeInvitation, setCodeInvitation] = useState('');
  const [centreFound, setCentreFound] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Vérifier si l'utilisateur a DÉJÀ un profil (maman, pro, ou centre)
  const { data: existingProfiles } = useQuery({
    queryKey: ['check_existing_profiles', user?.email],
    queryFn: async () => {
      if (!user) return null;

      // Vérifier profil Maman
      const maman = await base44.entities.ProfilMaman.filter({
        created_by: user.email
      }).then(res => res[0] || null);

      // Vérifier profil Professionnel
      const professionnel = await base44.entities.Professionnel.filter({
        email: user.email
      }).then(res => res[0] || null);

      // Vérifier centre de santé
      const centre = await base44.entities.Clinique.filter({
        $or: [
          { administrateurs: { $in: [user.email] } },
          { administrateur_email: user.email }
        ]
      }).then(res => res[0] || null);

      return { maman, professionnel, centre };
    },
    enabled: !!user,
    retry: false,
  });

  // ✅ Si un profil existe déjà, rediriger directement au Dashboard (skip SelectionCompte)
  React.useEffect(() => {
    if (existingProfiles && !userLoading) {
      const hasAnyProfile = existingProfiles.maman || existingProfiles.professionnel || existingProfiles.centre;
      if (hasAnyProfile) {
        navigate(createPageUrl('Dashboard'), { replace: true });
      }
    }
  }, [existingProfiles, userLoading, navigate]);

  const verifierCodeCentre = async () => {
    if (codeInvitation.length < 4) return;
    
    setVerifyingCode(true);
    try {
      const centres = await base44.entities.Clinique.filter({
        code_invitation: codeInvitation.toUpperCase()
      });
      
      if (centres.length === 0) {
        setError('Code invalide ou centre non trouvé');
        setCentreFound(null);
      } else {
        setCentreFound(centres[0]);
        setError(null);
      }
    } catch (err) {
      setError('Erreur lors de la vérification du code');
      setCentreFound(null);
    } finally {
      setVerifyingCode(false);
    }
  };

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
       console.log('🏥 CRÉATION CENTRE DE SANTÉ');
       // Rediriger vers InscriptionClinique
       navigate(createPageUrl('InscriptionClinique'), { replace: true });
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

       // Si code centre fourni, rejoindre automatiquement
       if (centreFound) {
         console.log('🏥 Liaison au centre:', centreFound.nom);
         const membreData = {
           centre_id: centreFound.id,
           centre_nom: centreFound.nom,
           user_email: user.email,
           user_nom: proData.nom_complet,
           role: 'medecin',
           specialite: proData.specialite || '',
           telephone: proData.telephone || '',
           statut: 'actif',
           date_acceptation: new Date().toISOString(),
           permissions: {
             voir_tous_patients: true,
             modifier_patients: true,
             voir_dossiers_medicaux: true,
             creer_ordonnances: true,
             gerer_rdv: true,
             voir_rdv: true
           }
         };
         await base44.entities.MembreCentre.create(membreData);
         console.log('✅ Membre centre créé');
       }

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

  if (!user || !existingProfiles || (existingProfiles.maman || existingProfiles.professionnel || existingProfiles.centre)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 pb-32">
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

              <Button
                variant="outline"
                className="h-auto p-0 border-2 hover:shadow-2xl transition-all duration-300 hover:border-purple-400 group"
                onClick={() => navigate(createPageUrl('InscriptionClinique'))}
              >
                <CardContent className="p-8 text-center w-full">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Building2 className="w-12 h-12 text-white" />
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
              </Button>
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
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                      <Label htmlFor="code_centre" className="text-sm font-semibold text-purple-900 flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4" />
                        Code d'invitation centre (optionnel)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="code_centre"
                          value={codeInvitation}
                          onChange={(e) => setCodeInvitation(e.target.value.toUpperCase())}
                          placeholder="ABCD12"
                          maxLength={6}
                          className="font-mono text-lg tracking-wider"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={verifierCodeCentre}
                          disabled={codeInvitation.length < 4 || verifyingCode || loading}
                          className="px-6"
                        >
                          {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vérifier'}
                        </Button>
                      </div>
                      {centreFound && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-green-900 font-semibold">{centreFound.nom}</p>
                            <p className="text-green-700">{centreFound.ville}, {centreFound.region}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-purple-700 mt-2">
                        💡 Si vous avez un code, vous serez automatiquement lié au centre
                      </p>
                    </div>

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
                     {/* Centre de santé affichera le formulaire depuis InscriptionClinique */}
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                       <p className="text-blue-900">Vous serez redirigé vers le formulaire d'inscription du centre...</p>
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
                    disabled={loading || success}
                    className={`flex-1 ${
                      selectedType === 'maman' ? 'bg-pink-600 hover:bg-pink-700' : 
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