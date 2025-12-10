import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Brain, TrendingUp, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RapportsResultatsIA() {
  const [periode, setPeriode] = useState('3mois');
  const [typeRisque, setTypeRisque] = useState('tous');

  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses_risque'],
    queryFn: () => base44.entities.AnalyseRisque.list(),
  });

  const { data: grossesses = [] } = useQuery({
    queryKey: ['grossesses'],
    queryFn: () => base44.entities.SuiviGrossesse.list(),
  });

  const getDateDebut = () => {
    const now = new Date();
    switch (periode) {
      case '1mois': return subMonths(now, 1);
      case '3mois': return subMonths(now, 3);
      case '6mois': return subMonths(now, 6);
      case '1an': return subMonths(now, 12);
      default: return new Date(0);
    }
  };

  const dateDebut = getDateDebut();
  const analysesFiltrees = analyses.filter(a => {
    const dateAnalyse = new Date(a.date_analyse);
    const typeMatch = typeRisque === 'tous' || a.type_analyse === typeRisque;
    return dateAnalyse >= dateDebut && typeMatch;
  });

  // Distribution par niveau de risque
  const niveauxRisque = analysesFiltrees.reduce((acc, a) => {
    acc[a.niveau_risque] = (acc[a.niveau_risque] || 0) + 1;
    return acc;
  }, {});

  const niveauData = Object.entries(niveauxRisque).map(([niveau, count]) => ({
    niveau: niveau.charAt(0).toUpperCase() + niveau.slice(1),
    count,
    color: niveau === 'critique' ? '#EF4444' : niveau === 'eleve' ? '#F59E0B' : niveau === 'modere' ? '#FBBF24' : '#10B981'
  }));

  // Distribution par type d'analyse
  const typesAnalyse = analysesFiltrees.reduce((acc, a) => {
    acc[a.type_analyse] = (acc[a.type_analyse] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typesAnalyse).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count
  }));

  // Évolution des alertes
  const alertesParMois = analysesFiltrees.reduce((acc, a) => {
    const mois = format(new Date(a.date_analyse), 'MMM yyyy', { locale: fr });
    if (!acc[mois]) acc[mois] = { total: 0, critique: 0, eleve: 0 };
    acc[mois].total++;
    if (a.niveau_risque === 'critique') acc[mois].critique++;
    if (a.niveau_risque === 'eleve') acc[mois].eleve++;
    return acc;
  }, {});

  const evolutionData = Object.entries(alertesParMois)
    .map(([mois, data]) => ({ mois, ...data }))
    .slice(-12);

  // Validation professionnelle
  const validees = analysesFiltrees.filter(a => a.valide_par_professionnel).length;
  const tauxValidation = analysesFiltrees.length > 0
    ? ((validees / analysesFiltrees.length) * 100).toFixed(1)
    : 0;

  // Score de confiance moyen
  const confMoyenne = analysesFiltrees.length > 0
    ? (analysesFiltrees.reduce((sum, a) => sum + (a.confiance_score || 0), 0) / analysesFiltrees.length).toFixed(1)
    : 0;

  // Corrélation score risque / résultat clinique
  const correlationData = analysesFiltrees
    .filter(a => a.grossesse_id && a.score_risque)
    .map(a => {
      const grossesse = grossesses.find(g => g.id === a.grossesse_id);
      const complications = grossesse?.complications?.length || 0;
      return {
        score_risque: a.score_risque,
        complications,
        niveau: a.niveau_risque
      };
    });

  // Top facteurs de risque identifiés
  const tousFacteurs = analysesFiltrees.flatMap(a => a.facteurs_identifie || []);
  const facteursFrequents = tousFacteurs.reduce((acc, f) => {
    acc[f.facteur] = (acc[f.facteur] || 0) + 1;
    return acc;
  }, {});

  const topFacteurs = Object.entries(facteursFrequents)
    .map(([facteur, count]) => ({ facteur, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Efficacité interventions
  const interventionsReussies = analysesFiltrees.filter(a => {
    return a.valide_par_professionnel && a.niveau_risque !== 'critique';
  }).length;

  const tauxIntervention = analysesFiltrees.filter(a => a.niveau_risque === 'eleve' || a.niveau_risque === 'critique').length;
  const efficacite = tauxIntervention > 0
    ? ((interventionsReussies / tauxIntervention) * 100).toFixed(1)
    : 0;

  const exporterRapport = () => {
    const rapport = {
      periode,
      type_risque: typeRisque,
      date_generation: new Date().toISOString(),
      statistiques: {
        total_analyses: analysesFiltrees.length,
        taux_validation: tauxValidation,
        confiance_moyenne: confMoyenne,
        efficacite_interventions: efficacite,
        niveaux_risque: niveauxRisque,
        top_facteurs: topFacteurs
      }
    };

    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_ia_risques_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Rapports Résultats IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1mois">1 mois</SelectItem>
                  <SelectItem value="3mois">3 mois</SelectItem>
                  <SelectItem value="6mois">6 mois</SelectItem>
                  <SelectItem value="1an">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type de Risque</label>
              <Select value={typeRisque} onValueChange={setTypeRisque}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="pre_eclampsie">Pré-éclampsie</SelectItem>
                  <SelectItem value="diabete_gestationnel">Diabète gestationnel</SelectItem>
                  <SelectItem value="accouchement_premature">Accouchement prématuré</SelectItem>
                  <SelectItem value="retard_croissance">Retard croissance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exporterRapport} variant="outline" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Analyses</p>
            <p className="text-3xl font-bold text-purple-600">{analysesFiltrees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Taux Validation</p>
            <p className="text-3xl font-bold text-green-600">{tauxValidation}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Confiance Moyenne</p>
            <p className="text-3xl font-bold text-blue-600">{confMoyenne}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Efficacité</p>
            <p className="text-3xl font-bold text-orange-600">{efficacite}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={niveauData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="niveau" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {niveauData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyses par Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="critique" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="eleve" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {correlationData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Corrélation Score IA / Complications Réelles</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="score_risque" name="Score IA" />
                  <YAxis dataKey="complications" name="Complications" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Patients" data={correlationData} fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top facteurs de risque */}
      <Card>
        <CardHeader>
          <CardTitle>Facteurs de Risque Fréquents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topFacteurs.map((f, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <Badge variant={idx < 3 ? 'default' : 'outline'} className="mb-2">#{idx + 1}</Badge>
                <p className="text-sm font-medium mb-1">{f.facteur}</p>
                <p className="text-2xl font-bold text-purple-600">{f.count}</p>
                <p className="text-xs text-gray-500">détections</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}