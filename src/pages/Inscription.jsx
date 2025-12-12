import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Stethoscope, Heart, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

const specialites = [
  { value: "gynecologie", label: "Gynécologie" },
  { value: "pediatrie", label: "Pédiatrie" },
  { value: "sage_femme", label: "Sage-femme" },
  { value: "medecin_generaliste", label: "Médecin généraliste" },
  { value: "infirmier", label: "Infirmier(ère)" },
  { value: "nutritionniste", label: "Nutritionniste" }
];

const regions = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré", "Bounkani", "Cavally",
  "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo", "Grands-Ponts", "Guémon", "Hambol",
  "Haut-Sassandra", "Iffou", "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua",
  "Marahoué", "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé", "Tchologo",
  "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

export default function Inscription() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Choix type, 1.5: Choix spécialité, 2: Formulaire
  const [typeCompte, setTypeCompte] = useState(null); // 'maman' ou specialite
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données communes
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    acceptConditions: false,
  });

  // Données spécifiques pro
  const [proData, setProData] = useState({
    specialite: "",
    ville: "",
    region: "",
    structure_sante: "",
  });

  const handleChoixType = (type) => {
    setTypeCompte(type);
    if (type !== 'maman') {
      setProData({ ...proData, specialite: type });
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.full_name || formData.full_name.trim() === '') {
      setError("Veuillez entrer votre nom complet");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (!formData.acceptConditions) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    if (typeCompte !== 'maman' && !proData.specialite) {
      setError("Veuillez sélectionner votre spécialité");
      return;
    }

    if (typeCompte !== 'maman' && !proData.region) {
      setError("La région est obligatoire pour les professionnels");
      return;
    }

    if (typeCompte !== 'maman' && !proData.ville) {
      setError("La ville est obligatoire pour les professionnels");
      return;
    }

    setLoading(true);

    try {
      // IMPORTANT: L'inscription via l'API n'est pas encore disponible
      // Cette section est prête pour quand l'API sera disponible

      alert("Pour créer un compte, vous devez être invité par un administrateur. Veuillez contacter l'équipe A'lo Maman via l'email de support.");
      navigate(createPageUrl('Connexion'));

      /* CODE POUR QUAND L'API D'INSCRIPTION SERA DISPONIBLE:
      
      // 1. Créer l'utilisateur
      const user = await base44.auth.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });

      // 2. Créer le UserProfile
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 1);
      
      const profileData = {
        type_compte: typeCompte === 'maman' ? 'maman' : proData.specialite,
        telephone: formData.telephone,
      };

      // Si c'est une maman, ajouter l'essai gratuit
      if (typeCompte === 'maman') {
        profileData.statut_abonnement = 'premium_trial';
        profileData.date_fin_essai = trialEndDate.toISOString().split('T')[0];
      }

      await base44.entities.UserProfile.create(profileData);

      // 3. Si c'est un pro, créer le profil professionnel
      if (typeCompte !== 'maman') {
        await base44.entities.Professionnel.create({
          nom_complet: formData.full_name,
          email: formData.email,
          specialite: proData.specialite,
          telephone: formData.telephone,
          ville: proData.ville,
          region: proData.region,
          structure_sante: proData.structure_sante,
          types_consultation_offerts: ['teleconsultation'],
          accepte_cmu: true,
        });
      }

      // 4. Rediriger vers le dashboard
      navigate(createPageUrl('Dashboard'));
      */

    } catch (err) {
      console.error("Erreur inscription:", err);
      setError(err.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header Mobile */}
      {step > 1 && (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
          <button
            onClick={() => setStep(typeCompte === 'maman' ? 1 : 1.5)}
            className="inline-flex items-center gap-2 text-gray-700 font-medium active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>
      )}

      <div className="flex-1 p-4 pb-8 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          {step === 1 ? (
            // Étape 1: Choix du type de compte
            <Card className="shadow-2xl border-none overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[1.5rem] shadow-xl flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white fill-white" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Bienvenue sur A'lo Maman</CardTitle>
                <p className="text-gray-600 mt-2">Choisissez le type de compte qui vous correspond</p>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 md:p-8">
                <button
                  onClick={() => handleChoixType('maman')}
                  className="group p-6 md:p-8 border-2 border-gray-200 rounded-2xl text-center active:scale-95 hover:border-pink-400 hover:bg-pink-50 transition-all"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Je suis une Maman</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Suivez votre grossesse, la santé de vos enfants et accédez à une communauté de soutien
                  </p>
                  <div className="inline-flex items-center gap-2 text-pink-600 font-semibold">
                    <span>✨ Essai gratuit de 30 jours</span>
                  </div>
                </button>

                <button
                  onClick={() => setStep(1.5)}
                  className="group p-6 md:p-8 border-2 border-gray-200 rounded-2xl text-center active:scale-95 hover:border-teal-400 hover:bg-teal-50 transition-all"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Stethoscope className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Je suis un Professionnel</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Gérez vos patients, votre agenda et développez votre visibilité en ligne
                  </p>
                  <div className="inline-flex items-center gap-2 text-teal-600 font-semibold">
                    <span>🩺 Plateforme dédiée</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          ) : step === 1.5 ? (
            // Étape 1.5: Choix de la spécialité
            <Card className="shadow-2xl border-none">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Quelle est votre spécialité ?</CardTitle>
                <p className="text-gray-600">Sélectionnez votre domaine d'expertise</p>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:p-8">
                {specialites.map((spec) => (
                  <button
                    key={spec.value}
                    onClick={() => handleChoixType(spec.value)}
                    className="p-4 md:p-6 border-2 border-gray-200 rounded-xl text-left active:scale-95 hover:border-teal-400 hover:bg-teal-50 transition-all"
                  >
                    <h4 className="font-semibold text-base md:text-lg text-gray-900">{spec.label}</h4>
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            // Étape 2: Formulaire d'inscription
            <Card className="shadow-2xl border-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    typeCompte === 'maman'
                      ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                      : 'bg-gradient-to-br from-teal-500 to-cyan-600'
                  }`}>
                    {typeCompte === 'maman' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Stethoscope className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Créer mon compte</CardTitle>
                    <p className="text-sm text-gray-600">
                      {typeCompte === 'maman'
                        ? 'Compte Maman'
                        : `Compte Professionnel`
                      }
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Informations de base */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informations personnelles</h3>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Ex: Marie Kouadio"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="marie@exemple.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone *</Label>
                        <Input
                          id="telephone"
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                          placeholder="07 XX XX XX XX"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500">Au moins 6 caractères</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations professionnelles (si pro) */}
                  {typeCompte !== 'maman' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-lg">Informations professionnelles</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="region">Région *</Label>
                          <Select
                            value={proData.region}
                            onValueChange={(value) => setProData({ ...proData, region: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez votre région" />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ville">Ville *</Label>
                          <Input
                            id="ville"
                            value={proData.ville}
                            onChange={(e) => setProData({ ...proData, ville: e.target.value })}
                            placeholder="Ex: Yopougon"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="structure">Structure de santé (optionnel)</Label>
                        <Input
                          id="structure"
                          value={proData.structure_sante}
                          onChange={(e) => setProData({ ...proData, structure_sante: e.target.value })}
                          placeholder="Ex: Clinique Les Anges"
                        />
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="conditions"
                      checked={formData.acceptConditions}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptConditions: checked })}
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

                  {/* Message info */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pour créer un compte, vous devez être invité par un administrateur.
                      Cette fonctionnalité sera bientôt disponible. En attendant, contactez l'équipe A'lo Maman.
                    </AlertDescription>
                  </Alert>

                  {/* Boutons */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(createPageUrl('Connexion'))}
                      className="flex-1"
                    >
                      J'ai déjà un compte
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 w-full h-12 text-base font-semibold shadow-lg active:scale-95 transition-transform ${
                        typeCompte === 'maman'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer mon compte"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}