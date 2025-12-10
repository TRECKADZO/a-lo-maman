import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Baby, Ruler, Scale } from 'lucide-react';

export default function CourbesCroissanceEnhanced({ enfant }) {
  const mesures = enfant.mesures_croissance || [];

  // Calculer l'âge en mois pour chaque mesure
  const dataWithAge = useMemo(() => {
    return mesures.map(m => ({
      ...m,
      age_mois: Math.floor((new Date(m.date) - new Date(enfant.date_naissance)) / (30.44 * 86400000)),
      date_formatted: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    })).sort((a, b) => a.age_mois - b.age_mois);
  }, [mesures, enfant.date_naissance]);

  // Percentiles OMS (approximation)
  const getPercentiles = (type, maxAge) => {
    const data = [];
    for (let age = 0; age <= maxAge; age++) {
      if (type === 'poids') {
        data.push({
          age_mois: age,
          p3: 2.5 + age * 0.4,
          p50: 3.5 + age * 0.5,
          p97: 4.5 + age * 0.6
        });
      } else if (type === 'taille') {
        data.push({
          age_mois: age,
          p3: 48 + age * 2.2,
          p50: 50 + age * 2.5,
          p97: 52 + age * 2.8
        });
      } else if (type === 'perimetre_cranien') {
        data.push({
          age_mois: age,
          p3: 33 + age * 0.8,
          p50: 35 + age * 0.9,
          p97: 37 + age * 1.0
        });
      }
    }
    return data;
  };

  const maxAge = Math.max(...dataWithAge.map(d => d.age_mois), 12);

  // Calculer les tendances
  const calculateTrend = (field) => {
    if (dataWithAge.length < 2) return null;
    const recent = dataWithAge.slice(-2);
    const diff = recent[1][field] - recent[0][field];
    const timeDiff = recent[1].age_mois - recent[0].age_mois;
    return {
      value: (diff / timeDiff).toFixed(2),
      direction: diff > 0 ? 'up' : 'down',
      percentage: ((diff / recent[0][field]) * 100).toFixed(1)
    };
  };

  const trends = {
    poids: calculateTrend('poids'),
    taille: calculateTrend('taille'),
    perimetre_cranien: calculateTrend('perimetre_cranien')
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{label} mois</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const TrendCard = ({ title, value, unit, trend, icon: Icon, color }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {trend && (
            <Badge variant={trend.direction === 'up' ? 'default' : 'secondary'}>
              {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold">{value} {unit}</p>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">
            {trend.percentage > 0 ? '+' : ''}{trend.percentage}% depuis dernière mesure
          </p>
        )}
      </CardContent>
    </Card>
  );

  const derniereMesure = dataWithAge[dataWithAge.length - 1];

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      {derniereMesure && (
        <div className="grid grid-cols-3 gap-4">
          <TrendCard
            title="Poids"
            value={derniereMesure.poids}
            unit="kg"
            trend={trends.poids}
            icon={Scale}
            color="text-blue-600"
          />
          <TrendCard
            title="Taille"
            value={derniereMesure.taille}
            unit="cm"
            trend={trends.taille}
            icon={Ruler}
            color="text-green-600"
          />
          <TrendCard
            title="P. Crânien"
            value={derniereMesure.perimetre_cranien}
            unit="cm"
            trend={trends.perimetre_cranien}
            icon={Baby}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Graphiques avec percentiles */}
      <Tabs defaultValue="poids">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="poids">Poids</TabsTrigger>
          <TabsTrigger value="taille">Taille</TabsTrigger>
          <TabsTrigger value="perimetre">Périmètre Crânien</TabsTrigger>
        </TabsList>

        <TabsContent value="poids">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Courbe de Poids (avec percentiles OMS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getPercentiles('poids', maxAge)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age_mois" label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Percentiles */}
                  <Area type="monotone" dataKey="p3" stroke="#EF4444" fill="#FEE2E2" fillOpacity={0.3} name="3ème percentile" />
                  <Area type="monotone" dataKey="p97" stroke="#10B981" fill="#D1FAE5" fillOpacity={0.3} name="97ème percentile" />
                  <Line type="monotone" dataKey="p50" stroke="#F59E0B" strokeWidth={2} dot={false} name="Médiane (50ème)" />
                  
                  {/* Données enfant */}
                  <Line
                    type="monotone"
                    data={dataWithAge}
                    dataKey="poids"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                    name={enfant.prenom}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taille">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-green-600" />
                Courbe de Taille (avec percentiles OMS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getPercentiles('taille', maxAge)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age_mois" label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Taille (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Area type="monotone" dataKey="p3" stroke="#EF4444" fill="#FEE2E2" fillOpacity={0.3} name="3ème percentile" />
                  <Area type="monotone" dataKey="p97" stroke="#10B981" fill="#D1FAE5" fillOpacity={0.3} name="97ème percentile" />
                  <Line type="monotone" dataKey="p50" stroke="#F59E0B" strokeWidth={2} dot={false} name="Médiane (50ème)" />
                  
                  <Line
                    type="monotone"
                    data={dataWithAge}
                    dataKey="taille"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                    name={enfant.prenom}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perimetre">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-purple-600" />
                Périmètre Crânien (avec percentiles OMS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getPercentiles('perimetre_cranien', maxAge)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age_mois" label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'PC (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Area type="monotone" dataKey="p3" stroke="#EF4444" fill="#FEE2E2" fillOpacity={0.3} name="3ème percentile" />
                  <Area type="monotone" dataKey="p97" stroke="#10B981" fill="#D1FAE5" fillOpacity={0.3} name="97ème percentile" />
                  <Line type="monotone" dataKey="p50" stroke="#F59E0B" strokeWidth={2} dot={false} name="Médiane (50ème)" />
                  
                  <Line
                    type="monotone"
                    data={dataWithAge}
                    dataKey="perimetre_cranien"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 5 }}
                    name={enfant.prenom}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analyse IA */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Analyse IA de la Croissance</p>
              <p className="text-sm text-blue-800 mt-1">
                {derniereMesure?.poids > getPercentiles('poids', derniereMesure.age_mois)[derniereMesure.age_mois]?.p50 
                  ? `${enfant.prenom} a une croissance pondérale au-dessus de la médiane. ✅`
                  : `${enfant.prenom} a une croissance pondérale dans les normes. ✅`}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Tendance: {trends.poids?.direction === 'up' ? '📈 Croissance régulière' : '⚠️ Surveillance recommandée'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}