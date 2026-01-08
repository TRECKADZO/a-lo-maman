import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, Moon, Star } from 'lucide-react';

export default function GraphiqueSommeil({ entries, periode }) {
  // Préparer les données pour les graphiques
  const chartData = entries
    .slice()
    .reverse()
    .map(entry => {
      const qualiteScores = {
        très_mauvaise: 1,
        mauvaise: 2,
        moyenne: 3,
        bonne: 4,
        excellente: 5
      };

      return {
        date: format(new Date(entry.date), 'dd MMM', { locale: fr }),
        duree: entry.duree_heures,
        qualite: qualiteScores[entry.qualite] || 3,
        reveils: entry.nombre_reveils || 0
      };
    });

  if (entries.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <Moon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée de sommeil enregistrée</p>
          <p className="text-sm text-gray-500 mt-2">Commencez à suivre votre sommeil pour voir les tendances</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique durée */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Évolution de la durée du sommeil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 12]} label={{ value: 'Heures', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="duree"
                name="Durée (h)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Objectif recommandé :</strong> 7-9 heures de sommeil par nuit pour les adultes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Graphique qualité */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Qualité du sommeil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} label={{ value: 'Qualité', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="qualite" name="Qualité" fill="#fbbf24" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            <div>😫<br/>Très mauvaise</div>
            <div>😕<br/>Mauvaise</div>
            <div>😐<br/>Moyenne</div>
            <div>😊<br/>Bonne</div>
            <div>😴<br/>Excellente</div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique réveils */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Réveils nocturnes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reveils" name="Nombre de réveils" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}