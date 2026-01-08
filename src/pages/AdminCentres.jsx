import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, AlertTriangle, CheckCircle, Building2, Radio, Filter } from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';
import EditerCentre from '../components/admin/EditerCentre';

export default function AdminCentres() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [filterType, setFilterType] = useState('tous');

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

  const filteredCliniques = cliniques.filter(c => {
    const matchSearch = c.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.email_contact?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || c.statut_validation === filterStatut;
    return matchSearch && matchStatut;
  });

  const filteredEcho = centresTeleEcho.filter(c => {
    const matchSearch = c.nom_centre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.email_contact?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || c.actif;
    return matchSearch && matchStatut;
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

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-lg border-none">
              <CardContent className="pt-6">
                <p className="text-gray-600 text-sm">Cliniques totales</p>
                <p className="text-3xl font-bold text-indigo-600">{cliniques.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardContent className="pt-6">
                <p className="text-gray-600 text-sm">Centres télé-écho</p>
                <p className="text-3xl font-bold text-purple-600">{centresTeleEcho.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardContent className="pt-6">
                <p className="text-gray-600 text-sm">En attente d'approbation</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {cliniques.filter(c => c.statut_validation === 'en_attente').length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardContent className="pt-6">
                <p className="text-gray-600 text-sm">Approuvés</p>
                <p className="text-3xl font-bold text-green-600">
                  {cliniques.filter(c => c.statut_validation === 'approuve').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-none">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 outline-none"
                    />
                  </div>
                </div>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="approuve">Approuvé</option>
                  <option value="rejete">Rejeté</option>
                </select>
              </div>
            </CardContent>
          </Card>

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
                <div className="space-y-4">
                  {filteredCliniques.map(clinique => (
                    <Card key={clinique.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{clinique.nom}</h3>
                              <Badge 
                                className={
                                  clinique.statut_validation === 'approuve' 
                                    ? 'bg-green-100 text-green-800' 
                                    : clinique.statut_validation === 'en_attente'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {clinique.statut_validation}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {clinique.type_etablissement?.replace(/_/g, ' ')} • {clinique.ville}, {clinique.region}
                            </p>
                            <p className="text-sm text-gray-600">{clinique.email_contact}</p>
                            {clinique.services_offerts?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {clinique.services_offerts.slice(0, 3).map((service, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {service.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                                {clinique.services_offerts.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{clinique.services_offerts.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => setSelectedCentre({ ...clinique, type: 'clinique' })}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Éditer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
                <div className="space-y-4">
                  {filteredEcho.map(centre => (
                    <Card key={centre.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{centre.nom_centre}</h3>
                              <Badge 
                                className={centre.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              >
                                {centre.actif ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {centre.type_etablissement?.replace(/_/g, ' ')} • {centre.ville}, {centre.region}
                            </p>
                            <p className="text-sm text-gray-600">{centre.email_contact}</p>
                            {centre.types_echographie?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {centre.types_echographie.map((type, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {type.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => setSelectedCentre({ ...centre, type: 'teleecho' })}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Éditer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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