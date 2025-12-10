import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Heart, Activity, Baby } from 'lucide-react';

/**
 * Graphiques interactifs pour suivi de grossesse
 * - Poids
 * - Tension artérielle
 * - Mouvements bébé
 */

export default function GraphiquesInteractifs({ grossesse }) {
  // Préparer données poids
  const poidsData = (grossesse.consultations || [])
    .filter(c => c.poids)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      poids: c.poids,
      semaine: c.semaine_amenorrhee
    }));

  // Préparer données tension
  const tensionData = (grossesse.consultations || [])
    .filter(c => c.tension_arterielle)
    .map(c => {
      const [systolique, diastolique] = c.tension_arterielle.split('/').map(Number);
      return {
        date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        systolique,
        diastolique,
        semaine: c.semaine_amenorrhee
      };
    });

  // Préparer données mouvements bébé
  const mouvementsData = (grossesse.journal_grossesse || [])
    .filter(j => j.mouvements_bebe !== undefined)
    .map(j => ({
      date: new Date(j.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      mouvements: j.mouvements_bebe,
      intensite: j.intensite_mouvements || 'moyen'
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Graphique Poids */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Évolution du poids
          </CardTitle>
        </CardHeader>
        <CardContent>
          {poidsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={poidsData}>
                <defs>
                  <linearGradient id="colorPoids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'kg', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="poids" 
                  stroke="#a855f7" 
                  fillOpacity={1} 
                  fill="url(#colorPoids)"
                  strokeWidth={2}
                  name="Poids"
                  unit=" kg"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p className="text-sm">Aucune donnée de poids enregistrée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphique Tension Artérielle */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            Tension artérielle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tensionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tensionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  domain={[60, 160]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="systolique" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Systolique"
                  unit=" mmHg"
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolique" 
                  stroke="#fb923c" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Diastolique"
                  unit=" mmHg"
                />
                {/* Seuils d'alerte */}
                <Line 
                  type="monotone" 
                  dataKey={() => 140} 
                  stroke="#ef4444" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Seuil HTA (140)"
                />
                <Line 
                  type="monotone" 
                  dataKey={() => 90} 
                  stroke="#ef4444" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Seuil HTA (90)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p className="text-sm">Aucune donnée de tension enregistrée</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-rose-50 rounded-lg">
            <p className="text-xs text-rose-800">
              <strong>Valeurs normales :</strong> Systolique {'<'} 140 mmHg, Diastolique {'<'} 90 mmHg
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Graphique Mouvements Bébé */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Mouvements du bébé
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mouvementsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mouvementsData}>
                <defs>
                  <linearGradient id="colorMouvements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'mouvements', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="mouvements" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorMouvements)"
                  strokeWidth={2}
                  name="Mouvements"
                  unit=" /jour"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p className="text-sm">Aucune donnée de mouvements enregistrée</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Fréquence normale :</strong> À partir de la 28ème semaine, attendez-vous à au moins 10 mouvements sur 2 heures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}