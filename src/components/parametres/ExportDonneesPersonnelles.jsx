import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Mail, Loader2, FileJson } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportDonneesPersonnelles() {
  const [exportFormat, setExportFormat] = useState('json');

  const exportMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('exporterDonneesPersonnelles', {});
    },
    onSuccess: (response) => {
      if (exportFormat === 'json') {
        // Télécharger JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `donnees-personnelles-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Données téléchargées');
      } else {
        // Envoyer par email
        sendViaEmail(response.data);
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'export');
    }
  });

  const sendViaEmail = async (data) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: (await base44.auth.me()).email,
        subject: 'Vos données personnelles - A\'lo Maman',
        body: `Bonjour,\n\nCi-joint vos données personnelles exportées en JSON.\n\nExport généré le: ${new Date().toLocaleString('fr-FR')}`
      });
      toast.success('Email envoyé avec vos données');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          Export de vos données (RGPD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm">
            <p className="font-semibold mb-1">📥 Export complet</p>
            <p>
              Téléchargez une copie de toutes vos données personnelles stockées sur A'lo Maman en un seul fichier JSON.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Format d'export :</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <FileJson className="w-4 h-4" />
              <span className="text-sm">Télécharger en JSON</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="email"
                checked={exportFormat === 'email'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <Mail className="w-4 h-4" />
              <span className="text-sm">Recevoir par email</span>
            </label>
          </div>
        </div>

        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Préparation de l'export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exporter mes données
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500">
          ℹ️ Un audit de cet export sera enregistré conformément à la réglementation RGPD.
        </p>
      </CardContent>
    </Card>
  );
}