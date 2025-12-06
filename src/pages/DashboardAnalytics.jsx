import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  Download,
  BarChart3,
  CreditCard,
  Phone,
  Video,
  Building2,
  Percent,
  Target,
  MapPin,
  UserCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, eachDayOfInterval } from 'date-fns';
import {
  Line,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function DashboardAnalytics() {
  const [periode, setPeriode] = useState('mois_courant');
  const [typeVue, setTypeVue] = useState('vue_ensemble');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profilPro, isLoading: loadingPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user
  });

  // Calculer plage de dates selon période
  const getDateRange = () => {
    const now = new Date();
    switch(periode) {
      case 'mois_courant':
        return { debut: startOfMonth(now), fin: endOfMonth(now) };
      case 'mois_dernier':
        const lastMonth = subMonths(now, 1);
        return { debut: startOfMonth(lastMonth), fin: endOfMonth(lastMonth) };
      case 'annee_courante':
        return { debut: startOfYear(now), fin: endOfYear(now) };
      case '3_derniers_mois':
        return { debut: subMonths(now, 3), fin: now };
      default:
        return { debut: startOfMonth(now), fin: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  // Récupérer tous les RDV (pour taux de remplissage et performance)
  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rdv_analytics', profilPro?.id, periode],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.RendezVous.filter({
        professionnel_id: profilPro.id,
        date_rdv: {
          $gte: dateRange.debut.toISOString(),
          $lte: dateRange.fin.toISOString()
        }
      }, '-date_rdv');
    },
    enabled: !!profilPro
  });

  // Récupérer les patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients_analytics', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
    },
    enabled: !!profilPro
  });

  const { data: statistiques = [], isLoading } = useQuery({
    queryKey: ['statistiques', profilPro?.id, periode],
    queryFn: async () => {
      if (!profilPro) return [];
      const stats = await base44.entities.StatistiquesConsultation.filter({
        professionnel_id: profilPro.id,
        date_consultation: {
          $gte: dateRange.debut.toISOString(),
          $lte: dateRange.fin.toISOString()
        }
      }, '-date_consultation');
      return stats;
    },
    enabled: !!profilPro
  });

  const { data: ordonnances = [] } = useQuery({
    queryKey: ['ordonnances_pro', profilPro?.id, periode],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.Ordonnance.filter({
        professionnel_id: profilPro.id,
        date_prescription: {
          $gte: dateRange.debut.toISOString(),
          $lte: dateRange.fin.toISOString()
        }
      });
    },
    enabled: !!profilPro
  });

  const { data: donneesVitalesConsultees = [] } = useQuery({
    queryKey: ['donnees_vitales_stats', profilPro?.id, periode],
    queryFn: async () => {
      if (!profilPro) return [];
      const mesures = await base44.entities.DonneesVitales.filter({
        created_date: {
          $gte: dateRange.debut.toISOString(),
          $lte: dateRange.fin.toISOString()
        }
      });
      return mesures;
    },
    enabled: !!profilPro
  });

  // NOUVELLES MÉTRIQUES
  
  // 1. Taux de remplissage des RDV
  const calculerTauxRemplissage = () => {
    const joursOuvrables = eachDayOfInterval({
      start: dateRange.debut,
      end: dateRange.fin
    }).filter(jour => {
      const dayOfWeek = jour.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclure samedi et dimanche
    });

    const disponibilites = profilPro?.disponibilites || [];
    const creneauxDisponibles = joursOuvrables.length * disponibilites.length;
    const creneauxOccupes = rendezVous.filter(rdv => rdv.statut !== 'annule').length;

    return creneauxDisponibles > 0 
      ? ((creneauxOccupes / creneauxDisponibles) * 100).toFixed(1)
      : 0;
  };

  // 2. Performance par type de consultation
  const performanceParType = rendezVous
    .filter(rdv => rdv.statut !== 'annule')
    .reduce((acc, rdv) => {
      const type = rdv.type_consultation;
      if (!acc[type]) {
        acc[type] = { count: 0, revenus: 0, duree_moyenne: 0 };
      }
      acc[type].count++;
      
      const stat = statistiques.find(s => s.rendez_vous_id === rdv.id);
      if (stat) {
        acc[type].revenus += stat.montant_facture || 0;
        acc[type].duree_moyenne += stat.duree_minutes || 0;
      }
      return acc;
    }, {});

  Object.keys(performanceParType).forEach(type => {
    const data = performanceParType[type];
    data.duree_moyenne = data.count > 0 ? Math.round(data.duree_moyenne / data.count) : 0;
    data.revenu_moyen = data.count > 0 ? Math.round(data.revenus / data.count) : 0;
  });

  // 3. Démographie des patients
  const demographiePatients = {
    par_age: patients.reduce((acc, patient) => {
      const moisAge = Math.floor(
        (new Date() - new Date(patient.date_naissance)) / (1000 * 60 * 60 * 24 * 30)
      );
      const tranche = moisAge < 6 ? '0-6 mois' :
                      moisAge < 12 ? '6-12 mois' :
                      moisAge < 24 ? '1-2 ans' :
                      moisAge < 60 ? '2-5 ans' :
                      '5+ ans';
      acc[tranche] = (acc[tranche] || 0) + 1;
      return acc;
    }, {}),
    par_sexe: patients.reduce((acc, patient) => {
      acc[patient.sexe] = (acc[patient.sexe] || 0) + 1;
      return acc;
    }, {}),
    par_ville: patients.reduce((acc, patient) => {
      const ville = patient.ville || 'Non renseignée';
      acc[ville] = (acc[ville] || 0) + 1;
      return acc;
    }, {})
  };

  // Calculer les statistiques
  const stats = {
    consultations: {
      total: statistiques.length,
      terminees: rendezVous.filter(r => r.statut === 'termine').length,
      annulees: rendezVous.filter(r => r.statut === 'annule').length,
      taux_completion: rendezVous.length > 0 
        ? ((rendezVous.filter(r => r.statut === 'termine').length / rendezVous.length) * 100).toFixed(1)
        : 0,
      moyenne_duree: statistiques.length > 0 
        ? Math.round(statistiques.reduce((sum, s) => sum + s.duree_minutes, 0) / statistiques.length)
        : 0,
      par_type: statistiques.reduce((acc, s) => {
        acc[s.type_consultation] = (acc[s.type_consultation] || 0) + 1;
        return acc;
      }, {}),
      premiers_rdv: statistiques.filter(s => s.premier_rdv).length,
      suivis: statistiques.filter(s => s.suivi).length
    },
    revenus: {
      total: statistiques.reduce((sum, s) => sum + (s.montant_facture || 0), 0),
      par_mode: statistiques.reduce((acc, s) => {
        const mode = s.mode_paiement || 'paiement_direct';
        acc[mode] = (acc[mode] || 0) + (s.montant_facture || 0);
        return acc;
      }, {}),
      en_attente: statistiques.filter(s => s.statut_paiement === 'en_attente').length,
      payes: statistiques.filter(s => s.statut_paiement === 'paye').length,
      moyenne_consultation: statistiques.length > 0
        ? Math.round(statistiques.reduce((sum, s) => sum + (s.montant_facture || 0), 0) / statistiques.length)
        : 0
    },
    ordonnances: {
      total: ordonnances.length,
      actives: ordonnances.filter(o => o.statut === 'active').length,
      moyenne_medicaments: ordonnances.length > 0
        ? (ordonnances.reduce((sum, o) => sum + (o.medicaments?.length || 0), 0) / ordonnances.length).toFixed(1)
        : 0
    },
    monitoring: {
      total_mesures: donneesVitalesConsultees.length,
      patients_monitores: new Set(donneesVitalesConsultees.map(d => d.patient_email)).size,
      alertes: donneesVitalesConsultees.filter(d => d.alerte_declenchee).length
    },
    performance: {
      taux_remplissage: calculerTauxRemplissage(),
      nouveaux_patients: statistiques.filter(s => s.premier_rdv).length,
      taux_fidelisation: statistiques.length > 0
        ? ((statistiques.filter(s => s.suivi).length / statistiques.length) * 100).toFixed(1)
        : 0
    }
  };

  // Préparer données graphiques par jour
  const consultationsParJour = statistiques.reduce((acc, stat) => {
    const jour = format(new Date(stat.date_consultation), 'dd/MM');
    if (!acc[jour]) {
      acc[jour] = { jour, consultations: 0, revenus: 0, duree_moyenne: 0, count: 0 };
    }
    acc[jour].consultations += 1;
    acc[jour].revenus += stat.montant_facture || 0;
    acc[jour].duree_moyenne += stat.duree_minutes;
    acc[jour].count += 1;
    return acc;
  }, {});

  const graphConsultations = Object.values(consultationsParJour).map(item => ({
    ...item,
    duree_moyenne: Math.round(item.duree_moyenne / item.count)
  })).sort((a, b) => {
    const [dayA, monthA] = a.jour.split('/').map(Number);
    const [dayB, monthB] = b.jour.split('/').map(Number);
    return (monthA * 100 + dayA) - (monthB * 100 + dayB);
  });

  // Données pour graphique en camembert - types consultation
  const pieDataTypes = Object.entries(stats.consultations.par_type).map(([type, count]) => ({
    name: type === 'teleconsultation' ? 'Téléconsultation' : 
          type === 'telephone' ? 'Téléphone' :
          type === 'cabinet' ? 'Cabinet' :
          type === 'clinique' ? 'Clinique' : 'Hôpital',
    value: count
  }));

  // Données pour graphique revenus par mode
  const pieDataRevenus = Object.entries(stats.revenus.par_mode).map(([mode, montant]) => ({
    name: mode === 'cmu' ? 'CMU' :
          mode === 'assurance' ? 'Assurance' :
          mode === 'paiement_direct' ? 'Paiement direct' : 'Gratuit',
    value: montant
  }));

  // Données démographie - âge
  const pieDataAge = Object.entries(demographiePatients.par_age).map(([tranche, count]) => ({
    name: tranche,
    value: count
  }));

  // Données démographie - sexe
  const pieDataSexe = Object.entries(demographiePatients.par_sexe).map(([sexe, count]) => ({
    name: sexe === 'masculin' ? 'Garçons' : 'Filles',
    value: count
  }));

  // Données radar - performance par type
  const radarDataTypes = Object.entries(performanceParType).map(([type, data]) => ({
    type: type === 'teleconsultation' ? 'Télé' : 
          type === 'telephone' ? 'Tel' :
          type === 'cabinet' ? 'Cabinet' : type,
    consultations: data.count,
    revenus: data.revenu_moyen / 1000,
    satisfaction: 85 // À calculer avec des avis si disponibles
  }));

  if (loadingPro || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const exporterDonnees = () => {
    const csvContent = [
      ['Date', 'Consultations', 'Revenus', 'Durée moyenne'].join(','),
      ...graphConsultations.map(item => 
        [item.jour, item.consultations, item.revenus, item.duree_moyenne].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              Tableau de bord analytique
            </h1>
            <p className="text-gray-600 mt-1">
              Analysez vos performances et vos revenus en détail
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={exporterDonnees} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois_courant">Mois en cours</SelectItem>
                <SelectItem value="mois_dernier">Mois dernier</SelectItem>
                <SelectItem value="3_derniers_mois">3 derniers mois</SelectItem>
                <SelectItem value="annee_courante">Année en cours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-600">{stats.performance.taux_remplissage}%</Badge>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.consultations.total}</p>
              <p className="text-xs text-gray-600">Consultations</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {(stats.revenus.total / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-600">Revenus (FCFA)</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-500" />
                <UserCheck className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{patients.length}</p>
              <p className="text-xs text-gray-600">Patients suivis</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-orange-500" />
                <Badge className="bg-orange-600">{stats.consultations.taux_completion}%</Badge>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.consultations.terminees}</p>
              <p className="text-xs text-gray-600">Terminées</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Percent className="w-8 h-8 text-teal-500" />
                <Badge className="bg-teal-600">{stats.performance.taux_fidelisation}%</Badge>
              </div>
              <p className="text-2xl font-bold text-teal-600">{stats.consultations.suivis}</p>
              <p className="text-xs text-gray-600">Fidélité</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={typeVue} onValueChange={setTypeVue}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vue_ensemble">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="demographie">Démographie</TabsTrigger>
            <TabsTrigger value="revenus">Revenus</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="vue_ensemble" className="space-y-6">
            {/* Évolution consultations + revenus */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Évolution des consultations et revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={graphConsultations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenus" 
                      fill="#10b981" 
                      stroke="#10b981"
                      fillOpacity={0.3}
                      name="Revenus (FCFA)"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="consultations" 
                      fill="#8b5cf6" 
                      name="Consultations"
                      radius={[8, 8, 0, 0]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="duree_moyenne" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Durée (min)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Types de consultation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieDataTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieDataTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Taux de remplissage */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Indicateurs clés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Taux de remplissage</span>
                      <span className="text-2xl font-bold text-blue-600">{stats.performance.taux_remplissage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                        style={{ width: `${stats.performance.taux_remplissage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Taux de complétion</span>
                      <span className="text-2xl font-bold text-green-600">{stats.consultations.taux_completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                        style={{ width: `${stats.consultations.taux_completion}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Taux de fidélisation</span>
                      <span className="text-2xl font-bold text-purple-600">{stats.performance.taux_fidelisation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all"
                        style={{ width: `${stats.performance.taux_fidelisation}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Performance */}
          <TabsContent value="performance" className="space-y-6">
            {/* Radar performance par type */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Performance par type de consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarDataTypes}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" />
                    <PolarRadiusAxis />
                    <Radar name="Consultations" dataKey="consultations" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Radar name="Revenus (k FCFA)" dataKey="revenus" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Détails par type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(performanceParType).map(([type, data]) => {
                const Icon = type === 'teleconsultation' ? Video :
                            type === 'telephone' ? Phone :
                            type === 'cabinet' ? Building2 : Building2;
                            
                return (
                  <Card key={type} className="shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type === 'teleconsultation' ? 'Téléconsultation' : 
                         type === 'telephone' ? 'Téléphone' :
                         type === 'cabinet' ? 'Cabinet' : type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Consultations</p>
                        <p className="text-2xl font-bold text-purple-600">{data.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Revenu moyen</p>
                        <p className="text-xl font-bold text-green-600">{data.revenu_moyen.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Durée moyenne</p>
                        <p className="text-lg font-bold text-blue-600">{data.duree_moyenne} min</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Onglet Démographie */}
          <TabsContent value="demographie" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Répartition par âge */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Répartition par âge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieDataAge}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieDataAge.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition par sexe */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Répartition par sexe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieDataSexe}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Répartition géographique */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Répartition géographique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(demographiePatients.par_ville)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([ville, count]) => (
                      <div key={ville} className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                        <p className="text-xs text-gray-600 mb-1">{ville}</p>
                        <p className="text-2xl font-bold text-teal-600">{count}</p>
                        <p className="text-xs text-gray-500">patients</p>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Revenus */}
          <TabsContent value="revenus" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenu total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.revenus.total.toLocaleString()} FCFA
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Revenu moyen / consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.revenus.moyenne_consultation.toLocaleString()} FCFA
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Paiements en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-orange-600">{stats.revenus.en_attente}</p>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      En attente
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique revenus évolution */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={graphConsultations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenus" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Revenus (FCFA)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique répartition revenus par mode */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Répartition par mode de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieDataRevenus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${(value/1000).toFixed(0)}k FCFA`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieDataRevenus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {Object.entries(stats.revenus.par_mode).map(([mode, montant]) => (
                    <div key={mode} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 capitalize">
                        {mode === 'cmu' ? 'CMU' :
                         mode === 'assurance' ? 'Assurance' :
                         mode === 'paiement_direct' ? 'Paiement direct' : 'Gratuit'}
                      </p>
                      <p className="text-lg font-bold">{montant.toLocaleString()} FCFA</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}