import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, MapPin, Calendar, FileText, 
  Info, Sparkles, ArrowRight, Play
} from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';
import RechercheCentreEcho from '../components/teleechographie/RechercheCentreEcho';
import ReserverRDVEchographie from '../components/teleechographie/ReserverRDVEchographie';
import MesRDVEchographie from '../components/teleechographie/MesRDVEchographie';
import DetailRapportEcho from '../components/teleechographie/DetailRapportEcho';
import AffichageRapportEchographie from '../components/teleechographie/AffichageRapportEchographie';

export default function TeleEchographie() {
  const [activeTab, setActiveTab] = useState('chercher');
  const [centreSelectionne, setCentreSelectionne] = useState(null);
  const [rapportSelectionne, setRapportSelectionne] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: grossesse } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({
        grossesse_active: true
      });
      return grossesses[0] || null;
    },
  });

  const { data: centres = [] } = useQuery({
    queryKey: ['centres_teleecho'],
    queryFn: () => base44.entities.CentreTeleEchographie.filter({ actif: true }),
  });

  const handleSelectCentre = (centre) => {
    setCentreSelectionne(centre);
  };

  const handleRDVSuccess = () => {
    setCentreSelectionne(null);
    setActiveTab('mes-rdv');
  };

  const handleViewRapport = (rdv) => {
    setRapportSelectionne(rdv);
    setActiveTab('rapport');
  };

  // Déterminer le type d'échographie recommandé
  const getTypeEchoRecommande = () => {
    if (!grossesse) return null;
    const joursDepuisDDR = Math.floor(
      (new Date() - new Date(grossesse.date_derniere_regle)) / (1000 * 60 * 60 * 24)
    );
    const semaines = Math.floor(joursDepuisDDR / 7);
    
    if (semaines <= 14) return 'datation';
    if (semaines >= 20 && semaines <= 24) return 'morphologique';
    if (semaines >= 32) return 'croissance';
    return null;
  };

  const typeRecommande = getTypeEchoRecommande();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 pb-24" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Télé-Échographie à Distance
            </h1>
            <p className="text-gray-600">
              Échographies de qualité près de chez vous
            </p>
          </div>

          {/* Alerte si pas de grossesse */}
          {!grossesse && (
            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      Aucune grossesse active détectée
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Vous devez d'abord créer un suivi de grossesse pour prendre un RDV d'échographie.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info module */}
          <Card className="shadow-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Centres proches</p>
                    <p className="text-xs text-gray-600">Géolocalisation automatique</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">RDV en ligne</p>
                    <p className="text-xs text-gray-600">Confirmation immédiate</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">100% Gratuit</p>
                    <p className="text-xs text-gray-600">Pour adhérents CMU</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vidéo tutoriel */}
          <Card className="shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-sm">Comment se déroule une télé-échographie ?</p>
                    <p className="text-xs text-gray-600">Tutoriel vidéo 1 min</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowVideo(true)}
                >
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommandation */}
          {typeRecommande && grossesse && (
            <Card className="shadow-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-pink-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      Échographie recommandée
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      Selon votre terme de grossesse, une échographie de type{' '}
                      <Badge className="bg-pink-600 text-white">{typeRecommande}</Badge>{' '}
                      est recommandée maintenant.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('chercher')}
                      className="w-full bg-pink-500"
                    >
                      Prendre rendez-vous
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-md">
              <TabsTrigger value="chercher">Chercher</TabsTrigger>
              <TabsTrigger value="mes-rdv">Mes RDV</TabsTrigger>
              <TabsTrigger value="rapport" disabled={!rapportSelectionne}>Rapport</TabsTrigger>
            </TabsList>

            <TabsContent value="chercher" className="mt-6">
              {centreSelectionne && grossesse ? (
                <ReserverRDVEchographie
                  centre={centreSelectionne}
                  grossesse={grossesse}
                  onRetour={() => setCentreSelectionne(null)}
                  onSuccess={handleRDVSuccess}
                />
              ) : (
                <RechercheCentreEcho
                  onSelectCentre={handleSelectCentre}
                  typeEchographie={typeRecommande}
                />
              )}
            </TabsContent>

            <TabsContent value="mes-rdv" className="mt-6">
              <MesRDVEchographie onViewRapport={handleViewRapport} />
              {grossesse && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Mes rapports d'échographie</h3>
                  <AffichageRapportEchographie 
                    grossesseId={grossesse.id} 
                    mamanEmail={user?.email}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="rapport" className="mt-6">
              {rapportSelectionne && (
                <DetailRapportEcho
                  rdv={rapportSelectionne}
                  centre={centres.find(c => c.id === rapportSelectionne.centre_id)}
                  onRetour={() => {
                    setRapportSelectionne(null);
                    setActiveTab('mes-rdv');
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}