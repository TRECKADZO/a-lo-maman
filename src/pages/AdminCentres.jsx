import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, AlertTriangle, CheckCircle, Building2, Radio, Filter, ChevronDown } from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';
import EditerCentre from '../components/admin/EditerCentre';
import DashboardCentres from '../components/admin/DashboardCentres';
import FiltresAvances from '../components/admin/FiltresAvances';
import CarteCentre from '../components/admin/CarteCentre';
import StatutIntegrations from '../components/admin/StatutIntegrations';

export default function AdminCentres() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [filterType, setFilterType] = useState('tous');
  const [filterFHIR, setFilterFHIR] = useState('tous');
  const [filterRegion, setFilterRegion] = useState('tous');
  const [showDetails, setShowDetails] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cliniques = [], isLoading: cliniquesLoading } = useQuery({
    queryKey: ['cliniques'],
    queryFn: () => base44.entities.Clinique.list(),
  });

  const { data: centresTeleEcho = [], isLoading: ecoLoading } = useQuery({
    queryKey: ['centres_teleecho'],
    queryFn: () => base44.entities.CentreTeleEchographie.list(),
  });

  // Extraire toutes les régions uniques
  const allRegions = Array.from(
    new Set([
      ...cliniques.map(c => c.region),
      ...centresTeleEcho.map(c => c.region)
    ])
  ).filter(Boolean);

  const filteredCliniques = cliniques.filter(c => {
    const matchSearch = c.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.email_contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.ville?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || c.statut_validation === filterStatut;
    const matchFHIR = filterFHIR === 'tous' || (filterFHIR === 'enabled' ? c.api_fhir_enabled : !c.api_fhir_enabled);
    const matchRegion = filterRegion === 'tous' || c.region === filterRegion;
    return matchSearch && matchStatut && matchFHIR && matchRegion;
  });

  const filteredEcho = centresTeleEcho.filter(c => {
    const matchSearch = c.nom_centre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.email_contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.ville?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || (filterStatut === 'actif' ? c.actif : !c.actif);
    const matchRegion = filterRegion === 'tous' || c.region === filterRegion;
    return matchSearch && matchStatut && matchRegion;
  });

  // Vérifier que l'utilisateur est admin
  if (!userLoading && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Alert className="max-w-md bg-red-50 border-red-300">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800 mt-2">
            <strong>Accès refusé.</strong> Seuls les administrateurs peuvent accéder à cette section.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userLoading || cliniquesLoading || ecoLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (selectedCentre) {
    return (
      <EditerCentre 
        centre={selectedCentre} 
        onBack={() => setSelectedCentre(null)}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['cliniques'] });
          queryClient.invalidateQueries({ queryKey: ['centres_teleecho'] });
          setSelectedCentre(null);
        }}
      />
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Building2 className="w-10 h-10 text-indigo-600" />
              Gestion des Centres
            </h1>
            <p className="text-gray-600">Administrez tous les centres de santé et télé-échographie</p>
          </div>

          {/* Dashboard with KPIs */}
          <DashboardCentres cliniques={cliniques} centresTeleEcho={centresTeleEcho} />

          {/* Advanced Filters */}
          <FiltresAvances
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatut={filterStatut}
            onStatutChange={setFilterStatut}
            filterType={filterType}
            onTypeChange={setFilterType}
            filterFHIR={filterFHIR}
            onFHIRChange={setFilterFHIR}
            filterRegion={filterRegion}
            onRegionChange={setFilterRegion}
            regions={allRegions}
            onReset={() => {
              setSearchQuery('');
              setFilterStatut('tous');
              setFilterType('tous');
              setFilterFHIR('tous');
              setFilterRegion('tous');
            }}
          />

          {/* Tabs */}
          <Tabs defaultValue="cliniques" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
              <TabsTrigger value="cliniques" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cliniques ({filteredCliniques.length})
              </TabsTrigger>
              <TabsTrigger value="teleecho" className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Télé-Échographie ({filteredEcho.length})
              </TabsTrigger>
            </TabsList>

            {/* Cliniques */}
            <TabsContent value="cliniques">
              {filteredCliniques.length === 0 ? (
                <Card className="shadow-lg border-none">
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune clinique trouvée</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCliniques.map(clinique => (
                    <CarteCentre
                      key={clinique.id}
                      centre={clinique}
                      onEdit={(centre) => setSelectedCentre({ ...centre, type: 'clinique' })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Télé-Échographie */}
            <TabsContent value="teleecho">
              {filteredEcho.length === 0 ? (
                <Card className="shadow-lg border-none">
                  <CardContent className="py-12 text-center">
                    <Radio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun centre télé-échographie trouvé</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEcho.map(centre => (
                    <CarteCentre
                      key={centre.id}
                      centre={centre}
                      onEdit={(c) => setSelectedCentre({ ...c, type: 'teleecho' })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}