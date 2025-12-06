import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Baby, TrendingUp, Syringe, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VueEnfantResume({ enfant }) {
  const calculateAge = (dateNaissance) => {
    const mois = differenceInMonths(new Date(), new Date(dateNaissance));
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return moisRestants > 0 ? `${annees} ans ${moisRestants} mois` : `${annees} ans`;
  };

  const ageEnMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));
  
  // Analyser les vaccins
  const vaccins = enfant.vaccins || [];
  const vaccinsAJour = vaccins.filter(v => !v.prochain_rappel || new Date(v.prochain_rappel) > new Date()).length;
  const vaccinsEnRetard = vaccins.filter(v => v.prochain_rappel && new Date(v.prochain_rappel) < new Date());
  const prochainVaccin = vaccins
    .filter(v => v.prochain_rappel && new Date(v.prochain_rappel) > new Date())
    .sort((a, b) => new Date(a.prochain_rappel) - new Date(b.prochain_rappel))[0];

  // Analyser la croissance
  const derniereMesure = (enfant.mesures_croissance || []).slice(-1)[0];
  
  // Analyser les jalons
  const jalons = enfant.jalons_developpement || [];
  const jalonsAtteints = jalons.filter(j => j.atteint).length;
  const jalonsEnRetard = jalons.filter(j => !j.atteint && j.age_attendu_mois && ageEnMois > j.age_attendu_mois + 2).length;
  const pourcentageJalons = jalons.length > 0 ? Math.round((jalonsAtteints / jalons.length) * 100) : 0;

  // Déterminer l'état général
  const aDesAlertes = vaccinsEnRetard.length > 0 || jalonsEnRetard > 0;

  return (
    <Card className={`hover:shadow-xl transition-all ${aDesAlertes ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-green-500'}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              {enfant.photo ? (
                <img src={enfant.photo} alt={enfant.prenom} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Baby className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{enfant.prenom} {enfant.nom}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {calculateAge(enfant.date_naissance)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {enfant.sexe}
                </Badge>
              </div>
            </div>
          </div>
          {aDesAlertes ? (
            <AlertCircle className="w-6 h-6 text-orange-500" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Alertes */}
        {vaccinsEnRetard.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">
                {vaccinsEnRetard.length} vaccin{vaccinsEnRetard.length > 1 ? 's' : ''} en retard
              </span>
            </div>
            <p className="text-xs text-red-700">{vaccinsEnRetard[0]?.nom_vaccin}</p>
          </div>
        )}

        {jalonsEnRetard > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-900">
                {jalonsEnRetard} jalon{jalonsEnRetard > 1 ? 's' : ''} en retard
              </span>
            </div>
          </div>
        )}

        {/* Indicateurs */}
        <div className="grid grid-cols-3 gap-2">
          {/* Vaccins */}
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <Syringe className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Vaccins</p>
            <p className="text-lg font-bold text-blue-600">{vaccinsAJour}/{vaccins.length}</p>
          </div>

          {/* Croissance */}
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Poids</p>
            <p className="text-lg font-bold text-green-600">
              {derniereMesure?.poids ? `${derniereMesure.poids}kg` : '-'}
            </p>
          </div>

          {/* Jalons */}
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <Activity className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Jalons</p>
            <p className="text-lg font-bold text-purple-600">{pourcentageJalons}%</p>
          </div>
        </div>

        {/* Prochain événement */}
        {prochainVaccin && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-1">Prochain vaccin</p>
            <p className="text-sm text-blue-800">{prochainVaccin.nom_vaccin}</p>
            <p className="text-xs text-blue-600">
              {format(new Date(prochainVaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        )}

        {/* Allergies */}
        {enfant.allergies && enfant.allergies.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Allergies</p>
            <p className="text-xs text-red-800">{enfant.allergies.join(', ')}</p>
          </div>
        )}

        <Button className="w-full" variant="outline" size="sm" asChild>
          <Link to={createPageUrl('Enfants')}>
            Voir le carnet complet
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}