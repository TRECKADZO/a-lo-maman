import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, AlertTriangle, Activity, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FHIRConfiguration from '../components/admin/FHIRConfiguration';

export default function AdminFHIR() {
  const [selectedCentreId, setSelectedCentreId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: centres = [], isLoading: centresLoading } = useQuery({
    queryKey: ['centres_fhir'],
    queryFn: () => base44.entities.Clinique.list(),
  });

  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ['audit_fhir'],
    queryFn: async () => {
      const derniers = await base44.entities.AuditFHIR.list('-timestamp', 100);
      return derniers;
    },
  });

  const { data: alertes = [], isLoading: alertesLoading } = useQuery({
    queryKey: ['alertes_fhir'],
    queryFn: async () => {
      const acti = await base44.entities.AlerteFHIR.filter({ statut: 'active' });
      return acti.sort((a, b) => {
        const severiteOrdre = { critique: 4, haute: 3, moyenne: 2, basse: 1 };
        return severiteOrdre[b.severite] - severiteOrdre[a.severite];
      });
    },
  });

  const centresFiltres = centres.filter(c =>
    c.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email_contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const centresAvecFHIR = centres.filter(c => c.api_fhir_enabled);
  const auditsSemaine = audits.filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const auditsEchecs = audits.filter(a => a.statut === 'echec');

  const getSeveriteColor = (severite) => {
    const colors = {
      critique: 'bg-red-100 text-red-800 border-red-300',
      haute: 'bg-orange-100 text-orange-800 border-orange-300',
      moyenne: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      basse: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severite] || colors.basse;
  };

  const getStatutColor = (statut) => {
    const colors = {
      succes: 'text-green-600',
      echec: 'text-red-600',
      avertissement: 'text-yellow-600',
    };
    return colors[statut] || 'text-gray-600';
  };

  const selectedCentre = centres.find(c => c.id === selectedCentreId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-600" />
            Gestion FHIR
          </h1>
          <p className="text-gray-600">Supervision des intégrations FHIR et sécurité des connexions</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{centresAvecFHIR.length}</p>
                <p className="text-sm text-gray-600 mt-2">Centres avec FHIR</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{auditsSemaine.length}</p>
                <p className="text-sm text-gray-600 mt-2">Appels cette semaine</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{alertes.length}</p>
                <p className="text-sm text-gray-600 mt-2">Alertes actives</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{auditsEchecs.length}</p>
                <p className="text-sm text-gray-600 mt-2">Erreurs détectées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes actives */}
        {alertes.length > 0 && (
          <Alert className="bg-red-50 border-red-300">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{alertes.length} alerte(s) de sécurité active(s)</strong> - Vérification immédiate recommandée
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="centres" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="centres">Centres</TabsTrigger>
            <TabsTrigger value="alertes">Alertes ({alertes.length})</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* Onglet Centres */}
          <TabsContent value="centres" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {centresLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Liste des centres */}
                <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
                  {centresFiltres.map(centre => (
                    <Card
                      key={centre.id}
                      className={`cursor-pointer transition-all ${
                        selectedCentreId === centre.id
                          ? 'border-blue-500 shadow-lg bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCentreId(centre.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{centre.nom}</p>
                            <p className="text-xs text-gray-600 truncate">{centre.email_contact}</p>
                          </div>
                          {centre.api_fhir_enabled ? (
                            <Badge className="bg-green-100 text-green-800 flex-shrink-0">
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 flex-shrink-0">
                              Inactif
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Détails du centre sélectionné */}
                {selectedCentre && (
                  <div className="lg:col-span-2">
                    <FHIRConfiguration
                      centre={selectedCentre}
                      onSave={() => setSelectedCentreId(null)}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Onglet Alertes */}
          <TabsContent value="alertes" className="space-y-4">
            {alertesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : alertes.length === 0 ? (
              <Card className="shadow-lg border-none">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune alerte active</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {alertes.map(alerte => (
                  <Card key={alerte.id} className={`shadow-lg border-none border-l-4 ${getSeveriteColor(alerte.severite).split(' ')[0]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeveriteColor(alerte.severite)}>
                              {alerte.severite}
                            </Badge>
                            <p className="font-semibold text-sm">{alerte.type_alerte.replace(/_/g, ' ')}</p>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alerte.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>Centre: {alerte.centre_nom}</span>
                            {alerte.ip_adresse && <span>IP: {alerte.ip_adresse}</span>}
                            <span>{alerte.tentatives} tentative(s)</span>
                          </div>
                          {alerte.actions_recommandees?.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                              <p className="font-semibold text-yellow-900 mb-1">Actions recommandées:</p>
                              <ul className="list-disc list-inside text-yellow-800">
                                {alerte.actions_recommandees.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Audit */}
          <TabsContent value="audit" className="space-y-4">
            {auditsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {audits.map(audit => (
                  <Card key={audit.id} className="shadow-sm border-none">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {audit.statut === 'succes' ? (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            )}
                            <p className="font-semibold text-sm">{audit.centre_nom}</p>
                            <Badge className={`text-xs ${audit.statut === 'succes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {audit.type_action}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {format(new Date(audit.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                          </p>
                          {audit.details?.message_erreur && (
                            <p className="text-xs text-red-600 mt-1">{audit.details.message_erreur}</p>
                          )}
                        </div>
                        {audit.details?.duree_ms && (
                          <div className="text-xs text-gray-600 flex-shrink-0">
                            {audit.details.duree_ms}ms
                          </div>
                        )}
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
  );
}