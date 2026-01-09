import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportDonneesGDPR({ user }) {
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      // Récupérer toutes les données de l'utilisateur
      const [
        profilMaman,
        profilPro,
        grossesses,
        enfants,
        rdvs,
        messages,
        documents,
        notifications
      ] = await Promise.allSettled([
        base44.entities.ProfilMaman.filter({ created_by: user.email }),
        base44.entities.Professionnel.filter({ email: user.email }),
        base44.entities.SuiviGrossesse.filter({ created_by: user.email }),
        base44.entities.EnfantCarnet.filter({ created_by: user.email }),
        base44.entities.RendezVous.filter({ patient_email: user.email }),
        base44.entities.Message.filter({ 
          $or: [
            { sender_email: user.email },
            { receiver_email: user.email }
          ]
        }),
        base44.entities.DocumentMedical.filter({ created_by: user.email }),
        base44.entities.Notification.filter({ user_email: user.email })
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user: {
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_date: user.created_date
        },
        profil_maman: profilMaman.status === 'fulfilled' ? profilMaman.value : [],
        profil_professionnel: profilPro.status === 'fulfilled' ? profilPro.value : [],
        suivis_grossesse: grossesses.status === 'fulfilled' ? grossesses.value : [],
        carnets_enfants: enfants.status === 'fulfilled' ? enfants.value : [],
        rendez_vous: rdvs.status === 'fulfilled' ? rdvs.value : [],
        messages: messages.status === 'fulfilled' ? messages.value : [],
        documents: documents.status === 'fulfilled' ? documents.value : [],
        notifications: notifications.status === 'fulfilled' ? notifications.value : []
      };

      // Télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alo-maman-export-${user.email}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    },
    onSuccess: () => {
      setExportSuccess(true);
      toast.success('Export réussi !');
      setTimeout(() => setExportSuccess(false), 5000);
    },
    onError: () => {
      toast.error('Erreur lors de l\'export');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Export de vos données (RGPD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Conformément au RGPD, vous avez le droit d'obtenir une copie de toutes vos données personnelles. 
            L'export inclut votre profil, consultations, carnets enfants, messages et documents.
          </AlertDescription>
        </Alert>

        {exportSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-800">
              Export téléchargé avec succès ! Le fichier contient toutes vos données au format JSON.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="w-full"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Télécharger mes données
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500">
          Les données exportées sont au format JSON et contiennent l'ensemble de vos informations stockées sur la plateforme.
        </p>
      </CardContent>
    </Card>
  );
}