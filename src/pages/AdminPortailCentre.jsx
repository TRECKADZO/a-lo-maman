import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Users, Activity, TrendingUp, Settings, 
  UserPlus, Edit, Trash2, Calendar, FileText, 
  BarChart3, Loader2, AlertCircle, CheckCircle,
  Clock, Shield, Mail, Phone, MapPin
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GestionEmployesCentre from '../components/centre/GestionEmployesCentre';
import GestionServicesCentre from '../components/centre/GestionServicesCentre';
import StatistiquesCentre from '../components/centre/StatistiquesCentre';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPortailCentre() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: centre, isLoading } = useQuery({
    queryKey: ['mon_centre', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const centres = await base44.entities.Clinique.filter({
        administrateurs: { $in: [user.email] }
      });
      return centres[0] || null;
    },
    enabled: !!user,
  });

  const { data: membres = [] } = useQuery({
    queryKey: ['membres_centre', centre?.id],
    queryFn: async () => {
      if (!centre) return [];
      return await base44.entities.MembreCentre.filter({
        centre_id: centre.id
      });
    },
    enabled: !!centre,
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['rdv_centre', centre?.id],
    queryFn: async () => {
      if (!centre) return [];
      return await base44.entities.RendezVousAdministratif.filter({
        centre_id: centre.id
      });
    },
    enabled: !!centre,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucun centre trouvé</h2>
            <p className="text-gray-600">
              Vous devez être administrateur d'un centre de santé pour accéder à ce portail.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsRapides = {
    total_membres: membres.length,
    membres_actifs: membres.filter(m => m.statut === 'actif').length,
    rdv_mois: rdvs.filter(r => {
      const date = new Date(r.date_rdv);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    services: centre.services_offerts?.length || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
      <div className="p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header professionnel de classe mondiale */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-10 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                  <Building2 className="w-11 h-11 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {centre.nom}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm px-3 py-1.5 text-sm">
                      {centre.type_etablissement.replace(/_/g, ' ')}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-white/90">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{centre.ville}, {centre.region}</span>
                    </div>
                    {centre.actif && (
                      <Badge className="bg-green-500/30 text-green-100 border-green-400/40 backdrop-blur-sm px-3 py-1.5 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                        Actif
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerte si centre suspendu */}
          {!centre.actif && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Centre suspendu</strong> - Votre centre a été suspendu. 
                {centre.raison_suspension && ` Raison: ${centre.raison_suspension}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards premium */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-white hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Employés</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {statsRapides.total_membres}
                  </p>
                  <p className="text-xs text-gray-500">
                    {statsRapides.membres_actifs} actifs
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-white hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Services</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {statsRapides.services}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-white hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">RDV ce mois</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {statsRapides.rdv_mois}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-orange-50 via-amber-50 to-white hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Capacité</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-1">
                    {centre.capacite_lits || 'N/A'}
                  </p>
                  {centre.capacite_lits && (
                    <p className="text-xs text-gray-500">lits disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs moderne */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border-0 h-auto">
              <TabsTrigger 
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl py-3.5 transition-all duration-300 data-[state=active]:shadow-lg font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="employes"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl py-3.5 transition-all duration-300 data-[state=active]:shadow-lg font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Employés
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl py-3.5 transition-all duration-300 data-[state=active]:shadow-lg font-medium"
              >
                <Activity className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="statistiques"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-xl py-3.5 transition-all duration-300 data-[state=active]:shadow-lg font-medium"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Statistiques
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Overview */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du Centre</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Établissement</p>
                        <p className="font-medium">{centre.nom}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Adresse</p>
                        <p className="font-medium">{centre.adresse}</p>
                        <p className="text-sm text-gray-500">{centre.ville}, {centre.region}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium">{centre.telephone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{centre.email_contact}</p>
                      </div>
                    </div>
                    {centre.numero_agrement && (
                      <div className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">N° Agrément MSP</p>
                          <p className="font-medium">{centre.numero_agrement}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Services Offerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {centre.services_offerts?.map((service, idx) => (
                        <Badge key={idx} variant="outline" className="justify-center py-2">
                          {service.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rdvs.slice(0, 5).map((rdv, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{rdv.patient_nom}</p>
                          <p className="text-sm text-gray-600">{rdv.type_consultation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
                          </p>
                          <Badge className={
                            rdv.statut === 'termine' ? 'bg-green-100 text-green-800' :
                            rdv.statut === 'confirme' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {rdv.statut}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gestion Employés */}
            <TabsContent value="employes">
              <GestionEmployesCentre centre={centre} />
            </TabsContent>

            {/* Gestion Services */}
            <TabsContent value="services">
              <GestionServicesCentre centre={centre} />
            </TabsContent>

            {/* Statistiques */}
            <TabsContent value="statistiques">
              <StatistiquesCentre centre={centre} rdvs={rdvs} membres={membres} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}