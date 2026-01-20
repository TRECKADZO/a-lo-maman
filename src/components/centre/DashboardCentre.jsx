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
  DollarSign
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-600" />
              {centre.nom}
            </h1>
            <p className="text-gray-600 mt-1">{centre.ville}, {centre.region}</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            ✓ Centre Validé
          </Badge>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.rdv_aujourdhui || 0}</p>
                  <p className="text-sm text-gray-600">RDV aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.employes_actifs || 0}</p>
                  <p className="text-sm text-gray-600">Employés actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.taux_occupation || 0}%</p>
                  <p className="text-sm text-gray-600">Taux occupation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{(statistiques?.revenu_mois || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Revenu mois (FCFA)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.patients_uniques || 0}</p>
                  <p className="text-sm text-gray-600">Patients uniques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code d'invitation */}
        <CodeInvitationCentre centre={centre} />

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={() => setShowEditProfile(true)}
                variant="outline" 
                className="h-20 flex-col gap-2"
              >
                <Edit className="w-6 h-6" />
                Compléter profil
              </Button>
              <Button 
                onClick={() => window.open(createPageUrl('ProfilCentrePublic') + '?id=' + centre.id, '_blank')}
                variant="outline" 
                className="h-20 flex-col gap-2"
              >
                <Eye className="w-6 h-6" />
                Profil public
              </Button>
              <Button asChild className="h-20 flex-col gap-2">
                <Link to={createPageUrl('CalendrierCentre')}>
                  <Calendar className="w-6 h-6" />
                  Calendrier
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={createPageUrl('Parametres')}>
                  <Settings className="w-6 h-6" />
                  Paramètres
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="employes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="employes">
              <Users className="w-4 h-4 mr-2" />
              Employés
            </TabsTrigger>
            <TabsTrigger value="services">
              <Activity className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="statistiques">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="configuration">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="calendrier">
              <Calendar className="w-4 h-4 mr-2" />
              Calendrier
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