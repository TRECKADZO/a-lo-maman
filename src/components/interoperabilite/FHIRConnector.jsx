import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Share2, Download, Upload, CheckCircle, AlertCircle,
  Loader2, Database, FileText, Calendar, Activity
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FHIRConnector({ enfantId, professionnelId }) {
  const [loading, setLoading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleExportPatient = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('fhirInterop', {
        action: 'export_patient',
        patientId: enfantId
      });

      setResult(response.data);
      toast({
        title: 'Export FHIR réussi',
        description: 'Patient exporté au format HL7 FHIR R4',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLabResults = async () => {
    if (!externalUrl) {
      toast({
        title: 'URL requise',
        description: 'Veuillez saisir l\'URL du serveur FHIR',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('fhirInterop', {
        action: 'fetch_lab_results',
        patientId: enfantId,
        externalSystemUrl: externalUrl
      });

      setResult(response.data);
      toast({
        title: 'Synchronisation réussie',
        description: `${response.data.imported} résultats importés`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFHIRJson = () => {
    if (!result?.fhirResource) return;

    const blob = new Blob([JSON.stringify(result.fhirResource, null, 2)], {
      type: 'application/fhir+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-resource-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Interopérabilité HL7 FHIR
        </CardTitle>
        <p className="text-sm text-gray-600">
          Échangez des données avec les systèmes de santé externes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">
              <Upload className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Download className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="sync">
              <Share2 className="w-4 h-4 mr-2" />
              Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Export Patient (FHIR)</h4>
              <p className="text-sm text-blue-700 mb-4">
                Exporte le dossier patient au format HL7 FHIR R4 pour partage avec d'autres systèmes
              </p>
              <Button
                onClick={handleExportPatient}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Exporter au format FHIR
              </Button>
            </div>

            {result?.fhirResource && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Export réussi</span>
                  </div>
                  <Badge className="bg-green-600">FHIR R4</Badge>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Ressource: {result.fhirResource.resourceType} • ID: {result.fhirResource.id}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFHIRJson}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Télécharger JSON
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Import Résultats Labo</h4>
              <p className="text-sm text-purple-700 mb-4">
                Récupère automatiquement les résultats depuis un serveur FHIR externe
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    URL du serveur FHIR
                  </label>
                  <Input
                    placeholder="https://fhir.example.com/api"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: https://fhir.chu-cocody.ci/api
                  </p>
                </div>

                <Button
                  onClick={handleFetchLabResults}
                  disabled={loading || !externalUrl}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Importer les résultats
                </Button>
              </div>
            </div>

            {result?.observations && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    {result.imported} résultats importés
                  </span>
                </div>
                <div className="space-y-2 mt-3">
                  {result.observations.slice(0, 5).map((obs, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{obs.type_donnee}</span>
                      <Badge variant="outline">
                        {obs.valeur} {obs.unite}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="p-4 bg-teal-50 rounded-lg">
              <h4 className="font-semibold text-teal-900 mb-2">Synchronisation RDV</h4>
              <p className="text-sm text-teal-700 mb-4">
                Synchronise automatiquement vos rendez-vous avec les agendas externes
              </p>
              
              <div className="flex items-center gap-2 p-3 bg-white rounded border">
                <Calendar className="w-5 h-5 text-teal-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Agenda Google Health</p>
                  <p className="text-xs text-gray-500">Synchronisation automatique</p>
                </div>
                <Badge className="bg-teal-100 text-teal-800">Actif</Badge>
              </div>

              <Button
                variant="outline"
                className="w-full mt-3"
                disabled
              >
                <Activity className="w-4 h-4 mr-2" />
                Configurer (Bientôt disponible)
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-2">Standards supportés</h5>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline">HL7 FHIR R4</Badge>
                <Badge variant="outline">ICD-10</Badge>
                <Badge variant="outline">LOINC</Badge>
                <Badge variant="outline">SNOMED CT</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}