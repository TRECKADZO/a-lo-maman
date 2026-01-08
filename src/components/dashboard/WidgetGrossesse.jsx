import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Calendar, Activity, ArrowRight } from "lucide-react";
import { format, differenceInWeeks, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WidgetGrossesse({ grossesse, onRemove }) {
  if (!grossesse) return null;

  const semainesGrossesse = differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle));
  const joursRestants = differenceInDays(new Date(grossesse.date_accouchement_prevue), new Date());
  const trimestre = semainesGrossesse < 14 ? 1 : semainesGrossesse < 28 ? 2 : 3;
  const prochaineConsult = grossesse.consultations?.slice(-1)[0];
  const prochaineEcho = grossesse.echographies?.slice(-1)[0];

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-pink-600" />
            Ma Grossesse
          </h3>
          <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            T{trimestre}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Semaine actuelle */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">{semainesGrossesse}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Semaine actuelle</p>
                <p className="text-lg font-bold text-gray-900">{semainesGrossesse} SA</p>
                <p className="text-sm text-gray-600">{joursRestants}j avant la DPA</p>
              </div>
            </div>
          </div>

          {/* DPA */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Date prévue d'accouchement</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(grossesse.date_accouchement_prevue), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Dernière consultation */}
          {prochaineConsult && (
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
              <p className="text-xs font-medium text-teal-800 mb-1">Dernière consultation</p>
              <p className="text-sm text-teal-900">
                SA {prochaineConsult.semaine_grossesse} • {format(new Date(prochaineConsult.date), 'dd MMM', { locale: fr })}
              </p>
              {prochaineConsult.poids && (
                <p className="text-xs text-teal-700 mt-1">Poids: {prochaineConsult.poids} kg</p>
              )}
            </div>
          )}

          {/* Dernière écho */}
          {prochaineEcho && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-xs font-medium text-purple-800 mb-1">Dernière échographie</p>
              <p className="text-sm text-purple-900">
                {prochaineEcho.type} • {format(new Date(prochaineEcho.date), 'dd MMM', { locale: fr })}
              </p>
            </div>
          )}

          <Button asChild className="w-full bg-gradient-to-r from-pink-500 to-rose-600">
            <Link to={createPageUrl('Grossesse')}>
              Voir le suivi complet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}