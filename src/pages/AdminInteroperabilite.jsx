import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Network, 
  Database, 
  FileCode, 
  Pill, 
  Stethoscope,
  Image as ImageIcon,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import AuthGuard from "../components/auth/AuthGuard";

export default function AdminInteroperabilite() {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Stats des ressources d'interopérabilité
  const { data: stats, isLoading } = useQuery({
    queryKey: ['interop_stats'],
    queryFn: async () => {
      const [fhir, icd10, loinc, atc, xds, dicom, pix, consent] = await Promise.all([
        base44.entities.FHIRResource.list(),
        base44.entities.ICD10Diagnostic.list(),
        base44.entities.LOINCTest.list(),
        base44.entities.MedicamentATC.list(),
        base44.entities.XDSDocument.list(),
        base44.entities.DICOMImage.list(),
        base44.entities.IdentitePatientPIX.list(),
        base44.entities.ConsentementBPPC.list(),
      ]);

      return {
        fhir: fhir.length,
        icd10: icd10.length,
        loinc: loinc.length,
        atc: atc.length,
        xds: xds.length,
        dicom: dicom.length,
        pix: pix.length,
        consent: consent.length,
        fhirByType: fhir.reduce((acc, r) => {
          acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
          return acc;
        }, {}),
        xdsByClass: xds.reduce((acc, d) => {
          acc[d.class_code] = (acc[d.class_code] || 0) + 1;
          return acc;
        }, {}),
      };
    },
    initialData: {
      fhir: 0, icd10: 0, loinc: 0, atc: 0, xds: 0, dicom: 0, pix: 0, consent: 0,
      fhirByType: {}, xdsByClass: {}
    }
  });

  const standards = [
    {
      id: "fhir",
      name: "HL7 FHIR",
      icon: Network,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "API cliniques - Échange données patients",
      count: stats.fhir,
      status: "actif"
    },
    {
      id: "xds",
      name: "IHE XDS.b",
      icon: FileCode,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Partage documentaire sécurisé",
      count: stats.xds,
      status: "actif"
    },
    {
      id: "icd10",
      name: "ICD-10/11",
      icon: Stethoscope,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Codage diagnostics",
      count: stats.icd10,
      status: "actif"
    },
    {
      id: "loinc",
      name: "LOINC",
      icon: Database,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Tests laboratoire",
      count: stats.loinc,
      status: "actif"
    },
    {
      id: "atc",
      name: "ATC/IDMP",
      icon: Pill,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Codage médicaments",
      count: stats.atc,
      status: "actif"
    },
    {
      id: "dicom",
      name: "DICOM",
      icon: ImageIcon,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      description: "Imagerie médicale",
      count: stats.dicom,
      status: "actif"
    },
    {
      id: "pix",
      name: "PIX/PDQ",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Identité patient",
      count: stats.pix,
      status: "actif"
    },
    {
      id: "bppc",
      name: "BPPC",
      icon: Shield,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      description: "Consentements",
      count: stats.consent,
      status: "actif"
    }
  ];

  if (user?.role !== 'admin') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Accès Réservé</h2>
              <p className="text-gray-600">
                Cette page est réservée aux administrateurs système.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Standards d'Interopérabilité</h1>
              <p className="text-gray-600 mt-1">
                Gestion centralisée des standards de santé connectée
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              8 Standards Actifs
            </Badge>
          </div>

          {/* Vue d'ensemble des standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {standards.map((standard) => {
              const Icon = standard.icon;
              return (
                <Card key={standard.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${standard.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${standard.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{standard.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{standard.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {standard.count} entrées
                      </Badge>
                      <Badge className={standard.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {standard.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs détaillés */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="fhir">FHIR Resources</TabsTrigger>
              <TabsTrigger value="documents">Documents XDS</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ressources FHIR par Type</CardTitle>
                    <CardDescription>Distribution des ressources HL7 FHIR</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.fhirByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{type}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                      {Object.keys(stats.fhirByType).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucune ressource FHIR encore créée
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents XDS par Classe</CardTitle>
                    <CardDescription>Distribution des documents partagés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.xdsByClass).map(([classe, count]) => (
                        <div key={classe} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{classe}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                      {Object.keys(stats.xdsByClass).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucun document XDS encore enregistré
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="fhir">
              <Card>
                <CardHeader>
                  <CardTitle>Ressources HL7 FHIR (R4)</CardTitle>
                  <CardDescription>
                    Mapping des entités A'lo Maman vers ressources FHIR standard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Mappings Actifs</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span><strong>SuiviGrossesse</strong> → FHIR Patient + Observation (grossesse)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span><strong>EnfantCarnet</strong> → FHIR Patient (pédiatrique)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span><strong>RendezVous</strong> → FHIR Appointment</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span><strong>Ordonnance</strong> → FHIR MedicationRequest</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span><strong>Vaccins</strong> → FHIR Immunization</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600">
                      Total: <strong>{stats.fhir}</strong> ressources FHIR synchronisées
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents XDS (IHE XDS.b)</CardTitle>
                  <CardDescription>
                    Registre et dépôt de documents médicaux partagés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Classes de Documents</h4>
                      <ul className="space-y-2 text-sm">
                        <li>📄 <strong>Consultation</strong> - Comptes-rendus consultation</li>
                        <li>📊 <strong>Laboratoire</strong> - Résultats analyses biologiques</li>
                        <li>🖼️ <strong>Imagerie</strong> - Échographies, radios, scanners</li>
                        <li>💊 <strong>Ordonnance</strong> - Prescriptions médicamenteuses</li>
                        <li>💉 <strong>Vaccination</strong> - Certificats de vaccination</li>
                        <li>📋 <strong>Rapport</strong> - Rapports spécialisés</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600">
                      Total: <strong>{stats.xds}</strong> documents enregistrés dans le repository XDS
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Import/Export Données</CardTitle>
                    <CardDescription>Synchronisation avec systèmes externes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer codes ICD-10 (CSV)
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer codes LOINC (CSV)
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer médicaments ATC (CSV)
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter données FHIR (Bundle JSON)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Synchronisation</CardTitle>
                    <CardDescription>Mise à jour des référentiels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Synchroniser avec Registre PIX National
                    </Button>
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Mettre à jour référentiel ICD-11
                    </Button>
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Synchroniser avec WHO Drug Dictionary
                    </Button>
                    <div className="text-xs text-gray-500 mt-4">
                      Dernière synchro: Jamais
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Info Box */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Standards d'Interopérabilité Implémentés
                  </h3>
                  <p className="text-sm text-blue-800">
                    A'lo Maman est maintenant conforme aux principaux standards internationaux de santé connectée.
                    Cela permet l'interopérabilité avec les systèmes hospitaliers, les laboratoires, et les organismes de santé publique.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">HL7 FHIR R4/R5</Badge>
                    <Badge className="bg-green-100 text-green-800">IHE XDS.b/XCA</Badge>
                    <Badge className="bg-purple-100 text-purple-800">ICD-10/11</Badge>
                    <Badge className="bg-orange-100 text-orange-800">LOINC</Badge>
                    <Badge className="bg-red-100 text-red-800">ATC/IDMP</Badge>
                    <Badge className="bg-cyan-100 text-cyan-800">DICOM</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800">PIX/PDQ</Badge>
                    <Badge className="bg-teal-100 text-teal-800">IHE BPPC</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}