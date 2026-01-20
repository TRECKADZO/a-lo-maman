import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard - Composant qui protège les pages et gère la redirection
 * Utilisation: Wrapper autour des pages privées
 */
export default function AuthGuard({ children }) {
  const navigate = useNavigate();

  // 1. Charger l'utilisateur
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        console.log('❌ Auth error:', err);
        return null;
      }
    },
    retry: false,
    staleTime: 0,
  });

  // 2. Charger les profils
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null, centre: null };

      console.log('🔍 AuthGuard - Fetching profiles for:', user.email);

      // Fetch les trois profils en parallèle
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

      // Filter côté client pour le professionnel uniquement
      const proProfil = proProfiles.find(p => p.email === user.email);
      const centreProfil = centreProfiles[0] || null;

      console.log('📊 AuthGuard - Results:', {
        mamanCount: mamanProfiles.length,
        proCount: proProfil ? 1 : 0,
        centreCount: centreProfil ? 1 : 0,
        mamanProfile: mamanProfiles[0]?.id,
        proProfile: proProfil?.id,
        centreProfile: centreProfil?.id
      });

      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null,
        centre: centreProfil || null
      };
    },
    enabled: !!user,
    retry: false,
    staleTime: 0,
  });

  // 3. Déterminer le profil actif (priorité: centre, puis pro, puis maman)
  const activeProfile = profiles?.centre || profiles?.pro || profiles?.maman;
  const isSpecialist = !!profiles?.pro;

  // 4. Gérer les redirections
  React.useEffect(() => {
    if (userLoading || profilesLoading) return;

    // Vérifier si un centre vient d'être créé
    const centreJustCreated = localStorage.getItem('centre_just_created') === 'true';

    console.log('🛡️ AuthGuard - Auth state:', {
      hasUser: !!user,
      hasProfile: !!activeProfile,
      profileType: isSpecialist ? 'PROFESSIONNEL' : (profiles?.maman ? 'MAMAN' : (profiles?.centre ? 'CENTRE' : 'NONE')),
      centreJustCreated
    });

    // Nettoyer le flag si profil trouvé
    if (centreJustCreated && activeProfile) {
      console.log('🧹 Nettoyage flag centre_just_created');
      localStorage.removeItem('centre_just_created');
      localStorage.removeItem('centre_created_id');
    }

    // Pas d'utilisateur -> Intro
    if (!user) {
      console.log('➡️ AuthGuard - No user, redirect to Intro');
      navigate(createPageUrl('Intro'), { replace: true });
      return;
    }

    // Si centre vient d'être créé mais pas encore chargé, attendre max 10s
    if (centreJustCreated && !activeProfile) {
      console.log('⏳ Centre en cours de chargement...');
      const timeout = setTimeout(() => {
        console.log('⚠️ Timeout - Nettoyage des flags et redirection');
        localStorage.removeItem('centre_just_created');
        localStorage.removeItem('centre_created_id');
        navigate(createPageUrl('SelectionCompte'), { replace: true });
      }, 10000);
      
      return () => clearTimeout(timeout);
    }

    // Utilisateur mais pas de profil -> SelectionCompte
    if (!activeProfile) {
      console.log('➡️ AuthGuard - No profile, redirect to SelectionCompte');
      navigate(createPageUrl('SelectionCompte'), { replace: true });
      return;
    }

    console.log('✅ AuthGuard - Access granted!');
  }, [user, activeProfile, userLoading, profilesLoading, navigate, isSpecialist, profiles]);

  // 5. Afficher le loader pendant le chargement
  if (userLoading || profilesLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Vérification de votre profil...</p>
          <p className="text-xs text-gray-400 mt-2">
            {userLoading && '⏳ Connexion...'}
            {profilesLoading && '⏳ Chargement du profil...'}
          </p>
        </div>
      </div>
    );
  }

  // 6. Si pas d'utilisateur ou pas de profil, ne rien afficher (redirection en cours)
  if (!user || !activeProfile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // 7. Tout est OK, rendre les enfants
  return <>{children}</>;
}