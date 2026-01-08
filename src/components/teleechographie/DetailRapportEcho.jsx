import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, FileText, Image as ImageIcon,
  Download, User, CheckCircle, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DetailRapportEcho({ rdv, centre, onRetour }) {
  const rapport = rdv.rapport_echographie;

  if (!rapport) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <p className="text-gray-600">Rapport non disponible</p>
          <Button onClick={onRetour} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onRetour}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      {/* Header */}
      <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Rapport d'Échographie
              </h2>
              <p className="text-sm text-gray-600">
                {format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Validé
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-semibold">{rdv.type_echographie}</p>
            </div>
            <div>
              <p className="text-gray-600">SA</p>
              <p className="font-semibold">{rdv.semaine_grossesse} semaines</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Centre</p>
              <p className="font-semibold">{centre?.nom_centre}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {rapport.images_urls && rapport.images_urls.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Images échographiques ({rapport.images_urls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {rapport.images_urls.map((url, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                >
                  <img 
                    src={url} 
                    alt={`Échographie ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Image {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biométrie */}
      {rapport.biometrie && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Mesures fœtales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {rapport.biometrie.BIP && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Diamètre bipariétal</p>
                  <p className="text-2xl font-bold text-blue-600">{rapport.biometrie.BIP}</p>
                  <p className="text-xs text-gray-500">mm</p>
                </div>
              )}
              {rapport.biometrie.LF && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Longueur fémorale</p>
                  <p className="text-2xl font-bold text-purple-600">{rapport.biometrie.LF}</p>
                  <p className="text-xs text-gray-500">mm</p>
                </div>
              )}
              {rapport.biometrie.PC && (
                <div className="bg-pink-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Périmètre crânien</p>
                  <p className="text-2xl font-bold text-pink-600">{rapport.biometrie.PC}</p>
                  <p className="text-xs text-gray-500">mm</p>
                </div>
              )}
              {rapport.biometrie.PA && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Périmètre abdominal</p>
                  <p className="text-2xl font-bold text-green-600">{rapport.biometrie.PA}</p>
                  <p className="text-xs text-gray-500">mm</p>
                </div>
              )}
              {rapport.biometrie.EPF && (
                <div className="bg-orange-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-600 mb-1">Poids fœtal estimé</p>
                  <p className="text-2xl font-bold text-orange-600">{rapport.biometrie.EPF}</p>
                  <p className="text-xs text-gray-500">grammes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Âge gestationnel */}
      {rapport.age_gestationnel_calcule && (
        <Card className="shadow-md bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Âge gestationnel calculé</p>
                <p className="text-2xl font-bold text-pink-600">{rapport.age_gestationnel_calcule}</p>
              </div>
              <Calendar className="w-10 h-10 text-pink-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conclusion */}
      {rapport.conclusion && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              Conclusion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{rapport.conclusion}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {rapport.recommendations && (
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{rapport.recommendations}</p>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {rapport.anomalies_detectees && rapport.anomalies_detectees.length > 0 && (
        <Card className="shadow-lg border-2 border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rapport.anomalies_detectees.map((anomalie, idx) => (
                <li key={idx} className="text-sm text-orange-900 flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>{anomalie}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Médecin */}
      {rapport.redige_par && (
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Rédigé par</p>
                <p className="font-semibold text-gray-900">{rapport.redige_par}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Télécharger PDF */}
      {rapport.rapport_pdf_url && (
        <Button
          onClick={() => window.open(rapport.rapport_pdf_url, '_blank')}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600"
        >
          <Download className="w-5 h-5 mr-2" />
          Télécharger le rapport complet (PDF)
        </Button>
      )}
    </div>
  );
}