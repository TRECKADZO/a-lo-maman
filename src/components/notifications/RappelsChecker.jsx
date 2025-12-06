import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RappelsNotificationService } from './RappelsNotificationService';

/**
 * Composant invisible qui vérifie périodiquement les rappels
 * À ajouter dans le Layout pour fonctionner en arrière-plan
 */
export default function RappelsChecker() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!user?.email) return;

    // Vérifier immédiatement
    RappelsNotificationService.verifierEtEnvoyerRappels(user.email);

    // Puis vérifier toutes les minutes
    const interval = setInterval(() => {
      RappelsNotificationService.verifierEtEnvoyerRappels(user.email);
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, [user?.email]);

  return null; // Composant invisible
}