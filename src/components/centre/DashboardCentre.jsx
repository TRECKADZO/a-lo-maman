import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Calendar,
  FileText,
  Shield,
  Settings,
  TrendingUp,
  Activity,
  Clock,
  Edit,
  Eye,
  BarChart3,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GestionEmployesCentre from './GestionEmployesCentre';
import GestionServicesCentre from './GestionServicesCentre';
import StatistiquesCentre from './StatistiquesCentre';
import EditerProfilCentre from './EditerProfilCentre';
import CodeInvitationCentre from './CodeInvitationCentre';

export default function DashboardCentre({ centre }) {
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { data: membres = [] } = useQuery({
    queryKey: ['membres_centre', centre.id],
    queryFn: () => base44.entities.MembreCentre.filter({ centre_id: centre.id }),
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['rdv_centre', centre.id],
    queryFn: () => base44.entities.RendezVousAdministratif.filter({ centre_id: centre.id }),
  });

  const { data: statistiques } = useQuery({
    queryKey: ['stats_centre', centre.id],
    queryFn: async () => {
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      const rdvMois = rdvs.filter(r => {
        const date = new Date(r.date_rdv);
        return date.getMonth() === aujourdhui.getMonth() && 
               date.getFullYear() === aujourdhui.getFullYear();
      });

      const revenuEstime = rdvMois.filter(r => r.statut === 'termine').reduce((sum, r) => sum + (r.montant || 0), 0);

      return {
        rdv_total: rdvs.length,
        rdv_aujourdhui: rdvs.filter(r => {
          const date = new Date(r.date_rdv);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === aujourdhui.getTime() && r.statut !== 'annule';
        }).length,
        rdv_semaine: rdvs.filter(r => {
          const date = new Date(r.date_rdv);
          const diff = Math.floor((date - aujourdhui) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff < 7 && r.statut !== 'annule';
        }).length,
        patients_uniques: new Set(rdvs.map(r => r.patient_email)).size,
        revenu_mois: revenuEstime,
        taux_occupation: centre.taux_occupation || 0,
        employes_actifs: membres.filter(m => m.statut === 'actif').length
      };
    },
    enabled: rdvs.length > 0
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header avec design moderne */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <Building2 className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
                  {centre.nom}
                </h1>
                <p className="text-purple-100 flex items-center gap-2 text-lg">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  {centre.ville}, {centre.region}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Centre Validé
              </Badge>
              <Badge className="bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <Activity className="w-4 h-4 mr-1.5" />
                Actif
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistiques avec animations et gradients */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-400 opacity-50" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{statistiques?.rdv_aujourdhui || 0}</p>
                  <p className="text-sm font-medium text-gray-600">RDV aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-indigo-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Activity className="w-5 h-5 text-purple-400 opacity-50" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{statistiques?.employes_actifs || 0}</p>
                  <p className="text-sm font-medium text-gray-600">Employés actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-amber-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <BarChart3 className="w-5 h-5 text-orange-400 opacity-50" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{statistiques?.taux_occupation || 0}%</p>
                  <p className="text-sm font-medium text-gray-600">Taux occupation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-green-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-400 opacity-50" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{(statistiques?.revenu_mois || 0).toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-600">Revenu (FCFA)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <Users className="w-5 h-5 text-rose-400 opacity-50" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{statistiques?.patients_uniques || 0}</p>
                  <p className="text-sm font-medium text-gray-600">Patients uniques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code d'invitation */}
        <CodeInvitationCentre centre={centre} />

        {/* Actions rapides avec design moderne */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setShowEditProfile(true)}
                variant="outline" 
                className="h-24 flex-col gap-3 border-2 hover:border-purple-600 hover:bg-purple-50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Modifier profil</span>
              </Button>
              <Button 
                onClick={() => window.open(createPageUrl('ProfilCentrePublic') + '?id=' + centre.id, '_blank')}
                variant="outline" 
                className="h-24 flex-col gap-3 border-2 hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Profil public</span>
              </Button>
              <Button 
                asChild 
                className="h-24 flex-col gap-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link to={createPageUrl('CalendrierCentre')}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">Calendrier</span>
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="h-24 flex-col gap-3 border-2 hover:border-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all duration-300 group"
              >
                <Link to={createPageUrl('Parametres')}>
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium">Paramètres</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs avec design professionnel */}
        <Tabs defaultValue="employes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-lg border-0 h-auto">
            <TabsTrigger 
              value="employes" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Employés</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="statistiques"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="configuration"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendrier"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Agenda</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employes">
            <GestionEmployesCentre centre={centre} />
          </TabsContent>

          <TabsContent value="services">
            <GestionServicesCentre centre={centre} />
          </TabsContent>

          <TabsContent value="statistiques">
            <StatistiquesCentre centre={centre} rdvs={rdvs} membres={membres} />
          </TabsContent>

          <TabsContent value="configuration">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Configuration du Centre
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setShowEditProfile(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier les informations du centre
                </Button>
                
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Nom du centre</p>
                    <p className="font-semibold">{centre.nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold">{centre.type_etablissement?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-semibold">{centre.adresse}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ville / Région</p>
                    <p className="font-semibold">{centre.ville}, {centre.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-semibold">{centre.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{centre.email_contact}</p>
                  </div>
                  {centre.numero_agrement && (
                    <div>
                      <p className="text-sm text-gray-600">N° Agrément MSP</p>
                      <p className="font-semibold">{centre.numero_agrement}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Capacité</p>
                    <p className="font-semibold">{centre.capacite_lits || 'Non définie'} lits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendrier">
            <Card>
              <CardHeader>
                <CardTitle>Calendrier des Rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link to={createPageUrl('CalendrierCentre')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Voir le calendrier complet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal édition profil */}
        {showEditProfile && (
          <EditerProfilCentre 
            centre={centre} 
            onClose={() => setShowEditProfile(false)} 
          />
        )}
      </div>
    </div>
  );
}