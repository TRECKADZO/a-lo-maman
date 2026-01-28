import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, Heart, Activity, Brain, Bone, 
  ArrowLeft, Lock, Shield, RefreshCw, 
  Loader2, AlertTriangle, Plus 
} from 'lucide-react';
import AjouterObservation from '../components/dossier-medical/AjouterObservation';
import AjouterTraitement from '../components/dossier-medical/AjouterTraitement';
import VueSynthese from '../components/dossier-medical/VueSynthese';
import VueCardiologie from '../components/dossier-medical/VueCardiologie';
import VueOncologie from '../components/dossier-medical/VueOncologie';
import VuePsychiatrie from '../components/dossier-medical/VuePsychiatrie';

const SPECIALITES_ONGLETS = {
  synthese: { label: 'Synthèse', icon: User, color: 'blue', accessible: ['tous'] },
  cardiologie: { label: 'Cardiologie', icon: Heart, color: 'red', accessible: ['cardiologue', 'medecin_generaliste'] },
  oncologie: { label: 'Oncologie', icon: Activity, color: 'purple', accessible: ['oncologue', 'medecin_generaliste'] },
  psychiatrie: { label: 'Psychiatrie', icon: Brain, color: 'indigo', accessible: ['psychiatre', 'medecin_generaliste'] },
  rhumatologie: { label: 'Rhumatologie', icon: Bone, color: 'orange', accessible: ['rhumatologue', 'medecin_generaliste'] },
};

export default function DossierMedicalDynamique() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('synthese');
  const [refreshing, setRefreshing] = useState(false);
  const [showAjouterObs, setShowAjouterObs] = useState(false);
  const [showAjouterTraitement, setShowAjouterTraitement] = useState(false);

  // Récupérer le professionnel connecté
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnel } = useQuery({
    queryKey: ['professionnel', user?.email],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.list();
      return pros.find(p => p.email === user.email);
    },
    enabled: !!user,
  });

  // Récupérer le dossier médical
  const { data: dossier, isLoading, refetch } = useQuery({
    queryKey: ['dossier_medical', patientId],
    queryFn: () => base44.entities.DossierMedicalComplet.filter({ id: patientId }),
    select: (data) => data[0],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Vérifier les consentements
  const specialite = professionnel?.specialite || 'medecin_generaliste';
  const consentements = dossier?.consentements_partage || {};
  const aConsentement = consentements[specialite] !== false;

  // Filtrer les onglets accessibles
  const ongletsAccessibles = Object.entries(SPECIALITES_ONGLETS).filter(([key, config]) => {
    if (key === 'synthese') return true;
    return config.accessible.includes(specialite) || config.accessible.includes('tous');
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>Dossier patient introuvable</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!aConsentement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Accès Restreint</h2>
            <p className="text-gray-600 mb-6">
              Le patient n'a pas autorisé le partage de ses données avec votre spécialité.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Dossier Médical
              </h1>
              <p className="text-gray-600">
                {dossier.patient_nom} {dossier.patient_prenom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAjouterObs(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Observation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAjouterTraitement(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Traitement
            </Button>
            <Badge className="bg-teal-100 text-teal-800">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tabs dynamiques */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${ongletsAccessibles.length}, 1fr)` }}>
            {ongletsAccessibles.map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${config.color}-500`} />
                  <span className="hidden md:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="synthese">
              <VueSynthese dossier={dossier} />
            </TabsContent>

            {ongletsAccessibles.find(([key]) => key === 'cardiologie') && (
              <TabsContent value="cardiologie">
                <VueCardiologie dossier={dossier} />
              </TabsContent>
            )}

            {ongletsAccessibles.find(([key]) => key === 'oncologie') && (
              <TabsContent value="oncologie">
                <VueOncologie dossier={dossier} />
              </TabsContent>
            )}

            {ongletsAccessibles.find(([key]) => key === 'psychiatrie') && (
              <TabsContent value="psychiatrie">
                <VuePsychiatrie dossier={dossier} />
              </TabsContent>
            )}

            {ongletsAccessibles.find(([key]) => key === 'rhumatologie') && (
              <TabsContent value="rhumatologie">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500">Module Rhumatologie en développement</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Modals */}
        <AjouterObservation
          dossierId={patientId}
          open={showAjouterObs}
          onClose={() => setShowAjouterObs(false)}
        />
        <AjouterTraitement
          dossierId={patientId}
          open={showAjouterTraitement}
          onClose={() => setShowAjouterTraitement(false)}
        />
      </div>
    </div>
  );
}