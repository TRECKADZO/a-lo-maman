import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Database, Share2, CheckCircle, Sparkles, 
  Stethoscope, Beaker, Pill, FileText
} from 'lucide-react';

import FHIRConnector from '@/components/interoperabilite/FHIRConnector';
import CodageICD10 from '@/components/interoperabilite/CodageICD10';
import RechercheStandards from '@/components/interoperabilite/RechercheStandards';
import AuthGuard from '@/components/auth/AuthGuard';

export default function Interoperabilite() {
  const [selectedEnfant, setSelectedEnfant] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants', user?.email],
    queryFn: () => base44.entities.EnfantCarnet.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);
      
      const proProfil = proProfiles.find(p => p.email === user.email);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
  });

  const isSpecialist = !!profiles?.pro;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Interopérabilité
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Standards HL7 FHIR, ICD-10, LOINC, ATC
              </p>
            </div>
          </div>

          {/* Stats Standards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-lg border-none bg-gradient-to-br from-blue-100 to-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">HL7 FHIR</p>
                    <p className="text-xs text-blue-700">API Cliniques</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-red-100 to-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">ICD-10</p>
                    <p className="text-xs text-red-700">Diagnostics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-purple-100 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Beaker className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">LOINC</p>
                    <p className="text-xs text-purple-700">Tests Labo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-green-100 to-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Pill className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">ATC</p>
                    <p className="text-xs text-green-700">Médicaments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sélection enfant */}
          {!isSpecialist && enfants.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Sélectionner un enfant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enfants.map((enfant) => (
                    <Badge
                      key={enfant.id}
                      variant={selectedEnfant?.id === enfant.id ? 'default' : 'outline'}
                      className="cursor-pointer py-2 px-4"
                      onClick={() => setSelectedEnfant(enfant)}
                    >
                      {enfant.prenom}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Principaux */}
          <Tabs defaultValue="fhir">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fhir">
                <Share2 className="w-4 h-4 mr-2" />
                HL7 FHIR
              </TabsTrigger>
              <TabsTrigger value="icd10">
                <Stethoscope className="w-4 h-4 mr-2" />
                ICD-10
              </TabsTrigger>
              <TabsTrigger value="standards">
                <Sparkles className="w-4 h-4 mr-2" />
                LOINC / ATC
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fhir" className="mt-6">
              {selectedEnfant || isSpecialist ? (
                <FHIRConnector
                  enfantId={selectedEnfant?.id}
                  professionnelId={profiles?.pro?.id}
                />
              ) : (
                <Card className="shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Sélectionnez un enfant pour utiliser l'interopérabilité FHIR
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="icd10" className="mt-6">
              <CodageICD10 onSelect={(code) => console.log('Selected ICD-10:', code)} />
            </TabsContent>

            <TabsContent value="standards" className="mt-6">
              <RechercheStandards onSelect={(item) => console.log('Selected:', item)} />
            </TabsContent>
          </Tabs>

          {/* Info Conformité */}
          <Card className="shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-teal-900 mb-2">
                    Standards Médicaux Certifiés
                  </h3>
                  <p className="text-sm text-teal-800 mb-3">
                    A'lo Maman implémente les standards internationaux d'interopérabilité 
                    pour garantir la compatibilité avec les systèmes de santé externes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-teal-600">HL7 FHIR R4</Badge>
                    <Badge className="bg-blue-600">ICD-10 (OMS)</Badge>
                    <Badge className="bg-purple-600">LOINC</Badge>
                    <Badge className="bg-green-600">ATC (OMS)</Badge>
                    <Badge className="bg-indigo-600">OAuth2/OIDC</Badge>
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