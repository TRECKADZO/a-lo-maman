import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, Download, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RapportsDemographiques() {
  const [periode, setPeriode] = useState('6mois');
  const [region, setRegion] = useState('toutes');

  const { data: profils = [] } = useQuery({
    queryKey: ['profils_maman'],
    queryFn: () => base44.entities.ProfilMaman.list(),
  });

  const { data: grossesses = [] } = useQuery({
    queryKey: ['grossesses'],
    queryFn: () => base44.entities.SuiviGrossesse.list(),
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list(),
  });

  // Filtrer par période
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
  const profilsFiltres = profils.filter(p => {
    const dateCreation = new Date(p.created_date);
    const regionMatch = region === 'toutes' || p.region === region;
    return dateCreation >= dateDebut && regionMatch;
  });

  // Analyse par tranche d'âge
  const tranches = profilsFiltres.reduce((acc, p) => {
    if (!p.date_naissance) return acc;
    const age = new Date().getFullYear() - new Date(p.date_naissance).getFullYear();
    if (age < 20) acc['<20 ans']++;
    else if (age < 25) acc['20-24 ans']++;
    else if (age < 30) acc['25-29 ans']++;
    else if (age < 35) acc['30-34 ans']++;
    else if (age < 40) acc['35-39 ans']++;
    else acc['40+ ans']++;
    return acc;
  }, { '<20 ans': 0, '20-24 ans': 0, '25-29 ans': 0, '30-34 ans': 0, '35-39 ans': 0, '40+ ans': 0 });

  const ageData = Object.entries(tranches).map(([tranche, count]) => ({
    tranche,
    count,
    percentage: ((count / profilsFiltres.length) * 100).toFixed(1)
  }));

  // Répartition par région
  const regions = profilsFiltres.reduce((acc, p) => {
    const reg = p.region || 'Non spécifié';
    acc[reg] = (acc[reg] || 0) + 1;
    return acc;
  }, {});

  const regionData = Object.entries(regions)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Évolution inscriptions par mois
  const inscriptionsParMois = profilsFiltres.reduce((acc, p) => {
    const mois = format(new Date(p.created_date), 'MMM yyyy', { locale: fr });
    acc[mois] = (acc[mois] || 0) + 1;
    return acc;
  }, {});

  const evolutionData = Object.entries(inscriptionsParMois)
    .map(([mois, count]) => ({ mois, inscriptions: count }))
    .slice(-12);

  // Statistiques grossesses
  const grossessesActives = grossesses.filter(g => g.grossesse_active).length;
  const grossessesParTrimestre = grossesses.reduce((acc, g) => {
    if (!g.grossesse_active) return acc;
    const now = new Date();
    const ddr = new Date(g.date_derniere_regle);
    const semaines = Math.floor((now - ddr) / (7 * 24 * 60 * 60 * 1000));
    const trimestre = semaines < 14 ? 'T1' : semaines < 28 ? 'T2' : 'T3';
    acc[trimestre] = (acc[trimestre] || 0) + 1;
    return acc;
  }, {});

  const trimestreData = Object.entries(grossessesParTrimestre).map(([t, count]) => ({
    trimestre: t,
    count
  }));

  // Situation familiale
  const situations = profilsFiltres.reduce((acc, p) => {
    const sit = p.situation_familiale || 'Non spécifié';
    acc[sit] = (acc[sit] || 0) + 1;
    return acc;
  }, {});

  const situationData = Object.entries(situations).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const COLORS = ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24', '#F87171'];

  const exporterRapport = () => {
    const rapport = {
      periode,
      region,
      date_generation: new Date().toISOString(),
      statistiques: {
        total_utilisatrices: profilsFiltres.length,
        grossesses_actives: grossessesActives,
        total_enfants: enfants.length,
        age_moyen: (profilsFiltres.reduce((sum, p) => {
          const age = p.date_naissance ? new Date().getFullYear() - new Date(p.date_naissance).getFullYear() : 0;
          return sum + age;
        }, 0) / profilsFiltres.length).toFixed(1)
      },
      tranches_age: tranches,
      regions: regions,
      situations_familiales: situations
    };

    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_demographique_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-600" />
            Rapports Démographiques
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
                  <SelectItem value="tout">Tout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Région</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes</SelectItem>
                  <SelectItem value="Abidjan">Abidjan</SelectItem>
                  <SelectItem value="Bouaké">Bouaké</SelectItem>
                  <SelectItem value="San-Pédro">San-Pédro</SelectItem>
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
            <p className="text-sm text-gray-600">Total Utilisatrices</p>
            <p className="text-3xl font-bold text-pink-600">{profilsFiltres.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Grossesses Actives</p>
            <p className="text-3xl font-bold text-purple-600">{grossessesActives}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Enfants Suivis</p>
            <p className="text-3xl font-bold text-blue-600">{enfants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Âge Moyen</p>
            <p className="text-3xl font-bold text-green-600">
              {(profilsFiltres.reduce((sum, p) => {
                const age = p.date_naissance ? new Date().getFullYear() - new Date(p.date_naissance).getFullYear() : 0;
                return sum + age;
              }, 0) / profilsFiltres.length).toFixed(1)} ans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Âge</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tranche" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#FF6B9D" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Région</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution Inscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inscriptions" stroke="#C084FC" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grossesses par Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trimestreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trimestre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}