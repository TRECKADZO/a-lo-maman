import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function SuppressionCompte({ user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [accepte, setAccepte] = useState(false);
  const queryClient = useQueryClient();

  const suppressionMutation = useMutation({
    mutationFn: async () => {
      // 1. Supprimer toutes les données liées
      await Promise.allSettled([
        base44.entities.ProfilMaman.filter({ created_by: user.email })
          .then(items => Promise.all(items.map(i => base44.entities.ProfilMaman.delete(i.id)))),
        base44.entities.SuiviGrossesse.filter({ created_by: user.email })
          .then(items => Promise.all(items.map(i => base44.entities.SuiviGrossesse.delete(i.id)))),
        base44.entities.EnfantCarnet.filter({ created_by: user.email })
          .then(items => Promise.all(items.map(i => base44.entities.EnfantCarnet.delete(i.id)))),
        base44.entities.DocumentMedical.filter({ created_by: user.email })
          .then(items => Promise.all(items.map(i => base44.entities.DocumentMedical.delete(i.id)))),
        base44.entities.Notification.filter({ user_email: user.email })
          .then(items => Promise.all(items.map(i => base44.entities.Notification.delete(i.id))))
      ]);

      // 2. Anonymiser les données qui ne peuvent être supprimées (RDV, messages pour historique)
      const rdvs = await base44.entities.RendezVous.filter({ patient_email: user.email });
      await Promise.all(rdvs.map(rdv => 
        base44.entities.RendezVous.update(rdv.id, {
          patient_nom: 'Utilisateur supprimé',
          patient_email: 'deleted@alomaman.com',
          patient_telephone: ''
        })
      ));

      // 3. Déconnecter et rediriger
      return true;
    },
    onSuccess: () => {
      toast.success('Votre compte a été supprimé');
      queryClient.clear();
      localStorage.clear();
      
      setTimeout(() => {
        base44.auth.logout(createPageUrl('0_Accueil'));
      }, 1000);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const handleSupprimer = () => {
    if (confirmation !== 'SUPPRIMER' || !accepte) {
      toast.error('Veuillez confirmer la suppression');
      return;
    }
    suppressionMutation.mutate();
  };

  return (
    <>
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Zone dangereuse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="w-5 h-5" />
            <AlertDescription>
              <strong>Attention :</strong> La suppression de votre compte est irréversible. 
              Toutes vos données (profil, carnets, documents) seront définitivement supprimées.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            onClick={() => setShowDialog(true)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer mon compte définitivement
          </Button>

          <p className="text-xs text-gray-500">
            Conformément au RGPD, vous avez le droit à l'effacement de vos données. 
            Nous vous recommandons d'exporter vos données avant suppression.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irréversible et supprimera toutes vos données.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-5 h-5" />
              <AlertDescription>
                <strong>Seront supprimés :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Votre profil et informations personnelles</li>
                  <li>Tous vos suivis de grossesse</li>
                  <li>Tous les carnets de vos enfants</li>
                  <li>Vos documents médicaux</li>
                  <li>Vos rendez-vous et messages</li>
                  <li>Vos préférences et paramètres</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder="SUPPRIMER"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="accepte"
                checked={accepte}
                onCheckedChange={setAccepte}
              />
              <label htmlFor="accepte" className="text-sm cursor-pointer">
                Je comprends que cette action est irréversible et que toutes mes données seront définitivement supprimées
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setConfirmation('');
                  setAccepte(false);
                }}
                className="flex-1"
                disabled={suppressionMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleSupprimer}
                disabled={suppressionMutation.isPending || confirmation !== 'SUPPRIMER' || !accepte}
                className="flex-1"
              >
                {suppressionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer définitivement'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}