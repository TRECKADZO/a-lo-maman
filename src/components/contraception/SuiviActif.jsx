
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  Edit,
  TrendingUp,
  CalendarClock,
  Bell
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function SuiviActif({ suivi, onEdit }) {
  const aujourd_hui = new Date();
  const date_debut = new Date(suivi.date_debut);
  const date_fin = suivi.date_fin ? new Date(suivi.date_fin) : null;
  const jours_depuis_debut = differenceInDays(aujourd_hui, date_debut);
  const jours_restants = date_fin ? differenceInDays(date_fin, aujourd_hui) : null;
  
  const date_rappel = suivi.date_rappel_renouvellement ? new Date(suivi.date_rappel_renouvellement) : null;
  const jours_avant_rappel = date_rappel ? differenceInDays(date_rappel, aujourd_hui) : null;

  const derniere_prise = suivi.prises?.[suivi.prises.length - 1];
  const prises_reussies = suivi.prises?.filter(p => p.prise).length || 0;
  const taux_observance = suivi.prises?.length 
    ? Math.round((prises_reussies / suivi.prises.length) * 100) 
    : 100;

  return (
    <Card className="border-l-4 border-l-rose-500 shadow-xl bg-gradient-to-br from-white to-rose-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2 text-rose-700">
              <CheckCircle className="w-7 h-7" />
              Suivi Actif
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Depuis le {format(date_debut, "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-500">Active</Badge>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rappel de renouvellement */}
        {jours_avant_rappel !== null && jours_avant_rappel <= 30 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Rappel de renouvellement
                </h3>
                <p className="text-sm text-yellow-800">
                  Votre renouvellement est prévu pour le {format(date_rappel, "dd MMMM yyyy", { locale: fr })}.
                  {jours_avant_rappel > 0 ? ` (dans ${jours_avant_rappel} jours)` : " (Ce rappel est passé)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border border-rose-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              <span className="text-sm text-gray-600">Durée du suivi</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {jours_depuis_debut} jours
            </p>
          </div>

          {date_fin && jours_restants !== null && jours_restants >= 0 && (
             <div className="p-4 bg-white rounded-lg border border-teal-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarClock className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-600">Jours restants</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {jours_restants}
              </p>
              <p className="text-xs text-gray-500">
                Fin le {format(date_fin, "dd MMM yyyy", { locale: fr })}
              </p>
            </div>
          )}

          {suivi.heure_prise && (
            <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Heure habituelle</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {suivi.heure_prise}
              </p>
            </div>
          )}

          <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Observance</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {taux_observance}%
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Prises réussies: {prises_reussies} / {suivi.prises?.length || 0}
            </span>
            <span className="text-sm text-gray-600">
              {taux_observance}%
            </span>
          </div>
          <Progress value={taux_observance} className="h-2" />
        </div>

        {/* Dernière prise */}
        {derniere_prise && (
          <div className="p-4 bg-white rounded-lg border border-blue-100">
            <h3 className="font-semibold mb-2 text-blue-900">Dernière prise</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {format(new Date(derniere_prise.date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
                {derniere_prise.retard_minutes > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Retard: {derniere_prise.retard_minutes} minutes
                  </p>
                )}
              </div>
              {derniere_prise.prise ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        )}

        {/* Effets secondaires récents */}
        {suivi.effets_secondaires && suivi.effets_secondaires.length > 0 && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Effets secondaires notés
            </h3>
            <div className="space-y-2">
              {suivi.effets_secondaires.slice(-3).map((effet, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{effet.type}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={
                        effet.severite === 'leger' ? 'border-green-300 text-green-700' :
                        effet.severite === 'modere' ? 'border-orange-300 text-orange-700' :
                        'border-red-300 text-red-700'
                      }
                    >
                      {effet.severite}
                    </Badge>
                    <span className="text-gray-500">
                      {format(new Date(effet.date), 'dd MMM', { locale: fr })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmer la prise d'aujourd'hui
          </Button>
          <Button variant="outline" className="flex-1">
            <AlertCircle className="w-4 h-4 mr-2" />
            Signaler un effet secondaire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
