import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Briefcase,
  Phone,
  Building2,
  Sparkles
} from 'lucide-react';

export default function GuideDisponibilites() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Guide de configuration des disponibilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Configurez correctement vos disponibilités pour que les patients puissent prendre rendez-vous facilement. 
            Suivez ce guide pour éviter les erreurs courantes.
          </p>
        </CardContent>
      </Card>

      {/* Principe de fonctionnement */}
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5 text-blue-600" />
            Comment ça fonctionne ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Vous configurez vos disponibilités</p>
                <p className="text-sm text-gray-600">
                  Définissez vos jours de travail, horaires et types de consultation acceptés (Cabinet, Téléphone, etc.)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Les patients voient vos créneaux</p>
                <p className="text-sm text-gray-600">
                  Quand un patient cherche un spécialiste, il voit UNIQUEMENT les jours où vous avez des disponibilités pour le type de consultation qu'il a choisi
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Réservation automatique</p>
                <p className="text-sm text-gray-600">
                  Le patient sélectionne un créneau disponible et vous recevez une notification avec les détails du rendez-vous
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur courante */}
      <Card className="shadow-lg border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Problème courant : Jours invisibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Problème :</strong> "J'ai configuré mes disponibilités du mardi, mais les patients ne peuvent pas prendre rendez-vous ce jour-là !"
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="font-semibold text-gray-900 mb-3">Cause principale :</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="destructive" className="mt-1">❌</Badge>
                <div>
                  <p className="font-medium text-gray-900">Mardi configuré pour "Téléphone" uniquement</p>
                  <p className="text-sm text-gray-600">
                    Si vous avez sélectionné uniquement "Téléphone" pour le mardi, les patients qui cherchent un rendez-vous en "Cabinet" ne verront PAS le mardi dans les dates disponibles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">✅</Badge>
                <div>
                  <p className="font-medium text-gray-900">Solution : Ajouter tous les types acceptés</p>
                  <p className="text-sm text-gray-600">
                    Sélectionnez TOUS les types de consultation que vous acceptez ce jour-là : Cabinet, Téléphone, Clinique, etc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemple pratique */}
      <Card className="shadow-lg border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-700">
            <CheckCircle className="w-5 h-5" />
            ✅ Exemple : Configuration correcte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-green-900 mb-3">Scénario : Vous travaillez du lundi au vendredi</p>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Lundi, Mercredi, Vendredi</span>
                  <Badge className="bg-blue-600">08:00 - 17:00</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50 border-blue-200">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Cabinet
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 border-purple-200">
                    <Building2 className="w-3 h-3 mr-1" />
                    Clinique
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 border-green-200">
                    <Phone className="w-3 h-3 mr-1" />
                    Téléphone
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Les patients peuvent réserver pour Cabinet, Clinique OU Téléphone
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Mardi, Jeudi</span>
                  <Badge className="bg-purple-600">09:00 - 13:00</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-50 border-green-200">
                    <Phone className="w-3 h-3 mr-1" />
                    Téléphone uniquement
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ⚠️ Les patients ne verront le mardi/jeudi QUE s'ils choisissent "Téléphone"
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Résultat :</strong> Patient qui cherche un RDV en "Cabinet" verra Lundi, Mercredi, Vendredi. 
              Patient qui cherche en "Téléphone" verra tous les jours !
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cas d'usage spéciaux */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Cas d'usage spéciaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-900 mb-2">
                💡 Accepter TOUS les types pour un créneau
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Si vous voulez que les patients puissent réserver pour N'IMPORTE QUEL type de consultation, ne sélectionnez AUCUN type spécifique.
              </p>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Samedi</span>
                  <Badge>08:00 - 12:00</Badge>
                </div>
                <Badge variant="outline" className="mt-2">Tous types acceptés</Badge>
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Visible pour Cabinet, Téléphone, Clinique, Hôpital
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">
                📱 Consultations téléphoniques uniquement
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Parfait pour les créneaux où vous êtes en déplacement ou à distance.
              </p>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Jeudi soir</span>
                  <Badge>18:00 - 20:00</Badge>
                </div>
                <Badge variant="outline" className="bg-green-50 border-green-200 mt-2">
                  <Phone className="w-3 h-3 mr-1" />
                  Téléphone uniquement
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Visible UNIQUEMENT pour les consultations téléphoniques
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900 mb-2">
                🏥 Jours différents selon le lieu
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Vous pouvez avoir des horaires différents pour votre cabinet et la clinique.
              </p>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Lundi</span>
                    <Badge>08:00 - 12:00</Badge>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Cabinet
                  </Badge>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Lundi</span>
                    <Badge>14:00 - 18:00</Badge>
                  </div>
                  <Badge variant="outline" className="bg-purple-50">
                    <Building2 className="w-3 h-3 mr-1" />
                    Clinique
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de vérification */}
      <Card className="shadow-lg border-l-4 border-l-teal-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-teal-700">
            <CheckCircle className="w-5 h-5" />
            ✅ Checklist avant de sauvegarder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-900">Jours de la semaine configurés</p>
                <p className="text-sm text-teal-700">Ai-je configuré TOUS mes jours de travail ?</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-900">Horaires corrects</p>
                <p className="text-sm text-teal-700">Les heures de début et fin sont-elles correctes ?</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-900">Types de consultation sélectionnés</p>
                <p className="text-sm text-teal-700">Ai-je bien coché TOUS les types que j'accepte pour chaque créneau ?</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-900">Vérification visuelle</p>
                <p className="text-sm text-teal-700">Dans la "Vue Calendrier", est-ce que tous mes jours apparaissent correctement ?</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rappel important */}
      <Alert className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <Info className="w-4 h-4 text-teal-600" />
        <AlertDescription className="text-teal-800">
          <strong className="block mb-2">💡 Rappel important</strong>
          <div className="space-y-1 text-sm">
            <p>• Les patients voient SEULEMENT les jours correspondant au type de consultation qu'ils choisissent</p>
            <p>• Si un jour n'apparaît pas, vérifiez les types de consultation sélectionnés pour ce jour</p>
            <p>• Vous pouvez modifier chaque créneau indépendamment après création</p>
            <p>• Les rendez-vous déjà pris n'apparaîtront plus dans les créneaux disponibles</p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}