import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, AreaChart, Area, ComposedChart, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ReferenceArea 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function GraphiqueCroissanceEnhanced({ enfant }) {
  const mesures = enfant.mesures_croissance || [];

  // Courbes de référence OMS (percentiles)
  const courbesReferenceOMS = useMemo(() => {
    const ageMax = Math.max(...mesures.map(m => {
      const mois = Math.floor((new Date(m.date) - new Date(enfant.date_naissance)) / (30.44 * 86400000));
      return mois;
    }), 24);

    const courbes = [];
    for (let mois = 0; mois <= ageMax; mois++) {
      // Formules approximatives OMS pour garçons (ajuster selon le sexe)
      const isBoy = enfant.sexe === 'masculin';
      
      courbes.push({
        mois,
        poids_p3: isBoy ? 2.5 + (mois * 0.3) : 2.4 + (mois * 0.28),
        poids_p50: isBoy ? 3.3 + (mois * 0.45) : 3.2 + (mois * 0.42),
        poids_p97: isBoy ? 4.5 + (mois * 0.6) : 4.2 + (mois * 0.58),
        taille_p3: isBoy ? 48 + (mois * 2.2) : 47.5 + (mois * 2.1),
        taille_p50: isBoy ? 50 + (mois * 2.5) : 49.5 + (mois * 2.4),
        taille_p97: isBoy ? 52 + (mois * 2.8) : 51.5 + (mois * 2.7)
      });
    }
    return courbes;
  }, [mesures, enfant]);

  // Données enfant avec percentiles
  const donneesCroissance = useMemo(() => {
    return mesures.map(m => {
      const mois = Math.floor((new Date(m.date) - new Date(enfant.date_naissance)) / (30.44 * 86400000));
      const refOMS = courbesReferenceOMS[mois] || courbesReferenceOMS[courbesReferenceOMS.length - 1];
      
      // Calculer percentile approximatif
      const percentilePoids = m.poids < refOMS.poids_p3 ? '<3' :
                              m.poids < refOMS.poids_p50 ? '3-50' :
                              m.poids < refOMS.poids_p97 ? '50-97' : '>97';
      
      return {
        date: new Date(m.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        mois,
        poids: m.poids,
        taille: m.taille,
        pc: m.perimetre_cranien,
        ...refOMS,
        percentilePoids
      };
    });
  }, [mesures, courbesReferenceOMS, enfant]);

  // Tendances
  const tendances = useMemo(() => {
    if (donneesCroissance.length < 2) return null;
    
    const derniereMesure = donneesCroissance[donneesCroissance.length - 1];
    const avantDerniereMesure = donneesCroissance[donneesCroissance.length - 2];
    
    const diffPoids = derniereMesure.poids - avantDerniereMesure.poids;
    const diffTaille = derniereMesure.taille - avantDerniereMesure.taille;
    
    return {
      poids: {
        valeur: diffPoids,
        tendance: diffPoids > 0 ? 'hausse' : diffPoids < 0 ? 'baisse' : 'stable'
      },
      taille: {
        valeur: diffTaille,
        tendance: diffTaille > 0 ? 'hausse' : diffTaille < 0 ? 'baisse' : 'stable'
      }
    };
  }, [donneesCroissance]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2">
          <p className="font-semibold mb-2">{label}</p>
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

  const TendanceIcon = ({ tendance }) => {
    if (tendance === 'hausse') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (tendance === 'baisse') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Indicateurs de tendance */}
      {tendances && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Évolution Poids</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tendances.poids.valeur > 0 ? '+' : ''}{tendances.poids.valeur.toFixed(1)} kg
                  </p>
                </div>
                <TendanceIcon tendance={tendances.poids.tendance} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Évolution Taille</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {tendances.taille.valeur > 0 ? '+' : ''}{tendances.taille.valeur.toFixed(1)} cm
                  </p>
                </div>
                <TendanceIcon tendance={tendances.taille.tendance} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphiques */}
      <Tabs defaultValue="poids">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="poids">Poids</TabsTrigger>
          <TabsTrigger value="taille">Taille</TabsTrigger>
          <TabsTrigger value="pc">Périmètre crânien</TabsTrigger>
        </TabsList>

        <TabsContent value="poids">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Courbe de Poids avec Percentiles OMS</CardTitle>
                <Badge className="bg-blue-100 text-blue-800">
                  {donneesCroissance[donneesCroissance.length - 1]?.percentilePoids}e percentile
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={donneesCroissance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Zones de référence OMS */}
                  <ReferenceArea 
                    y1="poids_p3" 
                    y2="poids_p97" 
                    fill="#93C5FD" 
                    fillOpacity={0.2}
                    label="Zone normale"
                  />
                  
                  {/* Courbes de référence */}
                  <Line 
                    type="monotone" 
                    dataKey="poids_p3" 
                    stroke="#EF4444" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    name="P3 (min)"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="poids_p50" 
                    stroke="#3B82F6" 
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    name="P50 (médiane)"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="poids_p97" 
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    name="P97 (max)"
                    dot={false}
                  />
                  
                  {/* Courbe enfant */}
                  <Line 
                    type="monotone" 
                    dataKey="poids" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    name="Poids de l'enfant"
                    dot={{ fill: '#8B5CF6', r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taille">
          <Card>
            <CardHeader>
              <CardTitle>Courbe de Taille avec Percentiles OMS</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={donneesCroissance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Taille (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <ReferenceArea 
                    y1="taille_p3" 
                    y2="taille_p97" 
                    fill="#A78BFA" 
                    fillOpacity={0.2}
                  />
                  
                  <Line type="monotone" dataKey="taille_p3" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={1} name="P3" dot={false} />
                  <Line type="monotone" dataKey="taille_p50" stroke="#8B5CF6" strokeDasharray="3 3" strokeWidth={1} name="P50" dot={false} />
                  <Line type="monotone" dataKey="taille_p97" stroke="#10B981" strokeDasharray="5 5" strokeWidth={1} name="P97" dot={false} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="taille" 
                    stroke="#EC4899" 
                    strokeWidth={3}
                    name="Taille de l'enfant"
                    dot={{ fill: '#EC4899', r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pc">
          <Card>
            <CardHeader>
              <CardTitle>Périmètre Crânien</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={donneesCroissance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'PC (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Area 
                    type="monotone" 
                    dataKey="pc" 
                    fill="#14B8A6" 
                    stroke="#14B8A6"
                    strokeWidth={2}
                    name="Périmètre crânien"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}