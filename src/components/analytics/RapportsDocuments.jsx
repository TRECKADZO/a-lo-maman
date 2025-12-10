import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, TrendingUp, Download, Clock } from 'lucide-react';
import { format, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RapportsDocuments() {
  const [periode, setPeriode] = useState('1mois');
  const [typeDocument, setTypeDocument] = useState('tous');

  const { data: documentsGrossesse = [] } = useQuery({
    queryKey: ['docs_grossesse'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.list();
      const docs = [];
      grossesses.forEach(g => {
        (g.documents || []).forEach(d => docs.push({ ...d, source: 'grossesse', patient: g.created_by }));
      });
      return docs;
    },
  });

  const { data: documentsEnfants = [] } = useQuery({
    queryKey: ['docs_enfants'],
    queryFn: async () => {
      const enfants = await base44.entities.EnfantCarnet.list();
      const docs = [];
      enfants.forEach(e => {
        (e.documents_medicaux || []).forEach(d => docs.push({ ...d, source: 'enfant', patient: e.created_by }));
      });
      return docs;
    },
  });

  const { data: documentsFamille = [] } = useQuery({
    queryKey: ['docs_famille'],
    queryFn: () => base44.entities.DocumentFamille.list(),
  });

  const tousDocuments = [
    ...documentsGrossesse,
    ...documentsEnfants,
    ...documentsFamille.map(d => ({ ...d, source: 'famille', patient: d.created_by }))
  ];

  const getDateDebut = () => {
    const now = new Date();
    switch (periode) {
      case '1semaine': return subMonths(now, 0.25);
      case '1mois': return subMonths(now, 1);
      case '3mois': return subMonths(now, 3);
      case '6mois': return subMonths(now, 6);
      default: return new Date(0);
    }
  };

  const dateDebut = getDateDebut();
  const docsFiltres = tousDocuments.filter(d => {
    const dateUpload = new Date(d.date_upload || d.created_date);
    const typeMatch = typeDocument === 'tous' || d.type === typeDocument;
    return dateUpload >= dateDebut && typeMatch;
  });

  // Upload par type
  const typesDoc = docsFiltres.reduce((acc, d) => {
    const type = d.type || 'Autre';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typesDoc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Upload par source
  const sourcesData = [
    { name: 'Suivi Grossesse', value: documentsGrossesse.filter(d => new Date(d.date_upload) >= dateDebut).length },
    { name: 'Carnet Enfant', value: documentsEnfants.filter(d => new Date(d.date_upload) >= dateDebut).length },
    { name: 'Famille', value: documentsFamille.filter(d => new Date(d.created_date) >= dateDebut).length }
  ];

  // Évolution uploads par semaine
  const uploadsParSemaine = docsFiltres.reduce((acc, d) => {
    const semaine = format(new Date(d.date_upload || d.created_date), 'w yyyy', { locale: fr });
    acc[semaine] = (acc[semaine] || 0) + 1;
    return acc;
  }, {});

  const evolutionData = Object.entries(uploadsParSemaine)
    .map(([semaine, count]) => ({ semaine, uploads: count }))
    .slice(-12);

  // Taille moyenne et patterns
  const taillesMoyennes = docsFiltres.reduce((acc, d) => {
    const type = d.type || 'Autre';
    if (!acc[type]) acc[type] = { total: 0, count: 0 };
    acc[type].total += (d.file_size || 0);
    acc[type].count++;
    return acc;
  }, {});

  const taillesData = Object.entries(taillesMoyennes).map(([type, data]) => ({
    type,
    taille_moyenne_mb: (data.total / data.count / 1024 / 1024).toFixed(2)
  }));

  // Délai moyen upload après consultation
  const delaisUpload = docsFiltres
    .filter(d => d.date_consultation && d.date_upload)
    .map(d => differenceInDays(new Date(d.date_upload), new Date(d.date_consultation)));

  const delaiMoyen = delaisUpload.length > 0
    ? (delaisUpload.reduce((sum, d) => sum + d, 0) / delaisUpload.length).toFixed(1)
    : 0;

  // Top utilisateurs
  const uploadsParPatient = docsFiltres.reduce((acc, d) => {
    const patient = d.patient || d.created_by;
    acc[patient] = (acc[patient] || 0) + 1;
    return acc;
  }, {});

  const topUploaders = Object.entries(uploadsParPatient)
    .map(([patient, count]) => ({ patient: patient.split('@')[0], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const COLORS = ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24', '#F87171'];

  const exporterRapport = () => {
    const rapport = {
      periode,
      type_document: typeDocument,
      date_generation: new Date().toISOString(),
      statistiques: {
        total_documents: docsFiltres.length,
        delai_moyen_jours: delaiMoyen,
        types: typesDoc,
        sources: sourcesData
      }
    };

    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_documents_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Rapports Documents
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
                  <SelectItem value="1semaine">1 semaine</SelectItem>
                  <SelectItem value="1mois">1 mois</SelectItem>
                  <SelectItem value="3mois">3 mois</SelectItem>
                  <SelectItem value="6mois">6 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={typeDocument} onValueChange={setTypeDocument}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="ordonnance">Ordonnances</SelectItem>
                  <SelectItem value="resultat_labo">Résultats labo</SelectItem>
                  <SelectItem value="echographie">Échographies</SelectItem>
                  <SelectItem value="certificat_vaccination">Vaccinations</SelectItem>
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
            <p className="text-sm text-gray-600">Total Documents</p>
            <p className="text-3xl font-bold text-indigo-600">{docsFiltres.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Uploads/Semaine</p>
            <p className="text-3xl font-bold text-purple-600">
              {(docsFiltres.length / Math.max(1, Object.keys(uploadsParSemaine).length)).toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Délai Moyen</p>
            <p className="text-3xl font-bold text-orange-600">{delaiMoyen}j</p>
            <p className="text-xs text-gray-500 mt-1">Après consultation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Type Principal</p>
            <p className="text-lg font-bold text-blue-600">
              {typeData[0]?.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{typeData[0]?.value || 0} documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploads par Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
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
            <CardTitle>Uploads par Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourcesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semaine" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="uploads" stroke="#6366F1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top uploaders */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisatrices les Plus Actives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topUploaders.map((u, idx) => (
              <div key={idx} className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                <Badge variant={idx < 3 ? 'default' : 'outline'} className="mb-2">#{idx + 1}</Badge>
                <p className="text-sm font-medium truncate">{u.patient}</p>
                <p className="text-2xl font-bold text-indigo-600">{u.count}</p>
                <p className="text-xs text-gray-500">documents</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}