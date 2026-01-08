import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ParcoursGuideMaman from '../components/onboarding/ParcoursGuideMaman';
import ConseilsPersonnalises from '../components/ia/ConseilsPersonnalises';
import NaissanceCTA from '../components/naissance/NaissanceCTA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Sparkles
} from 'lucide-react';
import { differenceInWeeks } from 'date-fns';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';
import { PageTransition } from '@/components/ui/page-transition';
import WidgetGrossesse from '../components/dashboard/WidgetGrossesse';
import WidgetProchainsRDV from '../components/dashboard/WidgetProchainsRDV';
import WidgetDocumentsRecents from '../components/dashboard/WidgetDocumentsRecents';
import WidgetAlertesIA from '../components/dashboard/WidgetAlertesIA';
import WidgetEnfants from '../components/dashboard/WidgetEnfants';
import PersonnaliserWidgets from '../components/dashboard/PersonnaliserWidgets';
import RappelsWidget from '@/components/rappels/RappelsWidget';
import GenererRapportPDF from '../components/dashboard/GenererRapportPDF';
import SectionSuiviGrossesse from '../components/dashboard/SectionSuiviGrossesse';

export default function DashboardMaman() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPersonnaliser, setShowPersonnaliser] = useState(false);
  const [showRapportPDF, setShowRapportPDF] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilMaman, isLoading: profilLoading } = useQuery({
    queryKey: ['profilMaman', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  // Afficher onboarding si pas de profil
  useEffect(() => {
    if (user && !profilLoading && !profilMaman) {
      setShowOnboarding(true);
    }
  }, [user, profilMaman, profilLoading]);

  const { data: grossesse, isLoading: grossesseLoading } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({
        grossesse_active: true,
      });
      return grossesses[0];
    },
  });

  const { data: dernierCycle } = useQuery({
    queryKey: ['dernier_cycle'],
    queryFn: async () => {
      const cycles = await base44.entities.CycleMenstruel.list('-date_debut_regles', 1);
      return cycles[0];
    },
  });

  const { data: suiviContraception } = useQuery({
    queryKey: ['suiviContraceptionActif'],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviContraception.filter({ active: true });
      return suivis[0];
    },
  });
  
  const { data: enfants, isLoading: enfantsLoading } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list('-created_date'),
    initialData: []
  });

  const { data: mesRendezVous, isLoading: rdvLoading } = useQuery({
    queryKey: ['mesRendezVous'],
    queryFn: async () => {
      if (!user) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: professionnels } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: [],
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { destinataire_email: user.email, lu: false },
        '-created_date',
        5
      );
      return notifs;
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents_famille'],
    queryFn: () => base44.entities.DocumentFamille.list('-created_date', 10),
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences_dashboard', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.PreferencesDashboard.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const isLoading = userLoading || profilLoading || grossesseLoading || enfantsLoading || rdvLoading;

  if (showOnboarding && !profilMaman) {
    return (
      <ParcoursGuideMaman
        onComplete={() => setShowOnboarding(false)}
        userEmail={user?.email}
      />
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const getSemaineGrossesse = () => {
    if (!grossesse) return null;
    const semaines = differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle));
    return semaines;
  };

  const widgetsActifs = preferences?.widgets_actifs || [
    'grossesse', 'prochains_rdv', 'documents_recents', 'alertes_ia', 'enfants', 'rappels'
  ];

  return (
    <PageTransition type="fade">
      <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        <div className="p-4 space-y-4 max-w-7xl mx-auto">
          
          {/* Bienvenue avec bouton personnaliser */}
          <Card className="shadow-lg border-none bg-gradient-to-r from-pink-100 to-purple-100 overflow-hidden scale-in">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 break-words">
                    Bonjour {profilMaman?.display_name || user?.full_name?.split(' ')[0] || 'Maman'} ! 👋
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 break-words">
                    Votre tableau de bord personnalisé
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRapportPDF(true)}
                    className="bg-white/80 backdrop-blur-sm flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Rapport PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonnaliser(true)}
                    className="bg-white/80 backdrop-blur-sm flex-shrink-0"
                  >
                    <Settings className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Personnaliser</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suivi de Grossesse - Section complète */}
          {(grossesse || widgetsActifs.includes('grossesse')) && (
            <SectionSuiviGrossesse grossesse={grossesse} userEmail={user?.email} />
          )}

          {/* Grille de widgets personnalisables */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgetsActifs.includes('grossesse') && grossesse && (
              <WidgetGrossesse grossesse={grossesse} />
            )}

            {widgetsActifs.includes('prochains_rdv') && (
              <WidgetProchainsRDV 
                rendezVous={mesRendezVous} 
                professionnels={professionnels}
              />
            )}

            {widgetsActifs.includes('documents_recents') && (
              <WidgetDocumentsRecents 
                documents={documents}
                enfants={enfants}
              />
            )}

            {widgetsActifs.includes('alertes_ia') && (
              <WidgetAlertesIA 
                grossesse={grossesse}
                enfants={enfants}
              />
            )}

            {widgetsActifs.includes('enfants') && (
              <WidgetEnfants enfants={enfants} />
            )}

            {widgetsActifs.includes('rappels') && (
              <div className="md:col-span-2 lg:col-span-3">
                <RappelsWidget userEmail={user?.email} />
              </div>
            )}
          </div>

          {/* Conseils personnalisés IA */}
          <ConseilsPersonnalises 
            profil={profilMaman}
            grossesse={grossesse}
            enfants={enfants}
          />

          {showPersonnaliser && (
            <PersonnaliserWidgets
              preferences={preferences}
              onClose={() => setShowPersonnaliser(false)}
            />
          )}

          {showRapportPDF && (
            <GenererRapportPDF onClose={() => setShowRapportPDF(false)} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}