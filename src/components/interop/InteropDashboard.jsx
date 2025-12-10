import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  FileText,
  Share2,
  Shield,
  Activity,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Download,
  Upload
} from "lucide-react";
import FHIRMapper from "./FHIRMapper";
import AuthGuard from "../auth/AuthGuard";

export default function InteropDashboard() {
  const [selectedTab, setSelectedTab] = useState("fhir");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: fhirResources = [] } = useQuery({
    queryKey: ['fhir_resources', user?.email],
    queryFn: () => base44.entities.RessourceFHIR.filter({ patient_email: user.email }),
    enabled: !!user,
  });

  const { data: documentsXDS = [] } = useQuery({
    queryKey: ['documents_xds', user?.email],
    queryFn: () => base44.entities.DocumentXDS.filter({ patient_email: user.email }),
    enabled: !!user,
  });

  const { data: identifiants = [] } = useQuery({
    queryKey: ['identifiants_patient', user?.email],
    queryFn: () => base44.entities.IdentifiantPatient.filter({ patient_email: user.email }),
    enabled: !!user,
  });

  const { data: consentements = [] } = useQuery({
    queryKey: ['consentements', user?.email],
    queryFn: () => base44.entities.ConsentementBPPC.filter({ patient_email: user.email }),
    enabled: !!user,
  });

  const { data: imagesDICOM = [] } = useQuery({
    queryKey: ['images_dicom', user?.email],
    queryFn: () => base44.entities.ImageDICOM.filter({ patient_email: user.email }),
    enabled: !!user,
  });

  const stats = {
    fhir_resources: fhirResources.length,
    xds_documents: documentsXDS.length,
    identifiants: identifiants[0]?.identifiants?.length || 0,
    consentements_actifs: consentements.filter(c => c.status === 'active').length,
    images_dicom: imagesDICOM.length
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                Interopérabilité & Standards
              </h1>
              <p className="text-gray-600 mt-1">
                Gestion des données selon standards internationaux (HL7 FHIR, IHE, ICD-10, LOINC)
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ressources FHIR</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.fhir_resources}</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Documents XDS</p>
                    <p className="text-3xl font-bold text-green-600">{stats.xds_documents}</p>
                  </div>
                  <FileText className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Identifiants</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.identifiants}</p>
                  </div>
                  <Share2 className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Consentements</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.consentements_actifs}</p>
                  </div>
                  <Shield className="w-10 h-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Images DICOM</p>
                    <p className="text-3xl font-bold text-teal-600">{stats.images_dicom}</p>
                  </div>
                  <Stethoscope className="w-10 h-10 text-teal-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="fhir">HL7 FHIR</TabsTrigger>
              <TabsTrigger value="xds">IHE XDS</TabsTrigger>
              <TabsTrigger value="identifiants">PIX/PDQ</TabsTrigger>
              <TabsTrigger value="consentements">BPPC</TabsTrigger>
              <TabsTrigger value="dicom">DICOM</TabsTrigger>
            </TabsList>

            {/* FHIR Resources */}
            <TabsContent value="fhir" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Ressources FHIR R4/R5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fhirResources.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        Aucune ressource FHIR synchronisée
                      </p>
                    ) : (
                      fhirResources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{resource.resource_type}</Badge>
                            <div>
                              <p className="font-medium">{resource.fhir_id}</p>
                              <p className="text-sm text-gray-500">{resource.source_system}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {resource.sync_status === 'synced' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Synchronisé
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {resource.sync_status}
                              </Badge>
                            )}
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* XDS Documents */}
            <TabsContent value="xds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Documents IHE XDS.b
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentsXDS.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        Aucun document dans le registre XDS
                      </p>
                    ) : (
                      documentsXDS.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{doc.type_code}</Badge>
                              <Badge>{doc.confidentiality === 'N' ? 'Normal' : doc.confidentiality === 'R' ? 'Restreint' : 'Très restreint'}</Badge>
                            </div>
                          </div>
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Identifiants PIX/PDQ */}
            <TabsContent value="identifiants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-600" />
                    Identifiants Patient (PIX/PDQ)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {identifiants.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      Aucun identifiant externe configuré
                    </p>
                  ) : (
                    identifiants.map((id) => (
                      <div key={id.id} className="space-y-3">
                        {id.master_patient_index && (
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm font-medium text-purple-900">Master Patient Index</p>
                            <p className="text-lg font-bold text-purple-600">{id.master_patient_index}</p>
                          </div>
                        )}
                        {id.identifiants?.map((ident, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{ident.type}</p>
                              <p className="text-sm text-gray-500">{ident.system}</p>
                              <p className="text-lg font-mono">{ident.value}</p>
                            </div>
                            <Badge variant={ident.active ? "default" : "secondary"}>
                              {ident.active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consentements BPPC */}
            <TabsContent value="consentements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    Consentements (IHE BPPC)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consentements.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        Aucun consentement enregistré
                      </p>
                    ) : (
                      consentements.map((consent) => (
                        <div key={consent.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{consent.policy_type}</Badge>
                            <Badge variant={consent.status === 'active' ? 'default' : 'secondary'}>
                              {consent.status}
                            </Badge>
                          </div>
                          <p className="font-medium">{consent.scope}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Décision: {consent.decision === 'permit' ? '✓ Autorisé' : '✗ Refusé'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images DICOM */}
            <TabsContent value="dicom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    Images Médicales DICOM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {imagesDICOM.length === 0 ? (
                      <p className="col-span-2 text-center py-8 text-gray-500">
                        Aucune image DICOM disponible
                      </p>
                    ) : (
                      imagesDICOM.map((img) => (
                        <div key={img.id} className="border rounded-lg overflow-hidden">
                          {img.thumbnail_uri && (
                            <img src={img.thumbnail_uri} alt={img.study_description} className="w-full h-48 object-cover" />
                          )}
                          <div className="p-4">
                            <Badge className="mb-2">{img.modality}</Badge>
                            <p className="font-medium">{img.study_description}</p>
                            <p className="text-sm text-gray-500">{img.study_date}</p>
                            <Button size="sm" className="mt-2 w-full">
                              Voir DICOM Viewer
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}