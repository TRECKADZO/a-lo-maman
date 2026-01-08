import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Plus,
  TrendingUp,
  Droplet,
  Heart,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { format, addDays, differenceInDays, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CalendrierCycle from "../components/cycle/CalendrierCycle";
import AjouterCycle from "../components/cycle/AjouterCycle";
import StatistiquesCycle from "../components/cycle/StatistiquesCycle";
import FenetreFertile from "../components/cycle/FenetreFertile";

export default function Cycle() {
  const [showAjouter, setShowAjouter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const profiles = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profiles[0] || null;
    },
  });

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['menstrualCycles'],
    queryFn: async () => {
      const allCycles = await base44.entities.CycleMenstruel.list('-date_debut_regles');
      return allCycles;
    },
    initialData: [],
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const dernierCycle = cycles[0];

  const calculateCycleStats = () => {
    if (cycles.length < 2) return null;

    const durees = cycles
      .filter(c => c.duree_cycle)
      .map(c => c.duree_cycle)
      .slice(0, 6);

    if (durees.length === 0) return null;

    const moyenne = Math.round(durees.reduce((a, b) => a + b, 0) / durees.length);
    const min = Math.min(...durees);
    const max = Math.max(...durees);

    return { moyenne, min, max };
  };

  const stats = calculateCycleStats();

  const calculateFertileWindow = () => {
    if (!dernierCycle) return null;
    
    const cycleStart = new Date(dernierCycle.date_debut_regles);
    const cycleLength = dernierCycle.duree_cycle || stats?.moyenne || 28;
    const ovulationDay = addDays(cycleStart, cycleLength - 14);
    const fertileStart = addDays(ovulationDay, -5);
    const fertileEnd = addDays(ovulationDay, 1);
    const nextPeriod = addDays(cycleStart, cycleLength);
    
    const today = new Date();
    const isInFertileWindow = today >= fertileStart && today <= fertileEnd;
    
    return { 
      fertileStart, 
      fertileEnd, 
      ovulationDay, 
      nextPeriod,
      isInFertileWindow,
      daysUntilOvulation: differenceInDays(ovulationDay, today),
      daysUntilPeriod: differenceInDays(nextPeriod, today)
    };
  };

  const fertileWindow = calculateFertileWindow();

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowAjouter(true)}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg w-full md:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau cycle
          </Button>
        </div>

        {fertileWindow?.isInFertileWindow && (
          <Card className="border-l-4 border-l-purple-500 shadow-xl bg-gradient-to-r from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-900 text-lg mb-2">
                    🌸 Vous êtes en période fertile !
                  </h3>
                  <p className="text-purple-800 mb-3">
                    C'est le moment optimal pour concevoir. Votre ovulation est estimée 
                    au {format(fertileWindow.ovulationDay, "dd MMMM", { locale: fr })}.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div className="bg-white/50 px-4 py-2 rounded-lg">
                      <p className="text-purple-600">Ovulation dans</p>
                      <p className="font-bold text-purple-900">
                        {fertileWindow.daysUntilOvulation} jours
                      </p>
                    </div>
                    <div className="bg-white/50 px-4 py-2 rounded-lg">
                      <p className="text-purple-600">Fin fenêtre fertile</p>
                      <p className="font-bold text-purple-900">
                        {format(fertileWindow.fertileEnd, "dd MMM", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-none bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cycles suivis</p>
                  <p className="text-3xl font-bold text-purple-600">{cycles.length}</p>
                </div>
                <CalendarIcon className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {stats && (
            <>
              <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Durée moyenne</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.moyenne}j</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-pink-50 to-rose-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cycle le plus court</p>
                      <p className="text-3xl font-bold text-pink-600">{stats.min}j</p>
                    </div>
                    <Activity className="w-12 h-12 text-pink-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cycle le plus long</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.max}j</p>
                    </div>
                    <Activity className="w-12 h-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {fertileWindow && !fertileWindow.isInFertileWindow && (
            <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prochaines règles</p>
                    <p className="text-2xl font-bold text-green-600">
                      {fertileWindow.daysUntilPeriod > 0 
                        ? `${fertileWindow.daysUntilPeriod}j`
                        : "Bientôt"}
                    </p>
                  </div>
                  <Droplet className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl">
                {format(selectedMonth, "MMMM yyyy", { locale: fr })}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <CalendrierCycle 
          mois={selectedMonth}
          cycles={cycles}
          fertileWindow={fertileWindow}
        />

        {fertileWindow && (
          <FenetreFertile fertileWindow={fertileWindow} />
        )}

        {cycles.length > 0 && (
          <StatistiquesCycle cycles={cycles} />
        )}

        {cycles.length === 0 && !isLoading && (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun cycle enregistré
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez à suivre votre cycle pour optimiser vos chances de conception
              </p>
              <Button 
                onClick={() => setShowAjouter(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter mon premier cycle
              </Button>
            </CardContent>
          </Card>
        )}

        {showAjouter && (
          <AjouterCycle onClose={() => setShowAjouter(false)} />
        )}
      </div>
    </div>
  );
}