import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, HeartPulse, TrendingUp, AlertCircle, CheckCircle, Scale } from 'lucide-react';

export default function IndicateursGrossesseEnhanced({ grossesse }) {
  const consultations = grossesse.consultations || [];
  
  // Calculer la semaine actuelle
  const semaineActuelle = Math.floor((Date.now() - new Date(grossesse.date_derniere_regle)) / 604800000);
  const trimestre = semaineActuelle <= 13 ? 1 : semaineActuelle <= 26 ? 2 : 3;
  const progressionGrossesse = (semaineActuelle / 40) * 100;

  // Données pour graphiques
  const tensionData = consultations
    .filter(c => c.tension_arterielle)
    .map((c, idx) => {
      const [systolique, diastolique] = c.tension_arterielle.split('/').map(Number);
      return {
        consultation: `C${idx + 1}`,
        systolique,
        diastolique,
        date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      };
    });

  const poidsData = consultations
    .filter(c => c.poids)
    .map((c, idx) => ({
      consultation: `C${idx + 1}`,
      poids: c.poids,
      date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    }));

  // Analyser les tendances
  const derniereTension = tensionData[tensionData.length - 1];
  const tensionNormale = derniereTension?.systolique <= 140 && derniereTension?.diastolique <= 90;

  const dernierPoids = poidsData[poidsData.length - 1];
  const gainPoids = dernierPoids && grossesse.consultations?.[0]?.poids 
    ? dernierPoids.poids - grossesse.consultations[0].poids 
    : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{payload[0].payload.date}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Progression globale */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progression de la grossesse</p>
                <p className="text-3xl font-bold text-pink-600">{semaineActuelle} SA</p>
                <p className="text-sm text-gray-600">Trimestre {trimestre}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-pink-500">{progressionGrossesse.toFixed(0)}%</Badge>
                <p className="text-xs text-gray-600 mt-1">
                  {40 - semaineActuelle} semaines restantes
                </p>
              </div>
            </div>
            <Progress value={progressionGrossesse} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className={`w-5 h-5 ${tensionNormale ? 'text-green-600' : 'text-orange-600'}`} />
              <span className="text-sm font-medium">Tension</span>
            </div>
            {derniereTension ? (
              <>
                <p className="text-xl font-bold">
                  {derniereTension.systolique}/{derniereTension.diastolique}
                </p>
                {tensionNormale ? (
                  <Badge className="bg-green-100 text-green-800 mt-2">Normale</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 mt-2">À surveiller</Badge>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Non mesurée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Poids</span>
            </div>
            {dernierPoids ? (
              <>
                <p className="text-xl font-bold">{dernierPoids.poids} kg</p>
                <p className="text-xs text-gray-600 mt-1">
                  +{gainPoids.toFixed(1)} kg
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Non mesuré</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Consultations</span>
            </div>
            <p className="text-xl font-bold">{consultations.length}</p>
            <p className="text-xs text-gray-600 mt-1">
              {consultations.length >= 4 ? '✅ Recommandation atteinte' : '⚠️ À compléter'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Tension Artérielle */}
      {tensionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-600" />
              Évolution de la Tension Artérielle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tensionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[60, 160]} label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Zones de référence */}
                <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" label="Seuil systolique" />
                <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label="Seuil diastolique" />
                
                <Line
                  type="monotone"
                  dataKey="systolique"
                  stroke="#EC4899"
                  strokeWidth={3}
                  dot={{ fill: '#EC4899', r: 5 }}
                  name="Systolique"
                />
                <Line
                  type="monotone"
                  dataKey="diastolique"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 5 }}
                  name="Diastolique"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Graphique Poids */}
      {poidsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Courbe de Poids
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={poidsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                
                <Line
                  type="monotone"
                  dataKey="poids"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 5 }}
                  name="Poids"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alertes et Conseils IA */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Analyse IA - Trimestre {trimestre}</p>
              <p className="text-sm text-blue-800 mt-1">
                {trimestre === 1 && 'Les nausées sont normales. Hydratez-vous bien et fractionnez les repas.'}
                {trimestre === 2 && 'Période idéale pour les activités physiques douces. Continuez les consultations régulières.'}
                {trimestre === 3 && 'Préparez votre accouchement. Repos recommandé et surveillance rapprochée.'}
              </p>
            </div>
          </div>

          {!tensionNormale && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Alerte Tension</p>
                <p className="text-sm text-orange-800">
                  Votre tension est élevée. Consultez rapidement votre médecin pour éviter la pré-éclampsie.
                </p>
              </div>
            </div>
          )}

          {gainPoids > 15 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Prise de Poids</p>
                <p className="text-sm text-yellow-800">
                  Gain de poids important. Discutez avec votre médecin de votre alimentation et activité physique.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}