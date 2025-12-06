import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

export default function StatistiquesCycle({ stats, cycles }) {
  if (!stats) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center text-gray-500">
          Enregistrez au moins 2 cycles pour voir les statistiques
        </CardContent>
      </Card>
    );
  }

  const symptomesFrequents = () => {
    const compteur = {};
    cycles.forEach(cycle => {
      cycle.symptomes?.forEach(symptome => {
        compteur[symptome] = (compteur[symptome] || 0) + 1;
      });
    });
    
    return Object.entries(compteur)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const douleurMoyenne = () => {
    const douleurs = cycles
      .filter(c => c.douleur_niveau !== undefined)
      .map(c => c.douleur_niveau);
    
    if (douleurs.length === 0) return null;
    return (douleurs.reduce((a, b) => a + b, 0) / douleurs.length).toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="w-5 h-5" />
            Durée du cycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Moyenne</span>
              <span className="text-2xl font-bold text-purple-600">{stats.moyenne} jours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plus court</span>
              <span className="text-lg font-semibold text-blue-600">{stats.min} jours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plus long</span>
              <span className="text-lg font-semibold text-pink-600">{stats.max} jours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-700">
            <Activity className="w-5 h-5" />
            Symptômes & Douleur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {douleurMoyenne() !== null && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Douleur moyenne</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-red-500 h-3 rounded-full"
                      style={{ width: `${(douleurMoyenne() / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-800">{douleurMoyenne()}/10</span>
                </div>
              </div>
            )}

            {symptomesFrequents().length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Symptômes fréquents</p>
                <div className="space-y-2">
                  {symptomesFrequents().map(([symptome, count]) => (
                    <div key={symptome} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{symptome}</span>
                      <span className="text-purple-600 font-medium">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}