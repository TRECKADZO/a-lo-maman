import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, FileText, Calendar, Users } from 'lucide-react';

export default function AffichageRapportEchographie({ grossesseId, mamanEmail }) {
  const [selectedRapport, setSelectedRapport] = useState(null);

  const { data: rapports, isLoading } = useQuery({
    queryKey: ['rapports_echo', grossesseId, mamanEmail],
    queryFn: async () => {
      const rdvs = await base44.entities.RDVTeleEchographie.filter({
        grossesse_id: grossesseId,
        maman_email: mamanEmail,
        statut: 'termine'
      });
      return rdvs.filter(rdv => rdv.rapport_echographie?.rapport_pdf_url);
    },
  });

  const handleDownload = async (rapport) => {
    if (rapport.rapport_pdf_url) {
      window.open(rapport.rapport_pdf_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!rapports?.length) {
    return (
      <Card className="shadow-lg border-none bg-gray-50">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun rapport d'échographie disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rapports.map((rdv) => (
        <Card key={rdv.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {rdv.type_echographie?.replace(/_/g, ' ')}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Terminé</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Biométrie */}
            {rdv.rapport_echographie?.biometrie && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Biométrie</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rdv.rapport_echographie.biometrie.BIP && (
                    <div>
                      <p className="text-xs text-blue-700">Diamètre BIP</p>
                      <p className="font-semibold">{rdv.rapport_echographie.biometrie.BIP} mm</p>
                    </div>
                  )}
                  {rdv.rapport_echographie.biometrie.PC && (
                    <div>
                      <p className="text-xs text-blue-700">Périmètre crânien</p>
                      <p className="font-semibold">{rdv.rapport_echographie.biometrie.PC} mm</p>
                    </div>
                  )}
                  {rdv.rapport_echographie.biometrie.LF && (
                    <div>
                      <p className="text-xs text-blue-700">Longueur fémorale</p>
                      <p className="font-semibold">{rdv.rapport_echographie.biometrie.LF} mm</p>
                    </div>
                  )}
                  {rdv.rapport_echographie.biometrie.PA && (
                    <div>
                      <p className="text-xs text-blue-700">Périmètre abdominal</p>
                      <p className="font-semibold">{rdv.rapport_echographie.biometrie.PA} mm</p>
                    </div>
                  )}
                  {rdv.rapport_echographie.biometrie.EPF && (
                    <div>
                      <p className="text-xs text-blue-700">Poids estimé</p>
                      <p className="font-semibold">{rdv.rapport_echographie.biometrie.EPF} g</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conclusion */}
            {rdv.rapport_echographie?.conclusion && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Conclusion</h4>
                <p className="text-green-800 text-sm leading-relaxed">
                  {rdv.rapport_echographie.conclusion}
                </p>
              </div>
            )}

            {/* Anomalies détectées */}
            {rdv.rapport_echographie?.anomalies_detectees?.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Observations</h4>
                <ul className="space-y-1">
                  {rdv.rapport_echographie.anomalies_detectees.map((anomalie, idx) => (
                    <li key={idx} className="text-yellow-800 text-sm">• {anomalie}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Médecin */}
            {rdv.rapport_echographie?.redige_par && (
              <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4" />
                <span>Rapport rédigé par: {rdv.rapport_echographie.redige_par}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => setSelectedRapport(rdv)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Détails complets
              </Button>
              <Button
                onClick={() => handleDownload(rdv)}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal détails */}
      {selectedRapport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Rapport complet d'échographie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recommandations</h4>
                <p className="text-gray-700">{selectedRapport.rapport_echographie?.recommendations}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedRapport(null)} variant="outline" className="flex-1">
                  Fermer
                </Button>
                <Button onClick={() => handleDownload(selectedRapport)} className="flex-1 bg-pink-600">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}