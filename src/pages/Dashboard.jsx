import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardMaman from "./DashboardMaman";
import DashboardProfessionnel from "./DashboardProfessionnel";
import AuthGuard from "../components/auth/AuthGuard";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Mode léger stocké dans localStorage
  const isLightMode = localStorage.getItem('alo_light_mode') === 'true';
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null, centre: null };
      
      console.log('🔍 Dashboard - Récupération profils pour:', user.email);
      
      const [mamanProfiles, proProfiles, centreProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => []),
        base44.entities.Clinique.filter({
          $or: [
            { administrateurs: { $in: [user.email] } },
            { administrateur_email: user.email },
            { created_by: user.email }
          ]
        }).catch(() => [])
      ]);
      
      console.log('📊 Dashboard - Centres trouvés:', centreProfiles.length);
      
      const proProfil = proProfiles.find(p => p.email === user.email);
      const centreProfil = centreProfiles[0] || null;
      
      if (centreProfil) {
        console.log('✅ Dashboard - Centre détecté:', centreProfil.nom, '- Statut:', centreProfil.statut_validation);
      }
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null,
        centre: centreProfil || null
      };
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  const isLoading = userLoading || profilesLoading;

  // Redirection si pas de profil
  React.useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate(createPageUrl('Intro'), { replace: true });
      return;
    }

    const activeProfile = profiles?.centre || profiles?.pro || profiles?.maman;
    const isAdmin = user?.role === 'admin';
    
    if (!activeProfile && !isAdmin) {
      console.log('➡️ Dashboard - Pas de profil, redirect vers SelectionCompte');
      navigate(createPageUrl('SelectionCompte'), { replace: true });
    }
  }, [user, profiles, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const profilCentre = profiles?.centre;
  const isSpecialist = !profilCentre && !!profiles?.pro; // Specialist seulement si pas centre

  // PRIORITÉ 1 : Affichage pour centres de santé (SANS AuthGuard pour éviter redirection)
  if (profilCentre) {
    console.log('🏥 Dashboard - Affichage centre:', profilCentre.nom);
    
    // Vérifier si onboarding est complété
    const needsOnboarding = profilCentre.statut_validation === 'approuve' && !profilCentre.onboarding_completed;

    if (needsOnboarding) {
      const OnboardingCentre = React.lazy(() => import('../components/centre/OnboardingCentre'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
          <OnboardingCentre
            centre={profilCentre}
            onComplete={() => window.location.reload()}
          />
        </React.Suspense>
      );
    }

    // Centre validé et onboarding complété
    if (profilCentre.statut_validation === 'approuve') {
      const DashboardCentre = React.lazy(() => import('../components/centre/DashboardCentre'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
          <DashboardCentre centre={profilCentre} />
        </React.Suspense>
      );
    }

    // Centre en attente ou rejeté
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
        <Card className="max-w-2xl mx-auto shadow-xl border-none">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bienvenue {profilCentre.nom} !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre demande d'inscription est en cours de validation par notre équipe.
            </p>
            <Badge className={`text-lg px-4 py-2 ${
              profilCentre.statut_validation === 'approuve' ? 'bg-green-100 text-green-800' :
              profilCentre.statut_validation === 'rejete' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {profilCentre.statut_validation === 'approuve' ? '✅ Approuvé' :
               profilCentre.statut_validation === 'rejete' ? '❌ Rejeté' :
               '⏳ En attente de validation'}
            </Badge>
            {profilCentre.statut_validation === 'en_attente' && (
              <p className="text-sm text-gray-500 mt-4">
                Vous serez notifié par email une fois votre centre approuvé.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode léger pour connexions 2G
  if (isLightMode && !isSpecialist) {
    const LightDashboard = React.lazy(() => import("../components/light/LightDashboard"));
    return (
      <AuthGuard>
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>}>
          <LightDashboard />
        </React.Suspense>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {isSpecialist ? <DashboardProfessionnel /> : <DashboardMaman />}
    </AuthGuard>
  );
}