import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function IndicateursGrossesse({ grossesse }) {
  const consultations = grossesse.consultations || [];

  // Données de tension artérielle
  const donneesTA = useMemo(() => {
    return consultations
      .filter(c => c.tension_arterielle)
      .map(c => {
        const [systolique, diastolique] = c.tension_arterielle.split('/').map(Number);
        return {
          date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          systolique,
          diastolique,
          semaine: c.semaine_grossesse
        };
      });
  }, [consultations]);

  // Données de poids
  const donneesPoids = useMemo(() => {
    if (consultations.length === 0) return [];
    
    const poidsInitial = consultations[0].poids || 60;
    return consultations
      .filter(c => c.poids)
      .map(c => {
        const prise = c.poids - poidsInitial;
        const semaine = c.semaine_grossesse || 0;
        // Prise de poids recommandée (approximative)
        const priseRecommandee = (semaine / 40) * 12; // ~12kg à terme
        
        return {
          date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          poids: c.poids,
          prise,
          priseRecommandee,
          semaine
        };
      });
  }, [consultations]);

  // Analyse des risques
  const analyse = useMemo(() => {
    const derniereConsultation = consultations[consultations.length - 1];
    if (!derniereConsultation) return null;

    const [sys, dia] = (derniereConsultation.tension_arterielle || '120/80').split('/').map(Number);
    const taElevee = sys >= 140 || dia >= 90;
    
    const poidsInitial = consultations[0]?.poids || 60;
    const poidsActuel = derniereConsultation.poids || poidsInitial;
    const prisePoids = poidsActuel - poidsInitial;
    const semaine = derniereConsultation.semaine_grossesse || 20;
    const priseExcessive = prisePoids > (semaine / 40 * 15); // >15kg à terme

    return {
      taElevee,
      priseExcessive,
      niveauRisque: taElevee || priseExcessive ? 'modere' : 'faible'
    };
  }, [consultations]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Indicateurs de risque */}
      {analyse && (
        <Card className={
          analyse.niveauRisque === 'modere' ? 'border-2 border-orange-300' :
          analyse.niveauRisque === 'faible' ? 'border-2 border-green-300' : ''
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Analyse de Santé
              </CardTitle>
              <Badge className={
                analyse.niveauRisque === 'modere' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }>
                {analyse.niveauRisque === 'modere' ? '⚠️ À surveiller' : '✓ Normal'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {analyse.taElevee ? (
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-medium">Tension artérielle</span>
                </div>
                <span className={analyse.taElevee ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                  {analyse.taElevee ? 'Élevée' : 'Normale'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {analyse.priseExcessive ? (
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-medium">Prise de poids</span>
                </div>
                <span className={analyse.priseExcessive ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                  {analyse.priseExcessive ? 'Rapide' : 'Normale'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique Tension Artérielle */}
      {donneesTA.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suivi de la Tension Artérielle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={donneesTA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Zones de référence */}
                <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" label="Max sys" />
                <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label="Max dia" />
                
                <Line 
                  type="monotone" 
                  dataKey="systolique" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Systolique"
                  dot={{ fill: '#EF4444', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolique" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Diastolique"
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Graphique Poids */}
      {donneesPoids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution du Poids</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={donneesPoids}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area 
                  type="monotone" 
                  dataKey="priseRecommandee" 
                  fill="#93C5FD" 
                  stroke="#3B82F6"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Prise recommandée"
                />
                <Area 
                  type="monotone" 
                  dataKey="prise" 
                  fill="#F9A8D4" 
                  stroke="#EC4899"
                  strokeWidth={2}
                  name="Prise réelle"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}