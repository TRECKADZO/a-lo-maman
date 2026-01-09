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
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GestionUtilisateursCentre from './GestionUtilisateursCentre';
import EditerProfilCentre from './EditerProfilCentre';

export default function DashboardCentre({ centre }) {
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { data: statistiques } = useQuery({
    queryKey: ['stats_centre', centre.id],
    queryFn: async () => {
      // Récupérer les rendez-vous du centre
      const rdvs = await base44.entities.RendezVousAdministratif.filter({
        centre_id: centre.id
      });

      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

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
        patients_uniques: new Set(rdvs.map(r => r.patient_email)).size
      };
    }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.rdv_semaine || 0}</p>
                  <p className="text-sm text-gray-600">RDV cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.patients_uniques || 0}</p>
                  <p className="text-sm text-gray-600">Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{statistiques?.rdv_total || 0}</p>
                  <p className="text-sm text-gray-600">Total RDV</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                <Link to={createPageUrl('AdminCentres')}>
                  <Calendar className="w-6 h-6" />
                  Gérer RDV
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
        <Tabs defaultValue="utilisateurs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="utilisateurs">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="services">
              <Activity className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="utilisateurs">
            <GestionUtilisateursCentre centre={centre} />
          </TabsContent>

          <TabsContent value="services">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Services offerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  {centre.services_offerts?.map(service => (
                    <div key={service} className="p-3 border rounded-lg bg-purple-50">
                      <p className="font-medium">{service.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
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