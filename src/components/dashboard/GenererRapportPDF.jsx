import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { FileText, Download, Loader2, HeartPulse, Baby, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function GenererRapportPDF({ onClose }) {
  const [typeRapport, setTypeRapport] = useState(null);
  const [selectedEnfant, setSelectedEnfant] = useState(null);

  const { data: grossesse } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({ grossesse_active: true });
      return grossesses[0];
    },
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list('-created_date'),
  });

  const genererMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: typeRapport,
        data: typeRapport === 'grossesse' 
          ? { grossesse } 
          : { enfant: enfants.find(e => e.id === selectedEnfant) }
      };

      const response = await base44.functions.invoke('genererRapportPDF', payload);
      return response.data;
    },
    onSuccess: (pdfBlob) => {
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${typeRapport}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Rapport téléchargé avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    }
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Générer un rapport PDF">
      <div className="p-6 space-y-6 pb-32">
        {!typeRapport ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Quel type de rapport souhaitez-vous générer ?</p>

            {grossesse && (
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-pink-200"
                onClick={() => setTypeRapport('grossesse')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center">
                      <HeartPulse className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Rapport de grossesse</h3>
                      <p className="text-sm text-gray-600">
                        Consultations, développement bébé, échographies
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {enfants.length > 0 && (
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-200"
                onClick={() => setTypeRapport('enfant')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                      <Baby className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Carnet de santé</h3>
                      <p className="text-sm text-gray-600">
                        Vaccinations, croissance, consultations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!grossesse && enfants.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune donnée disponible pour générer un rapport</p>
              </div>
            )}
          </div>
        ) : typeRapport === 'grossesse' ? (
          <div className="space-y-4">
            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Rapport de grossesse</h4>
                    <p className="text-sm text-gray-600">
                      Le rapport inclura toutes vos consultations prénatales, mesures de développement du bébé et échographies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setTypeRapport(null)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={() => genererMutation.mutate()}
                disabled={genererMutation.isPending}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {genererMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Sélectionnez l'enfant :</p>

            {enfants.map((enfant) => (
              <Card 
                key={enfant.id}
                className={`cursor-pointer transition-all ${
                  selectedEnfant === enfant.id 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-2 border-gray-200'
                }`}
                onClick={() => setSelectedEnfant(enfant.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{enfant.prenom?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{enfant.prenom}</p>
                      <p className="text-xs text-gray-600">
                        Né(e) le {new Date(enfant.date_naissance).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setTypeRapport(null)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={() => genererMutation.mutate()}
                disabled={!selectedEnfant || genererMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {genererMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}