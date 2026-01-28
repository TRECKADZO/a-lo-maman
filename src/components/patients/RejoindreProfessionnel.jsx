import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

export default function RejoindreProfessionnel({ onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const rejoindreProMutation = useMutation({
    mutationFn: async (codeLiaison) => {
      const user = await base44.auth.me();
      
      // Trouver le professionnel avec ce code
      const pros = await base44.entities.Professionnel.list();
      const pro = pros.find(p => p.code_liaison === codeLiaison.toUpperCase());
      
      if (!pro) {
        throw new Error('Code invalide');
      }

      // Récupérer le profil maman
      const profils = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      const profil = profils[0];

      // Récupérer ou créer le dossier médical
      let dossiers = await base44.entities.DossierMedicalComplet.filter({ patient_email: user.email });
      let dossier = dossiers[0];

      if (dossier) {
        // Ajouter le professionnel aux autorisations
        const professionnels = dossier.professionnels_autorises || [];
        if (!professionnels.includes(pro.email)) {
          await base44.entities.DossierMedicalComplet.update(dossier.id, {
            professionnels_autorises: [...professionnels, pro.email],
          });
        }
      } else {
        // Créer un nouveau dossier avec le professionnel autorisé
        await base44.entities.DossierMedicalComplet.create({
          patient_email: user.email,
          patient_nom: profil?.display_name || user.full_name || '',
          patient_prenom: '',
          professionnels_autorises: [pro.email],
          consentements_partage: {
            cardiologie: true,
            oncologie: true,
            psychiatrie: true,
            rhumatologie: true,
            medecine_generale: true,
            kinesitherapie: true,
          },
        });
      }

      // Ajouter aux suivis de grossesse si existants
      const grossesses = await base44.entities.SuiviGrossesse.filter({ 
        created_by: user.email,
        statut: 'en_cours'
      });
      
      for (const grossesse of grossesses) {
        const professionnels = grossesse.professionnels_suivi || [];
        if (!professionnels.includes(pro.email)) {
          await base44.entities.SuiviGrossesse.update(grossesse.id, {
            professionnels_suivi: [...professionnels, pro.email],
          });
        }
      }

      // Ajouter aux carnets enfants
      const enfants = await base44.entities.EnfantCarnet.filter({ created_by: user.email });
      
      for (const enfant of enfants) {
        const professionnels = enfant.professionnels_suivi || [];
        if (!professionnels.includes(pro.email)) {
          await base44.entities.EnfantCarnet.update(enfant.id, {
            professionnels_suivi: [...professionnels, pro.email],
          });
        }
      }

      return pro;
    },
    onSuccess: (pro) => {
      setSuccess(true);
      setError('');
      toast.success(`Vous êtes maintenant lié(e) à ${pro.nom_complet}`);
      queryClient.invalidateQueries(['dossier_medical']);
      queryClient.invalidateQueries(['mon_dossier_medical']);
      queryClient.invalidateQueries(['suivi_grossesse']);
      queryClient.invalidateQueries(['enfants']);
      
      setTimeout(() => {
        if (onSuccess) onSuccess(pro);
      }, 2000);
    },
    onError: (err) => {
      setError(err.message === 'Code invalide' ? 'Code invalide. Vérifiez et réessayez.' : 'Une erreur est survenue');
      setSuccess(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!code || code.length < 6) {
      setError('Veuillez entrer un code valide (6 caractères)');
      return;
    }

    rejoindreProMutation.mutate(code);
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-pink-600" />
          Ajouter un Professionnel de Santé
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          Entrez le code de liaison fourni par votre professionnel de santé pour l'ajouter à votre suivi médical.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code de liaison (6 caractères)</Label>
            <Input
              id="code"
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-widest"
              disabled={rejoindreProMutation.isPending || success}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Professionnel ajouté avec succès !
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={rejoindreProMutation.isPending || success}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {rejoindreProMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Ajouté
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter le professionnel
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}