import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Plus, Calendar, AlertCircle, Download, Info, Target, Zap } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import AjouterMesureModal from './modals/AjouterMesureModal';
import { CardTransition } from '@/components/ui/page-transition';
import { Touchable, ExpandableCard } from '@/components/ui/native-interactions';

// Courbes de référence OMS - Données simplifiées pour poids et taille
const courbePoidsMasculin = [
  { mois: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { mois: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { mois: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { mois: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { mois: 6, p3: 6.4, p15: 7.3, p50: 7.9, p85: 8.8, p97: 9.8 },
  { mois: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 10.9 },
  { mois: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 11.8 },
  { mois: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.5 },
  { mois: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
  { mois: 36, p3: 11.3, p15: 12.7, p50: 14.3, p85: 16.2, p97: 18.3 },
];

const courbePoidsFeminin = [
  { mois: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { mois: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { mois: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { mois: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { mois: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { mois: 9, p3: 6.4, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { mois: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  { mois: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.6, p97: 13.2 },
  { mois: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
  { mois: 36, p3: 10.8, p15: 12.2, p50: 13.9, p85: 15.8, p97: 18.1 },
];

const courbeTailleMasculin = [
  { mois: 0, p3: 46.1, p15: 48.0, p50: 49.9, p85: 51.8, p97: 53.7 },
  { mois: 1, p3: 50.8, p15: 52.8, p50: 54.7, p85: 56.7, p97: 58.6 },
  { mois: 2, p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
  { mois: 3, p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  { mois: 6, p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  { mois: 9, p3: 67.7, p15: 70.1, p50: 72.0, p85: 74.2, p97: 76.5 },
  { mois: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  { mois: 18, p3: 76.0, p15: 78.7, p50: 81.0, p85: 83.5, p97: 86.1 },
  { mois: 24, p3: 79.9, p15: 82.5, p50: 85.1, p85: 87.8, p97: 90.9 },
  { mois: 36, p3: 87.1, p15: 90.3, p50: 93.9, p85: 97.0, p97: 101.2 },
];

const courbeTailleFeminin = [
  { mois: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { mois: 1, p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.6 },
  { mois: 2, p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 61.1 },
  { mois: 3, p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  { mois: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
  { mois: 9, p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.6, p97: 75.0 },
  { mois: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  { mois: 18, p3: 74.5, p15: 77.2, p50: 79.9, p85: 82.7, p97: 85.7 },
  { mois: 24, p3: 78.4, p15: 81.3, p50: 84.5, p85: 87.5, p97: 91.0 },
  { mois: 36, p3: 86.2, p15: 89.6, p50: 93.1, p85: 96.7, p97: 101.0 },
];

export default function GraphiqueCroissance({ enfant, mesures, isEditable = false }) {
  const [showModal, setShowModal] = useState(false);
  const [ongletActif, setOngletActif] = useState("poids");
  const mesuresCroissance = mesures || enfant?.mesures_croissance || [];

  // Déterminer les courbes de référence selon le sexe
  const courbePoids = enfant.sexe === 'masculin' ? courbePoidsMasculin : courbePoidsFeminin;
  const courbeTaille = enfant.sexe === 'masculin' ? courbeTailleMasculin : courbeTailleFeminin;

  // Calculer l'âge en mois pour chaque mesure
  const ageEnMois = (dateMesure) => differenceInMonths(new Date(dateMesure), new Date(enfant.date_naissance));

  // Ajouter la mesure de naissance si elle existe
  const toutesLesMesures = [];
  if (enfant?.date_naissance && (enfant?.poids_naissance || enfant?.taille_naissance)) {
    toutesLesMesures.push({
      date: enfant.date_naissance,
      poids: enfant.poids_naissance,
      taille: enfant.taille_naissance,
      perimetre_cranien: null
    });
  }
  toutesLesMesures.push(...mesuresCroissance);

  // Préparer les données pour les graphiques avec comparaison OMS
  const dataPoids = toutesLesMesures
    .filter(m => m.poids)
    .map(m => {
      const mois = ageEnMois(m.date);
      const courbeRef = courbePoids.find(c => c.mois === mois) || courbePoids[courbePoids.length - 1];
      return {
        date: format(new Date(m.date), 'dd/MM/yy'),
        mois,
        poids: m.poids,
        p3: courbeRef?.p3,
        p50: courbeRef?.p50,
        p97: courbeRef?.p97
      };
    });

  const dataTaille = toutesLesMesures
    .filter(m => m.taille)
    .map(m => {
      const mois = ageEnMois(m.date);
      const courbeRef = courbeTaille.find(c => c.mois === mois) || courbeTaille[courbeTaille.length - 1];
      return {
        date: format(new Date(m.date), 'dd/MM/yy'),
        mois,
        taille: m.taille,
        p3: courbeRef?.p3,
        p50: courbeRef?.p50,
        p97: courbeRef?.p97
      };
    });

  const derniereMesure = mesuresCroissance.length > 0 ? mesuresCroissance[mesuresCroissance.length - 1] : null;

  // Calculer le Z-score (position par rapport à la médiane OMS)
  const calculerPercentile = (valeur, mois, type) => {
    const courbe = type === 'poids' ? courbePoids : courbeTaille;
    const ref = courbe.find(c => c.mois === mois) || courbe[courbe.length - 1];
    
    if (!ref) return { percentile: 'N/A', couleur: 'gray', alerte: false };
    
    if (valeur < ref.p3) {
      return { percentile: '< 3ᵉ percentile', couleur: 'red', alerte: true, message: 'Sous la norme' };
    } else if (valeur < ref.p15) {
      return { percentile: '3-15ᵉ percentile', couleur: 'orange', alerte: false };
    } else if (valeur <= ref.p85) {
      return { percentile: '15-85ᵉ percentile', couleur: 'green', alerte: false, message: 'Normal' };
    } else if (valeur <= ref.p97) {
      return { percentile: '85-97ᵉ percentile', couleur: 'orange', alerte: false };
    } else {
      return { percentile: '> 97ᵉ percentile', couleur: 'red', alerte: true, message: 'Au-dessus de la norme' };
    }
  };

  const dernierPoidsAnalyse = derniereMesure?.poids ? 
    calculerPercentile(derniereMesure.poids, ageEnMois(derniereMesure.date), 'poids') : null;
  const derniereTailleAnalyse = derniereMesure?.taille ? 
    calculerPercentile(derniereMesure.taille, ageEnMois(derniereMesure.date), 'taille') : null;

  const exporterDonnees = () => {
    const csv = [
      ['Date', 'Âge (mois)', 'Poids (kg)', 'Taille (cm)', 'Périmètre crânien (cm)'],
      ...toutesLesMesures.map(m => [
        format(new Date(m.date), 'dd/MM/yyyy'),
        ageEnMois(m.date),
        m.poids || '',
        m.taille || '',
        m.perimetre_cranien || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `croissance_${enfant.prenom}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-xl border-none rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span>Suivi de la croissance</span>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Touchable onPress={exporterDonnees} haptic>
              <Button variant="outline" size="sm" className="rounded-xl shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </Touchable>
            {isEditable && (
              <Touchable onPress={() => setShowModal(true)} haptic>
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-lg">
                  <Plus className="w-4 h-4 mr-2"/>
                  Nouvelle mesure
                </Button>
              </Touchable>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alertes de croissance optimisées */}
          {(dernierPoidsAnalyse?.alerte || derniereTailleAnalyse?.alerte) && (
            <CardTransition>
              <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-2xl shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                        ⚠️ Alerte de croissance
                      </p>
                      <div className="space-y-2">
                        {dernierPoidsAnalyse?.alerte && (
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                              Poids <strong>{dernierPoidsAnalyse.message.toLowerCase()}</strong> - Consultation recommandée
                            </p>
                          </div>
                        )}
                        {derniereTailleAnalyse?.alerte && (
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                              Taille <strong>{derniereTailleAnalyse.message.toLowerCase()}</strong> - Consultation recommandée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardTransition>
          )}

          {/* Dernières mesures optimisées */}
          {derniereMesure && (
            <CardTransition delay={0.1}>
              <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      Mesures actuelles
                    </span>
                    <Badge variant="outline" className="w-fit rounded-xl px-3 py-1">
                      {format(new Date(derniereMesure.date), 'dd MMMM yyyy', { locale: fr })}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {derniereMesure.poids && (
                      <div className="p-5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl shadow-md">
                        <p className="text-sm font-medium text-blue-900 mb-2">Poids</p>
                        <p className="text-4xl font-bold text-blue-600 mb-3">{derniereMesure.poids} <span className="text-xl">kg</span></p>
                        {dernierPoidsAnalyse && (
                          <Badge className={`bg-${dernierPoidsAnalyse.couleur}-500 text-white shadow-sm`}>
                            {dernierPoidsAnalyse.percentile}
                          </Badge>
                        )}
                      </div>
                    )}
                    {derniereMesure.taille && (
                      <div className="p-5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-md">
                        <p className="text-sm font-medium text-green-900 mb-2">Taille</p>
                        <p className="text-4xl font-bold text-green-600 mb-3">{derniereMesure.taille} <span className="text-xl">cm</span></p>
                        {derniereTailleAnalyse && (
                          <Badge className={`bg-${derniereTailleAnalyse.couleur}-500 text-white shadow-sm`}>
                            {derniereTailleAnalyse.percentile}
                          </Badge>
                        )}
                      </div>
                    )}
                    {derniereMesure.perimetre_cranien && (
                      <div className="p-5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl shadow-md">
                        <p className="text-sm font-medium text-purple-900 mb-2">Périmètre crânien</p>
                        <p className="text-4xl font-bold text-purple-600 mb-3">{derniereMesure.perimetre_cranien} <span className="text-xl">cm</span></p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardTransition>
          )}

          {/* Info OMS */}
          <ExpandableCard
            title="📊 Comprendre les courbes OMS"
            icon={<Info className="w-5 h-5 text-blue-600" />}
            className="shadow-lg"
          >
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Percentile 3 (P3)</strong> : Limite basse - En dessous = consultation recommandée</p>
              <p><strong>Percentile 50 (Médiane)</strong> : Valeur moyenne de référence OMS</p>
              <p><strong>Percentile 97 (P97)</strong> : Limite haute - Au-dessus = consultation recommandée</p>
              <p className="text-xs text-gray-600 pt-2 border-t">
                💡 <strong>Zone normale</strong> : Entre P3 et P97. Si votre enfant sort de cette zone, consultez un professionnel.
              </p>
            </div>
          </ExpandableCard>

          {/* Graphiques avec courbes OMS */}
          <Tabs value={ongletActif} onValueChange={setOngletActif}>
            <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 bg-white rounded-2xl shadow-md">
              <TabsTrigger 
                value="poids" 
                className="rounded-xl py-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Poids
              </TabsTrigger>
              <TabsTrigger 
                value="taille"
                className="rounded-xl py-3 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Taille
              </TabsTrigger>
            </TabsList>

          <TabsContent value="poids" className="space-y-4">
            {dataPoids.length > 0 ? (
              <CardTransition delay={0.15}>
                <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Courbe de poids vs normes OMS
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Les lignes pointillées = zones de référence OMS (3ᵉ, 50ᵉ, 97ᵉ percentile)
                    </p>
                  </CardHeader>
                  <CardContent className="p-5">
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={dataPoids}>
                        <defs>
                          <linearGradient id="colorPoids" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        
                        {/* Zone normale (entre P3 et P97) */}
                        <Area type="monotone" dataKey="p97" stroke="none" fill="#fee2e2" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="p3" stroke="none" fill="#dbeafe" fillOpacity={0.3} />
                        
                        {/* Courbes de référence OMS */}
                        <Line type="monotone" dataKey="p3" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="P3 (min)" dot={false} />
                        <Line type="monotone" dataKey="p50" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={2} name="P50 (médiane)" dot={false} />
                        <Line type="monotone" dataKey="p97" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="P97 (max)" dot={false} />
                        
                        {/* Courbe de l'enfant */}
                        <Line type="monotone" dataKey="poids" stroke="#3b82f6" strokeWidth={4} name={enfant.prenom} dot={{ r: 8, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </CardTransition>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Ajoutez des mesures de poids pour voir la courbe</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="taille" className="space-y-4">
            {dataTaille.length > 0 ? (
              <CardTransition delay={0.15}>
                <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Courbe de taille vs normes OMS
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Les lignes pointillées = zones de référence OMS (3ᵉ, 50ᵉ, 97ᵉ percentile)
                    </p>
                  </CardHeader>
                  <CardContent className="p-5">
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={dataTaille}>
                        <defs>
                          <linearGradient id="colorTaille" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'Taille (cm)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        
                        {/* Zone normale */}
                        <Area type="monotone" dataKey="p97" stroke="none" fill="#fee2e2" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="p3" stroke="none" fill="#dcfce7" fillOpacity={0.3} />
                        
                        {/* Courbes de référence */}
                        <Line type="monotone" dataKey="p3" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="P3 (min)" dot={false} />
                        <Line type="monotone" dataKey="p50" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={2} name="P50 (médiane)" dot={false} />
                        <Line type="monotone" dataKey="p97" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="P97 (max)" dot={false} />
                        
                        {/* Courbe de l'enfant */}
                        <Line type="monotone" dataKey="taille" stroke="#10b981" strokeWidth={4} name={enfant.prenom} dot={{ r: 8, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </CardTransition>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Ajoutez des mesures de taille pour voir la courbe</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

          {/* Historique des mesures */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle>Historique des mesures ({toutesLesMesures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {toutesLesMesures.length > 0 ? (
                <div className="space-y-3">
                  {toutesLesMesures.slice().reverse().map((mesure, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">
                          {format(new Date(mesure.date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {ageEnMois(mesure.date)} mois
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {mesure.poids && (
                          <div>
                            <span className="text-gray-600">Poids: </span>
                            <span className="font-semibold text-blue-600">{mesure.poids} kg</span>
                          </div>
                        )}
                        {mesure.taille && (
                          <div>
                            <span className="text-gray-600">Taille: </span>
                            <span className="font-semibold text-green-600">{mesure.taille} cm</span>
                          </div>
                        )}
                        {mesure.perimetre_cranien && (
                          <div>
                            <span className="text-gray-600">PC: </span>
                            <span className="font-semibold text-purple-600">{mesure.perimetre_cranien} cm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Aucune mesure enregistrée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {showModal && (
        <AjouterMesureModal 
          enfantId={enfant.id}
          mesuresExistantes={mesuresCroissance}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}