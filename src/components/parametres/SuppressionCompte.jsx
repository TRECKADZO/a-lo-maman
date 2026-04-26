import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, TrashIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SuppressionCompte() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [motif, setMotif] = useState('');

  const suppressionMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('supprimerCompte', {
        confirmation,
        motif
      });
    },
    onSuccess: () => {
      alert('Votre compte a été supprimé. Redirection en cours...');
      setTimeout(() => {
        base44.auth.logout();
      }, 2000);
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    }
  });

  return (
    <Card className="border-red-200" id="suppression">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <TrashIcon className="w-5 h-5" />
          Zone Danger - Suppression du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription>
            <p className="font-semibold mb-2">⚠️ Attention</p>
            <p className="text-sm">
              La suppression de votre compte est irréversible. Toutes vos données seront anonymisées ou supprimées selon la réglementation GDPR.
            </p>
          </AlertDescription>
        </Alert>

        <Button
          variant="destructive"
          onClick={() => setShowDialog(true)}
          className="w-full"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          Supprimer mon compte
        </Button>

        {/* Dialog de confirmation */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-600">
                ⚠️ Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Cette action est définitive et irréversible
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">
                  ✓ Vos données seront :
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Anonymisées dans les conversations</li>
                  <li>• Supprimées des dossiers médicaux</li>
                  <li>• Archivées selon la loi (7 ans)</li>
                  <li>• Protégées par chiffrement</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif">
                  Motif de suppression (optionnel)
                </Label>
                <Textarea
                  id="motif"
                  placeholder="Dites-nous pourquoi vous supprimez votre compte..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={3}
                />
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-1">📝 Confirmez en tapant:</p>
                  <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">
                    SUPPRIMER MON COMPTE
                  </code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Taper pour confirmer
                </Label>
                <Input
                  id="confirmation"
                  placeholder="SUPPRIMER MON COMPTE"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className={
                    confirmation === 'SUPPRIMER MON COMPTE'
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => suppressionMutation.mutate()}
                  disabled={
                    confirmation !== 'SUPPRIMER MON COMPTE' ||
                    suppressionMutation.isPending
                  }
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
      </CardContent>
    </Card>
  );
}