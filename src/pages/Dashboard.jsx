import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import DashboardMaman from "./DashboardMaman";
import DashboardProfessionnel from "./DashboardProfessionnel";
import AuthGuard from "../components/auth/AuthGuard";

export default function Dashboard() {
  // Mode léger stocké dans localStorage
  const isLightMode = localStorage.getItem('alo_light_mode') === 'true';
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const isSpecialist = !!profiles?.pro;

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