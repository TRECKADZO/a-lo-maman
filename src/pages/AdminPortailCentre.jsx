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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-600" />
                {centre.nom}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-purple-100 text-purple-800">
                  {centre.type_etablissement.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  {centre.ville}, {centre.region}
                </Badge>
                {centre.actif && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                )}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Employés</p>
                    <p className="text-3xl font-bold text-purple-600">{statsRapides.total_membres}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {statsRapides.membres_actifs} actifs
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Services</p>
                    <p className="text-3xl font-bold text-blue-600">{statsRapides.services}</p>
                  </div>
                  <Activity className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">RDV ce mois</p>
                    <p className="text-3xl font-bold text-green-600">{statsRapides.rdv_mois}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Capacité</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {centre.capacite_lits || 'N/A'}
                    </p>
                    {centre.capacite_lits && (
                      <p className="text-xs text-gray-500 mt-1">lits</p>
                    )}
                  </div>
                  <TrendingUp className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="employes">
                <Users className="w-4 h-4 mr-2" />
                Employés
              </TabsTrigger>
              <TabsTrigger value="services">
                <Activity className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="statistiques">
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