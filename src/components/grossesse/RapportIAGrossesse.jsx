import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Sparkles, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RapportIAGrossesse({ grossesse, profilMaman, userEmail }) {
  const queryClient = useQueryClient();
  const [generatingReport, setGeneratingReport] = useState(false);

  const { data: rapports = [], isLoading: raportsLoading } = useQuery({
    queryKey: ['rapports_ia_grossesse', grossesse?.id],
    queryFn: async () => {
      if (!grossesse?.id) return [];
      // Utiliser une entité personnalisée pour les rapports
      return [];
    },
    enabled: !!grossesse?.id
  });

  const genererRapportMutation = useMutation({
    mutationFn: async () => {
      setGeneratingReport(true);
      try {
        const [consultations, symptomes, mouvements, enfants] = await Promise.all([
          base44.entities.SuiviGrossesse.filter({ id: grossesse.id }),
          base44.entities.SuiviGrossesse.filter({ id: grossesse.id }),
          base44.entities.SuiviGrossesse.filter({ id: grossesse.id }),
          base44.entities.EnfantCarnet.filter({ created_by: userEmail })
        ]);

        const prompt = `Tu es une sage-femme expérimentée. Génère un RÉSUMÉ COMPLET ET DÉTAILLÉ d'une grossesse en cours pour présentation à la maman.

DONNÉES GROSSESSE:
${JSON.stringify(grossesse, null, 2)}

CONSULTATIONS:
${JSON.stringify(consultations[0]?.consultations?.slice(-5) || [], null, 2)}

SYMPTÔMES:
${JSON.stringify(symptomes[0]?.symptomes_journal?.slice(-10) || [], null, 2)}

MOUVEMENTS BÉBÉ:
${JSON.stringify(mouvements[0]?.mouvements_bebe?.slice(-5) || [], null, 2)}

Crée un document markdown professionnel mais bienveillant avec:
1. Résumé du mois/trimestre
2. Progression du développement fœtal
3. État général de la maman
4. Événements marquants
5. Recommandations prioritaires
6. Prochaines étapes importantes

IMPORTANT: Sois positif, encourageant et informatif.`;

        const reportText = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });

        // Télécharger le rapport en PDF
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text("Rapport IA - Suivi de Grossesse", 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Généré: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 30);
        doc.text(`Semaine: ${grossesse.semaine_grossesse || '?'}/40`, 20, 38);

        let y = 50;
        const pageHeight = doc.internal.pageSize.height;
        const lines = doc.splitTextToSize(reportText, 170);

        lines.forEach(line => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 7;
        });

        // Sauvegarder
        const filename = `rapport-grossesse-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(filename);

        return {
          date: new Date().toISOString(),
          contenu: reportText,
          filename
        };
      } finally {
        setGeneratingReport(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapports_ia_grossesse'] });
    }
  });

  return (
    <Card className="shadow-lg border-none bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Rapport IA Périodique
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Résumé complet généré par l'IA de votre suivi de grossesse</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rapports.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rapports.map((rapport, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(rapport.date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-xs text-gray-600">Rapport généré</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(new Blob([rapport.contenu]));
                      link.download = rapport.filename || 'rapport.txt';
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => genererRapportMutation.mutate()}
          disabled={genererRapportMutation.isPending || generatingReport}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {generatingReport || genererRapportMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours... (1-2 min)
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer mon rapport IA
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600">
          💡 Un rapport complet avec analyse IA de votre progression, conseils personnalisés et recommandations
        </p>
      </CardContent>
    </Card>
  );
}