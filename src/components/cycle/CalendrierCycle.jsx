import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendrierCycle({ mois, cycles, fertileWindow }) {
  const premierJour = startOfMonth(mois);
  const dernierJour = endOfMonth(mois);
  const joursDuMois = eachDayOfInterval({ start: premierJour, end: dernierJour });
  
  const premierJourSemaine = getDay(premierJour);
  const joursVides = Array(premierJourSemaine === 0 ? 6 : premierJourSemaine - 1).fill(null);

  const getJourStatut = (jour) => {
    const aujourdhui = new Date();
    const estAujourdhui = isSameDay(jour, aujourdhui);
    
    // Vérifier si c'est dans la période fertile
    if (fertileWindow) {
      if (isSameDay(jour, fertileWindow.ovulationDay)) {
        return { type: 'ovulation', label: 'Ovulation', color: 'bg-purple-500 text-white' };
      }
      if (jour >= fertileWindow.fertileStart && jour <= fertileWindow.fertileEnd) {
        return { type: 'fertile', label: 'Fertile', color: 'bg-green-500 text-white' };
      }
    }
    
    // Vérifier si c'est un jour de règles
    for (const cycle of cycles) {
      const debutRegles = new Date(cycle.date_debut_regles);
      const finRegles = cycle.date_fin_regles ? new Date(cycle.date_fin_regles) : null;
      
      if (isSameDay(jour, debutRegles)) {
        return { type: 'regles-debut', label: 'Début règles', color: 'bg-red-500 text-white' };
      }
      
      if (finRegles && jour > debutRegles && jour <= finRegles) {
        return { type: 'regles', label: 'Règles', color: 'bg-red-400 text-white' };
      }
    }
    
    return estAujourdhui 
      ? { type: 'aujourd-hui', label: "Aujourd'hui", color: 'bg-blue-100 text-blue-800 border-2 border-blue-500' }
      : { type: 'normal', label: '', color: 'bg-white hover:bg-gray-50' };
  };

  return (
    <Card className="shadow-lg border-none">
      <CardContent className="p-6">
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-gray-800">
            {format(mois, 'MMMM yyyy', { locale: fr })}
          </h3>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour) => (
            <div key={jour} className="text-center text-sm font-semibold text-gray-600 py-2">
              {jour}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {joursVides.map((_, index) => (
            <div key={`vide-${index}`} className="aspect-square" />
          ))}
          
          {joursDuMois.map((jour) => {
            const statut = getJourStatut(jour);
            
            return (
              <div
                key={jour.toString()}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all cursor-pointer ${statut.color}`}
                title={statut.label}
              >
                <span className="text-sm font-medium">
                  {format(jour, 'd')}
                </span>
                {statut.type !== 'normal' && statut.type !== 'aujourd-hui' && (
                  <span className="text-xs mt-1">
                    {statut.type === 'ovulation' ? '🥚' : 
                     statut.type === 'fertile' ? '🌸' : 
                     statut.type === 'regles-debut' || statut.type === 'regles' ? '🩸' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs text-gray-600">Règles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-gray-600">Période fertile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span className="text-xs text-gray-600">Ovulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500" />
            <span className="text-xs text-gray-600">Aujourd'hui</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}