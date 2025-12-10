import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Activity, FileText, TrendingUp } from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';
import AnalyseRisquePredictive from '../components/ia/AnalyseRisquePredictive';
import AideDiagnosticDifferentiel from '../components/ia/AideDiagnosticDifferentiel';

export default function OutilsIAPro() {
  const [selectedTab, setSelectedTab] = useState('risques');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0];
    },
    enabled: !!user,
  });

  const { data: mesPatients = [] } = useQuery({
    queryKey: ['mes_patients', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
    },
    enabled: !!profilPro,
  });

  const { data: grossesses = [] } = useQuery({
    queryKey: ['grossesses_suivies'],
    queryFn: () => base44.entities.SuiviGrossesse.list('-date_derniere_regle', 50),
    enabled: !!profilPro,
  });

  if (!profilPro) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Accès réservé aux professionnels de santé</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                Outils d'Intelligence Artificielle
              </h1>
              <p className="text-gray-600 mt-2">
                Aide à la décision clinique basée sur l'IA
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Patientes suivies</p>
                    <p className="text-3xl font-bold text-purple-600">{grossesses.length}</p>
                  </div>
                  <Activity className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Enfants suivis</p>
                    <p className="text-3xl font-bold text-blue-600">{mesPatients.length}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Analyses IA</p>
                    <p className="text-3xl font-bold text-green-600">-</p>
                  </div>
                  <Brain className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rapports générés</p>
                    <p className="text-3xl font-bold text-orange-600">-</p>
                  </div>
                  <FileText className="w-10 h-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sélection patient */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une patiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {grossesses.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedPatient({ grossesse: g, email: g.created_by })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedPatient?.grossesse?.id === g.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{g.created_by}</p>
                    <p className="text-sm text-gray-600">
                      Terme: {Math.floor((Date.now() - new Date(g.date_derniere_regle)) / 604800000)}SA
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outils IA */}
          {selectedPatient && (
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="risques">Analyse de Risques</TabsTrigger>
                <TabsTrigger value="diagnostic">Aide Diagnostique</TabsTrigger>
                <TabsTrigger value="rapport">Génération Rapport</TabsTrigger>
              </TabsList>

              <TabsContent value="risques">
                <AnalyseRisquePredictive
                  grossesse={selectedPatient.grossesse}
                  patient={{ email: selectedPatient.email }}
                />
              </TabsContent>

              <TabsContent value="diagnostic">
                <AideDiagnosticDifferentiel
                  patient={{ email: selectedPatient.email }}
                  context="Suivi grossesse"
                />
              </TabsContent>

              <TabsContent value="rapport">
                <Card>
                  <CardHeader>
                    <CardTitle>Génération Automatique de Rapport</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Fonctionnalité en cours de développement...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}