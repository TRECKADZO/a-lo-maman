import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Network,
  Database,
  FileText,
  Activity,
  Shield,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Share2,
  Lock
} from 'lucide-react';

export default function DashboardInterop() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: interopRecords = [] } = useQuery({
    queryKey: ['interop_records', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.StandardInterop.filter({ patient_email: user.email });
    },
    enabled: !!user,
  });

  const { data: registreDocuments = [] } = useQuery({
    queryKey: ['registre_documents', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RegistreDocuments.filter({ patient_email: user.email });
    },
    enabled: !!user,
  });

  const { data: diagnostics = [] } = useQuery({
    queryKey: ['diagnostics', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CodeDiagnostic.filter({ patient_email: user.email });
    },
    enabled: !!user,
  });

  const { data: resultatsLabo = [] } = useQuery({
    queryKey: ['resultats_labo', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ResultatLaboratoire.filter({ patient_email: user.email });
    },
    enabled: !!user,
  });

  const stats = {
    total_exchanges: interopRecords.length,
    documents_shared: registreDocuments.filter(d => d.consentement_partage).length,
    diagnostics_codes: diagnostics.length,
    lab_results: resultatsLabo.length,
    sync_success_rate: interopRecords.length > 0 
      ? ((interopRecords.filter(r => r.statut_sync === 'synchronise').length / interopRecords.length) * 100).toFixed(0)
      : 0
  };

  const standardsUtilises = {
    'HL7 FHIR': interopRecords.filter(r => r.type_standard === 'HL7_FHIR').length,
    'IHE XDS.b': registreDocuments.length,
    'ICD-10': diagnostics.length,
    'LOINC': resultatsLabo.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Network className="w-8 h-8 text-blue-600" />
              Interopérabilité & Standards
            </h1>
            <p className="text-gray-600 mt-2">
              Échanges standardisés de données de santé - HL7 FHIR, IHE XDS.b, ICD-10, LOINC
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            {stats.sync_success_rate}% Synchro réussie
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Échanges Totaux</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_exchanges}</p>
                  <p className="text-xs text-gray-500 mt-1">FHIR + XDS + autres</p>
                </div>
                <Database className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documents Partagés</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.documents_shared}</p>
                  <p className="text-xs text-gray-500 mt-1">Via IHE XDS.b</p>
                </div>
                <Share2 className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Diagnostics Codés</p>
                  <p className="text-3xl font-bold text-green-600">{stats.diagnostics_codes}</p>
                  <p className="text-xs text-gray-500 mt-1">ICD-10/ICD-11</p>
                </div>
                <FileText className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Résultats Labo</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.lab_results}</p>
                  <p className="text-xs text-gray-500 mt-1">Codage LOINC</p>
                </div>
                <Activity className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="fhir">HL7 FHIR</TabsTrigger>
            <TabsTrigger value="xds">IHE XDS.b</TabsTrigger>
            <TabsTrigger value="codes">Codages</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Standards Utilisés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(standardsUtilises).map(([standard, count]) => (
                    <div key={standard} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Network className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{standard}</p>
                          <p className="text-sm text-gray-600">{count} enregistrements</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Actif</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Sécurité & Confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-900">Chiffrement TLS</p>
                    <p className="text-sm text-gray-600">Toutes communications</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Lock className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="font-semibold text-gray-900">OAuth2 / OIDC</p>
                    <p className="text-sm text-gray-600">Authentification sécurisée</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <FileText className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="font-semibold text-gray-900">Consentement BPPC</p>
                    <p className="text-sm text-gray-600">Gestion granulaire</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FHIR Tab */}
          <TabsContent value="fhir" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Échanges HL7 FHIR</CardTitle>
              </CardHeader>
              <CardContent>
                {interopRecords.filter(r => r.type_standard === 'HL7_FHIR').length > 0 ? (
                  <div className="space-y-3">
                    {interopRecords
                      .filter(r => r.type_standard === 'HL7_FHIR')
                      .slice(0, 10)
                      .map(record => (
                        <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{record.ressource_type || 'Ressource FHIR'}</p>
                              <p className="text-sm text-gray-600">{record.systeme_source}</p>
                              <p className="text-xs text-gray-500">{new Date(record.date_sync || record.created_date).toLocaleString('fr-FR')}</p>
                            </div>
                            <Badge className={
                              record.statut_sync === 'synchronise' ? 'bg-green-100 text-green-800' :
                              record.statut_sync === 'erreur' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {record.statut_sync}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Network className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun échange FHIR pour le moment</p>
                    <p className="text-sm text-gray-500 mt-2">Les échanges apparaîtront ici automatiquement</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* XDS Tab */}
          <TabsContent value="xds" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Registre Documentaire (IHE XDS.b)</CardTitle>
              </CardHeader>
              <CardContent>
                {registreDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {registreDocuments.map(doc => (
                      <div key={doc.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{doc.titre_document}</p>
                            <p className="text-sm text-gray-600">{doc.type_document_xds}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{doc.format_code}</Badge>
                              <Badge className={
                                doc.niveau_confidentialite === 'normal' ? 'bg-green-100 text-green-800' :
                                doc.niveau_confidentialite === 'restricted' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {doc.niveau_confidentialite}
                              </Badge>
                              {doc.consentement_partage && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Share2 className="w-3 h-3 mr-1" />
                                  Partagé
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Voir</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun document enregistré</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Codes Tab */}
          <TabsContent value="codes" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Diagnostics ICD-10</CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnostics.length > 0 ? (
                    <div className="space-y-3">
                      {diagnostics.slice(0, 5).map(diag => (
                        <div key={diag.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{diag.code_icd10}</p>
                              <p className="text-xs text-gray-600">{diag.libelle_diagnostic}</p>
                            </div>
                            <Badge className={
                              diag.statut === 'actif' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {diag.statut}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucun diagnostic codé</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Résultats LOINC</CardTitle>
                </CardHeader>
                <CardContent>
                  {resultatsLabo.length > 0 ? (
                    <div className="space-y-3">
                      {resultatsLabo.slice(0, 5).map(result => (
                        <div key={result.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{result.code_loinc}</p>
                              <p className="text-xs text-gray-600">{result.nom_test}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {result.valeur} {result.unite}
                              </p>
                            </div>
                            <Badge className={
                              result.interpretation === 'normal' ? 'bg-green-100 text-green-800' :
                              result.interpretation === 'high' || result.interpretation === 'low' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {result.interpretation}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucun résultat labo</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}