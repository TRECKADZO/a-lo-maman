import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export default function StatistiquesSommeil({ entries }) {
  if (entries.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucune statistique disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Calculs statistiques
  const moyenneDuree = (entries.reduce((acc, e) => acc + e.duree_heures, 0) / entries.length).toFixed(1);
  const dureeMin = Math.min(...entries.map(e => e.duree_heures));
  const dureeMax = Math.max(...entries.map(e => e.duree_heures));

  const moyenneReveils = (entries.reduce((acc, e) => acc + (e.nombre_reveils || 0), 0) / entries.length).toFixed(1);

  const qualiteDistribution = {
    très_mauvaise: 0,
    mauvaise: 0,
    moyenne: 0,
    bonne: 0,
    excellente: 0
  };
  entries.forEach(e => qualiteDistribution[e.qualite]++);

  const facteursCount = {};
  entries.forEach(e => {
    (e.facteurs_perturbateurs || []).forEach(f => {
      facteursCount[f] = (facteursCount[f] || 0) + 1;
    });
  });
  const topFacteurs = Object.entries(facteursCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const difficulteCount = entries.filter(e => e.difficulte_endormissement).length;
  const siestesCount = entries.filter(e => e.sieste).length;

  const humeurDistribution = {
    fatiguee: 0,
    normale: 0,
    reposee: 0,
    energique: 0
  };
  entries.forEach(e => {
    if (e.humeur_matin) humeurDistribution[e.humeur_matin]++;
  });

  return (
    <div className="space-y-6">
      {/* Durée */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            Durée du sommeil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Moyenne</p>
              <p className="text-3xl font-bold text-indigo-600">{moyenneDuree}h</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Minimum</p>
              <p className="text-3xl font-bold text-blue-600">{dureeMin}h</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Maximum</p>
              <p className="text-3xl font-bold text-purple-600">{dureeMax}h</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            {parseFloat(moyenneDuree) >= 7 && parseFloat(moyenneDuree) <= 9 ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Excellent !</p>
                  <p className="text-sm text-green-800">Votre durée de sommeil est dans la plage recommandée (7-9h)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">À améliorer</p>
                  <p className="text-sm text-amber-800">
                    {parseFloat(moyenneDuree) < 7
                      ? 'Vous dormez moins de 7h en moyenne. Essayez de vous coucher plus tôt.'
                      : 'Vous dormez plus de 9h en moyenne. Consultez un médecin si vous ressentez une fatigue excessive.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Qualité */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            Distribution de la qualité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(qualiteDistribution).map(([qualite, count]) => {
              const pourcentage = ((count / entries.length) * 100).toFixed(0);
              const emojis = {
                très_mauvaise: '😫',
                mauvaise: '😕',
                moyenne: '😐',
                bonne: '😊',
                excellente: '😴'
              };
              
              return (
                <div key={qualite} className="flex items-center gap-3">
                  <span className="text-2xl">{emojis[qualite]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{qualite.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-gray-600">{count} nuits ({pourcentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                        style={{ width: `${pourcentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Facteurs perturbateurs */}
      {topFacteurs.length > 0 && (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Facteurs perturbateurs fréquents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topFacteurs.map(([facteur, count]) => (
                <Badge key={facteur} className="bg-orange-100 text-orange-800">
                  {facteur.replace(/_/g, ' ')} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autres métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Réveils nocturnes (moyenne)</p>
            <p className="text-3xl font-bold text-purple-600">{moyenneReveils}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Difficulté à s'endormir</p>
            <p className="text-3xl font-bold text-red-600">{difficulteCount} nuits</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Siestes</p>
            <p className="text-3xl font-bold text-blue-600">{siestesCount} jours</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Humeur au réveil (dominante)</p>
            <p className="text-2xl font-bold text-green-600">
              {Object.entries(humeurDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}