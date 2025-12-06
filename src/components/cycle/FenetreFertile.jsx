import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function FenetreFertile({ fertileWindow }) {
  if (!fertileWindow) {
    return (
      <Card className="shadow-lg border-l-4 border-l-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700">Aucune donnée de cycle</p>
              <p className="text-sm text-gray-500">
                Enregistrez vos cycles pour calculer votre fenêtre fertile
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { fertileStart, fertileEnd, ovulationDay, nextPeriod, isInFertileWindow, daysUntilOvulation, daysUntilPeriod } = fertileWindow;

  return (
    <Card className={`shadow-lg border-l-4 ${isInFertileWindow ? 'border-l-green-500 bg-green-50' : 'border-l-purple-300'}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-purple-900 mb-2">
              {isInFertileWindow ? '🌸 Période Fertile Actuelle' : '📅 Prochaine Période Fertile'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Fenêtre fertile</p>
                <p className="text-sm font-semibold text-gray-800">
                  {format(fertileStart, 'dd MMM', { locale: fr })} - {format(fertileEnd, 'dd MMM', { locale: fr })}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Ovulation estimée</p>
                <p className="text-sm font-semibold text-purple-700">
                  {format(ovulationDay, 'dd MMMM yyyy', { locale: fr })}
                </p>
                {daysUntilOvulation > 0 && (
                  <p className="text-xs text-gray-600 mt-1">Dans {daysUntilOvulation} jour{daysUntilOvulation > 1 ? 's' : ''}</p>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Prochaines règles</p>
                <p className="text-sm font-semibold text-pink-700">
                  {format(nextPeriod, 'dd MMMM yyyy', { locale: fr })}
                </p>
                {daysUntilPeriod > 0 && (
                  <p className="text-xs text-gray-600 mt-1">Dans {daysUntilPeriod} jour{daysUntilPeriod > 1 ? 's' : ''}</p>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Statut</p>
                <Badge className={isInFertileWindow ? 'bg-green-500' : 'bg-gray-400'}>
                  {isInFertileWindow ? 'Fertile maintenant' : 'Hors période fertile'}
                </Badge>
              </div>
            </div>

            {isInFertileWindow && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-sm text-green-900">
                  💡 <strong>Conseil:</strong> C'est le meilleur moment pour concevoir. 
                  Les rapports réguliers pendant cette période augmentent vos chances de grossesse.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}