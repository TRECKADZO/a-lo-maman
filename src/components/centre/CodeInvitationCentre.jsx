import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, QrCode, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CodeInvitationCentre({ centre }) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const genererNouveauCode = useMutation({
    mutationFn: async () => {
      const nouveauCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await base44.entities.Clinique.update(centre.id, {
        code_invitation: nouveauCode
      });
      return nouveauCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['centre']);
      toast.success('Nouveau code généré');
    },
    onError: () => {
      toast.error('Erreur lors de la génération');
    }
  });

  const copierCode = () => {
    navigator.clipboard.writeText(centre.code_invitation);
    setCopied(true);
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!centre.code_invitation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">Aucun code d'invitation généré</p>
          <Button
            onClick={() => genererNouveauCode.mutate()}
            disabled={genererNouveauCode.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Générer un code
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5 text-purple-600" />
          Code d'invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Partagez ce code avec vos collègues pour qu'ils rejoignent le centre
          </p>
          <Badge className="text-3xl font-mono px-6 py-3 bg-purple-100 text-purple-900 hover:bg-purple-100">
            {centre.code_invitation}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={copierCode}
            variant="outline"
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier
              </>
            )}
          </Button>
          <Button
            onClick={() => genererNouveauCode.mutate()}
            disabled={genererNouveauCode.isPending}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Nouveau code
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Les professionnels utilisant ce code rejoindront automatiquement votre centre
        </div>
      </CardContent>
    </Card>
  );
}