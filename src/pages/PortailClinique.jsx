import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Users, TrendingUp, FileText, Settings, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AuthGuard from '../components/auth/AuthGuard';
import GestionAPIKeys from '../components/clinique/GestionAPIKeys';

export default function PortailClinique() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cliniques = [] } = useQuery({
    queryKey: ['cliniques', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Clinique.filter({
        administrateurs: { $in: [user.email] }
      });
    },
    enabled: !!user,
  });

  const clinique = cliniques[0];

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels_clinique', clinique?.id],
    queryFn: async () => {
      if (!clinique?.professionnels_ids) return [];
      return await base44.entities.Professionnel.list();
    },
    enabled: !!clinique,
  });

  const proClinique = professionnels.filter(p => 
    clinique?.professionnels_ids?.includes(p.id)
  );

  const { data: rdvMois = [] } = useQuery({
    queryKey: ['rdv_mois', clinique?.id],
    queryFn: async () => {
      if (!clinique) return [];
      const debut = new Date();
      debut.setDate(1);
      const rdvs = await base44.entities.RendezVous.list('-date_rdv', 1000);
      return rdvs.filter(r => 
        proClinique.some(p => p.id === r.professionnel_id) &&
        new Date(r.date_rdv) >= debut
      );
    },
    enabled: !!clinique && proClinique.length > 0,
  });

  if (!clinique) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Accès Clinique Requis</h2>
              <p className="text-gray-600">
                Vous devez être administrateur d'une clinique partenaire pour accéder à ce portail.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  const stats = {
    professionnels: proClinique.length,
    consultations: rdvMois.filter(r => r.statut === 'termine').length,
    rdv_planifies: rdvMois.filter(r => ['planifie', 'confirme'].includes(r.statut)).length,
    taux_occupation: clinique.taux_occupation || 0
  };

  const rdvParJour = rdvMois.reduce((acc, rdv) => {
    const date = new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(rdvParJour).map(([date, count]) => ({
    date,
    consultations: count
  }));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                {clinique.nom}
              </h1>
              <div className="flex gap-2 mt-2">
                <Badge>{clinique.type_etablissement.replace(/_/g, ' ')}</Badge>
                <Badge variant="outline">{clinique.ville}, {clinique.region}</Badge>
                {clinique.api_fhir_enabled && (
                  <Badge className="bg-green-100 text-green-800">FHIR Activé</Badge>
                )}
              </div>
            </div>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Professionnels</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.professionnels}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Consultations (mois)</p>
                    <p className="text-3xl font-bold text-green-600">{stats.consultations}</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">RDV Planifiés</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.rdv_planifies}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux Occupation</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.taux_occupation}%</p>
                  </div>
                  <FileText className="w-10 h-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="professionnels">Professionnels</TabsTrigger>
              <TabsTrigger value="rapports">Rapports</TabsTrigger>
              <TabsTrigger value="integration">Intégration FHIR</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activité du Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="consultations" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professionnels">
              <Card>
                <CardHeader>
                  <CardTitle>Professionnels Attachés ({proClinique.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {proClinique.map(pro => (
                      <div key={pro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{pro.nom_complet?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{pro.nom_complet}</p>
                            <p className="text-sm text-gray-600">{pro.specialite?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <Badge>{rdvMois.filter(r => r.professionnel_id === pro.id).length} RDV</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rapports">
              <Card>
                <CardHeader>
                  <CardTitle>Rapports & Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Générez des rapports pour le Ministère de la Santé, les assurances ou à usage interne.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Générer Rapport MSP
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration">
              <GestionAPIKeys clinique={clinique} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}