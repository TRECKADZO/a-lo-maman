import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Activity,
  Download,
  FileText,
  DollarSign
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportingClinique({ cliniqueId }) {
  const [periode, setPeriode] = useState('mois');
  const [exportFormat, setExportFormat] = useState('csv');

  // Calcul dates période
  const getDateRange = () => {
    const now = new Date();
    switch (periode) {
      case 'semaine':
        return { start: subDays(now, 7), end: now };
      case 'mois':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'trimestre':
        return { start: subMonths(now, 3), end: now };
      case 'annee':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  // Fetch données
  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rdv_clinique_reporting', cliniqueId, periode],
    queryFn: async () => {
      const rdvs = await base44.entities.RendezVous.list();
      const pros = await base44.entities.Professionnel.list();
      const proClinique = pros.filter(p => p.structure_sante === cliniqueId);
      const proIds = proClinique.map(p => p.id);
      return rdvs.filter(r => {
        const rdvDate = new Date(r.date_rdv);
        return proIds.includes(r.professionnel_id) && 
               rdvDate >= dateRange.start && 
               rdvDate <= dateRange.end;
      });
    },
    enabled: !!cliniqueId
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['pros_reporting', cliniqueId],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.list();
      return pros.filter(p => p.structure_sante === cliniqueId);
    },
    enabled: !!cliniqueId
  });

  // Calculs KPIs
  const stats = useMemo(() => {
    const totalRdv = rendezVous.length;
    const rdvTermines = rendezVous.filter(r => r.statut === 'termine').length;
    const rdvAnnules = rendezVous.filter(r => r.statut === 'annule').length;
    const tauxOccupation = totalRdv > 0 ? ((rdvTermines / totalRdv) * 100).toFixed(1) : 0;
    const tauxAnnulation = totalRdv > 0 ? ((rdvAnnules / totalRdv) * 100).toFixed(1) : 0;

    // Temps d'attente moyen (simulé - différence entre date de création et RDV)
    const tempsAttenteMoyen = rendezVous.length > 0
      ? rendezVous.reduce((acc, rdv) => {
          const createdAt = new Date(rdv.created_date);
          const rdvDate = new Date(rdv.date_rdv);
          const diff = Math.max(0, (rdvDate - createdAt) / (1000 * 60 * 60 * 24)); // jours
          return acc + diff;
        }, 0) / rendezVous.length
      : 0;

    return {
      totalRdv,
      rdvTermines,
      rdvAnnules,
      tauxOccupation,
      tauxAnnulation,
      tempsAttenteMoyen: tempsAttenteMoyen.toFixed(1)
    };
  }, [rendezVous]);

  // Consultations par spécialité
  const dataParSpecialite = useMemo(() => {
    const counts = {};
    rendezVous.forEach(rdv => {
      const pro = professionnels.find(p => p.id === rdv.professionnel_id);
      const specialite = pro?.specialite || 'Non spécifié';
      counts[specialite] = (counts[specialite] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rendezVous, professionnels]);

  // Consultations par type
  const dataParType = useMemo(() => {
    const counts = {};
    rendezVous.forEach(rdv => {
      counts[rdv.type_consultation] = (counts[rdv.type_consultation] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rendezVous]);

  // Evolution consultations (par jour)
  const dataEvolution = useMemo(() => {
    const grouped = {};
    rendezVous.forEach(rdv => {
      const date = format(new Date(rdv.date_rdv), 'dd/MM');
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }, [rendezVous]);

  // Performances par professionnel
  const dataParProfessionnel = useMemo(() => {
    const counts = {};
    rendezVous.forEach(rdv => {
      const pro = professionnels.find(p => p.id === rdv.professionnel_id);
      const nom = pro?.nom_complet || 'Non spécifié';
      if (!counts[nom]) {
        counts[nom] = { total: 0, termines: 0, annules: 0 };
      }
      counts[nom].total += 1;
      if (rdv.statut === 'termine') counts[nom].termines += 1;
      if (rdv.statut === 'annule') counts[nom].annules += 1;
    });
    return Object.entries(counts).map(([nom, data]) => ({
      nom,
      ...data,
      tauxReussite: data.total > 0 ? ((data.termines / data.total) * 100).toFixed(1) : 0
    }));
  }, [rendezVous, professionnels]);

  // Export
  const handleExport = () => {
    if (exportFormat === 'csv') {
      const csv = [
        ['Indicateur', 'Valeur'],
        ['Total RDV', stats.totalRdv],
        ['RDV terminés', stats.rdvTermines],
        ['RDV annulés', stats.rdvAnnules],
        ['Taux occupation', `${stats.tauxOccupation}%`],
        ['Taux annulation', `${stats.tauxAnnulation}%`],
        ['Temps attente moyen', `${stats.tempsAttenteMoyen} jours`],
        [],
        ['Consultations par spécialité'],
        ['Spécialité', 'Nombre'],
        ...dataParSpecialite.map(d => [d.name, d.value])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_clinique_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Période</Label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semaine">7 derniers jours</SelectItem>
                  <SelectItem value="mois">Mois en cours</SelectItem>
                  <SelectItem value="trimestre">3 derniers mois</SelectItem>
                  <SelectItem value="annee">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format export</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} className="bg-green-600 mt-6">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRdv}</p>
                <p className="text-xs text-gray-600">Total RDV</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.rdvTermines}</p>
                <p className="text-xs text-gray-600">Terminés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.tauxOccupation}%</p>
                <p className="text-xs text-gray-600">Taux occupation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.rdvAnnules}</p>
                <p className="text-xs text-gray-600">Annulés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.tauxAnnulation}%</p>
                <p className="text-xs text-gray-600">Taux annulation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-teal-500" />
              <div>
                <p className="text-2xl font-bold">{stats.tempsAttenteMoyen}</p>
                <p className="text-xs text-gray-600">Jours d'attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consultations par spécialité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataParSpecialite}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par type de consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataParType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataParType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Performances par professionnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataParProfessionnel.map((pro, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{pro.nom}</p>
                    <Badge className="bg-green-100 text-green-800">
                      {pro.tauxReussite}% réussite
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Total: {pro.total}</span>
                    <span>Terminés: {pro.termines}</span>
                    <span>Annulés: {pro.annules}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}