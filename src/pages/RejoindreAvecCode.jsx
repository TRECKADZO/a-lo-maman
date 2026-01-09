import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

const ROLES_OPTIONS = [
  { value: 'medecin', label: 'Médecin' },
  { value: 'infirmier', label: 'Infirmier(ère)' },
  { value: 'sage_femme', label: 'Sage-femme' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'technicien', label: 'Technicien' }
];

export default function RejoindreAvecCode() {
  const [code, setCode] = useState('');
  const [role, setRole] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [etape, setEtape] = useState(1); // 1: code, 2: infos, 3: confirmation
  const [centreFound, setCentreFound] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnel } = useQuery({
    queryKey: ['professionnel', user?.email],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.filter({ email: user.email });
      return pros[0];
    },
    enabled: !!user,
  });

  const verifierCodeMutation = useMutation({
    mutationFn: async (codeInput) => {
      const centres = await base44.entities.Clinique.filter({
        code_invitation: codeInput.toUpperCase()
      });
      
      if (centres.length === 0) {
        throw new Error('Code invalide ou expiré');
      }

      // Vérifier si déjà membre
      const existingMember = await base44.entities.MembreCentre.filter({
        centre_id: centres[0].id,
        user_email: user.email
      });

      if (existingMember.length > 0) {
        throw new Error('Vous êtes déjà membre de ce centre');
      }

      return centres[0];
    },
    onSuccess: (centre) => {
      setCentreFound(centre);
      setEtape(2);
      toast.success(`Centre trouvé : ${centre.nom}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const rejoindrecentreMutation = useMutation({
    mutationFn: async () => {
      const membreData = {
        centre_id: centreFound.id,
        centre_nom: centreFound.nom,
        user_email: user.email,
        user_nom: professionnel?.nom_complet || user.full_name,
        role: role,
        specialite: specialite || professionnel?.specialite || '',
        telephone: professionnel?.telephone || '',
        statut: 'actif',
        date_acceptation: new Date().toISOString(),
        permissions: getDefaultPermissions(role)
      };

      await base44.entities.MembreCentre.create(membreData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membres_centre']);
      setEtape(3);
      toast.success('Vous avez rejoint le centre avec succès !');
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'adhésion');
    }
  });

  const getDefaultPermissions = (role) => {
    const presets = {
      medecin: {
        voir_tous_patients: true,
        modifier_patients: true,
        voir_dossiers_medicaux: true,
        creer_ordonnances: true,
        gerer_rdv: true,
        voir_rdv: true
      },
      infirmier: {
        voir_tous_patients: true,
        voir_dossiers_medicaux: true,
        voir_rdv: true,
        gerer_stock: true
      },
      sage_femme: {
        voir_tous_patients: true,
        modifier_patients: true,
        voir_dossiers_medicaux: true,
        creer_ordonnances: true,
        gerer_rdv: true,
        voir_rdv: true
      },
      secretaire: {
        voir_tous_patients: true,
        gerer_rdv: true,
        voir_rdv: true,
        gerer_facturation: true
      },
      technicien: {
        voir_rdv: true,
        gerer_stock: true
      }
    };
    return presets[role] || {};
  };

  if (!user || !professionnel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Profil professionnel requis</h2>
            <p className="text-gray-600 mb-4">
              Vous devez avoir un profil professionnel pour rejoindre un centre de santé.
            </p>
            <Button onClick={() => navigate(createPageUrl('SelectionCompte'))}>
              Créer mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Étape 1: Entrer le code */}
        {etape === 1 && (
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-600" />
                Rejoindre un centre de santé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  Entrez le code d'invitation fourni par votre centre de santé pour le rejoindre.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Code d'invitation *</Label>
                <Input
                  placeholder="ABCD12"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-2xl font-mono text-center tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Le code est généralement composé de 6 caractères
                </p>
              </div>

              <Button
                onClick={() => verifierCodeMutation.mutate(code)}
                disabled={code.length < 4 || verifierCodeMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {verifierCodeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Vérifier le code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Informations complémentaires */}
        {etape === 2 && centreFound && (
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Rejoindre {centreFound.nom}
              </CardTitle>
              <p className="text-gray-600">
                {centreFound.ville}, {centreFound.region}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  Centre validé ! Complétez vos informations pour finaliser.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Votre rôle dans le centre *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner votre rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Spécialité (optionnel)</Label>
                <Input
                  placeholder="Ex: Gynécologie, Pédiatrie..."
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                />
                {professionnel?.specialite && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actuelle: {professionnel.specialite}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEtape(1);
                    setCentreFound(null);
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={() => rejoindrecentreMutation.mutate()}
                  disabled={!role || rejoindrecentreMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {rejoindrecentreMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adhésion...
                    </>
                  ) : (
                    'Rejoindre le centre'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Confirmation */}
        {etape === 3 && (
          <Card className="shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Bienvenue dans {centreFound.nom} !</h2>
              <p className="text-gray-600 mb-6">
                Vous avez rejoint le centre avec succès. Redirection vers votre tableau de bord...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}