import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Syringe, Calendar, AlertCircle, CheckCircle, Plus, Baby } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Calendrier vaccinal nourrisson (premiers mois)
const CALENDRIER_VACCINAL_NOURRISSON = [
  { nom: "BCG", age_jours: 0, description: "À la naissance" },
  { nom: "Hépatite B (1ère dose)", age_jours: 0, description: "À la naissance" },
  { nom: "DTC-Polio-Hib (1ère dose)", age_jours: 60, description: "2 mois" },
  { nom: "Pneumocoque (1ère dose)", age_jours: 60, description: "2 mois" },
  { nom: "Rotavirus (1ère dose)", age_jours: 60, description: "2 mois" },
  { nom: "DTC-Polio-Hib (2ème dose)", age_jours: 120, description: "4 mois" },
  { nom: "Pneumocoque (2ème dose)", age_jours: 120, description: "4 mois" },
  { nom: "Rotavirus (2ème dose)", age_jours: 120, description: "4 mois" },
  { nom: "DTC-Polio-Hib (3ème dose)", age_jours: 180, description: "6 mois" },
  { nom: "Hépatite B (2ème dose)", age_jours: 180, description: "6 mois" },
  { nom: "Rougeole (1ère dose)", age_jours: 270, description: "9 mois" },
  { nom: "Fièvre jaune", age_jours: 270, description: "9 mois" }
];

export default function RappelsVaccinsNourrisson({ suivi }) {
  const { data: enfant } = useQuery({
    queryKey: ['enfant_nouveau_ne', suivi.grossesse_id],
    queryFn: async () => {
      const enfants = await base44.entities.EnfantCarnet.filter({ 
        grossesse_id: suivi.grossesse_id 
      });
      return enfants[0];
    },
    enabled: !!suivi.grossesse_id
  });

  if (!enfant) {
    return (
      <Card className="shadow-lg border-none overflow-hidden bg-amber-50">
        <CardContent className="p-6 text-center">
          <Baby className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <p className="text-sm text-amber-900 mb-3">
            Créez d'abord le carnet de santé de votre bébé pour suivre ses vaccinations
          </p>
          <Button asChild size="sm">
            <Link to={createPageUrl('Enfants')}>
              Créer le carnet
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dateNaissance = new Date(enfant.date_naissance);
  const vaccinsRecus = enfant.vaccinations || [];

  const vaccinsAvenir = CALENDRIER_VACCINAL_NOURRISSON.map(vaccin => {
    const datePrevu = addDays(dateNaissance, vaccin.age_jours);
    const estRecu = vaccinsRecus.some(v => 
      v.nom_vaccin.toLowerCase().includes(vaccin.nom.toLowerCase().split(' ')[0])
    );
    const joursRestants = differenceInDays(datePrevu, new Date());
    const estEnRetard = joursRestants < 0 && !estRecu;

    return {
      ...vaccin,
      datePrevu,
      estRecu,
      joursRestants,
      estEnRetard
    };
  });

  const vaccinsEnRetard = vaccinsAvenir.filter(v => v.estEnRetard);
  const prochainsVaccins = vaccinsAvenir.filter(v => !v.estRecu && v.joursRestants >= 0 && v.joursRestants <= 30);

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Syringe className="w-5 h-5 text-green-600" />
            Vaccins {enfant.prenom}
          </h3>
          <Badge className="bg-green-600 text-white">
            {vaccinsRecus.length}/{CALENDRIER_VACCINAL_NOURRISSON.length}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Alertes vaccins en retard */}
          {vaccinsEnRetard.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">
                    {vaccinsEnRetard.length} vaccin(s) en retard
                  </p>
                  {vaccinsEnRetard.map((vaccin, idx) => (
                    <p key={idx} className="text-sm text-red-800">
                      • {vaccin.nom} (prévu le {format(vaccin.datePrevu, 'dd MMM', { locale: fr })})
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prochains vaccins */}
          {prochainsVaccins.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">À venir (30 prochains jours)</p>
              {prochainsVaccins.map((vaccin, idx) => (
                <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-amber-900">{vaccin.nom}</p>
                      <p className="text-xs text-amber-700">
                        {format(vaccin.datePrevu, 'dd MMMM yyyy', { locale: fr })} • {vaccin.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      J+{vaccin.joursRestants}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vaccins reçus récents */}
          {vaccinsRecus.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Vaccins reçus</p>
              {vaccinsRecus.slice(-3).reverse().map((vaccin, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{vaccin.nom_vaccin}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(vaccin.date_vaccination), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link to={createPageUrl('Enfants')}>
              Gérer les vaccinations
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}