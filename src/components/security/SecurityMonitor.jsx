import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Composant de monitoring de sécurité
 * Surveille les activités suspectes et crée des alertes automatiques
 */
export default function SecurityMonitor() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (!user) return;

    // Logger la connexion utilisateur
    const logSession = async () => {
      try {
        // Créer un log d'audit pour la session
        await base44.entities.AuditLog.create({
          user_email: user.email,
          user_role: user.role,
          action: 'read',
          entity_type: 'Session',
          details: {
            session_start: new Date().toISOString(),
            platform: navigator.platform,
            language: navigator.language
          },
          ip_address: 'client',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('⚠️ Erreur log session:', error);
      }
    };

    logSession();

    // Vérifier périodiquement l'activité suspecte
    const checkInterval = setInterval(async () => {
      try {
        // Vérifier les logs d'audit récents de l'utilisateur
        const logs = await base44.entities.AuditLog.filter({
          user_email: user.email
        });

        const recentLogs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          const now = new Date();
          return (now - logDate) < 5 * 60 * 1000; // dernières 5 minutes
        });

        // Alerte si trop d'actions en peu de temps
        if (recentLogs.length > 50) {
          console.warn('⚠️ Activité suspecte détectée:', user.email);
        }
      } catch (error) {
        console.warn('⚠️ Erreur check sécurité:', error);
      }
    }, 60000); // Vérifier chaque minute

    return () => clearInterval(checkInterval);
  }, [user]);

  return null; // Composant invisible
}