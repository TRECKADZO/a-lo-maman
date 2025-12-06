import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Calendar,
  MessageSquare,
  Users,
  Heart,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';

const iconMap = {
  rendez_vous_confirmation: Calendar,
  rendez_vous_rappel: Calendar,
  rendez_vous_annulation: Calendar,
  message_nouveau: MessageSquare,
  message_reponse: MessageSquare,
  communaute_reponse: Users,
  communaute_vote: Users,
  communaute_reponse_utile: Users,
  vaccin_rappel: Heart,
  grossesse_jalon: Heart,
  enfant_jalon: Heart,
  alerte_sante: AlertCircle,
  assistant_ia: Sparkles,
  systeme: Bell
};

const priorityColors = {
  basse: 'from-gray-400 to-gray-500',
  normale: 'from-blue-400 to-blue-500',
  haute: 'from-orange-400 to-orange-500',
  urgente: 'from-red-500 to-red-600'
};

/**
 * Toast notifications qui apparaissent en bas à droite
 * Affiche les nouvelles notifications en temps réel
 */
export default function NotificationToast() {
  const navigate = useNavigate();
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { destinataire_email: user.email },
        '-created_date',
        10
      );
      return notifs;
    },
    enabled: !!user,
    refetchInterval: 5000, // Vérifier toutes les 5 secondes
  });

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = notifications[0];
      
      // Nouvelle notification détectée
      if (lastNotificationId !== latestNotif.id && !latestNotif.lu) {
        setLastNotificationId(latestNotif.id);
        
        // Ajouter aux notifications affichées
        setDisplayedNotifications(prev => {
          // Ne garder que les 3 dernières
          const updated = [latestNotif, ...prev].slice(0, 3);
          return updated;
        });

        // Auto-supprimer après 8 secondes
        setTimeout(() => {
          removeNotification(latestNotif.id);
        }, 8000);
      }
    }
  }, [notifications, lastNotificationId]);

  const removeNotification = (id) => {
    setDisplayedNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = async (notification) => {
    // Marquer comme lu
    try {
      await base44.entities.Notification.update(notification.id, { lu: true });
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }

    // Naviguer
    if (notification.action_page) {
      let url = createPageUrl(notification.action_page);
      if (notification.action_params) {
        const params = new URLSearchParams(notification.action_params);
        url += `?${params.toString()}`;
      }
      navigate(url);
    }

    removeNotification(notification.id);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence>
        {displayedNotifications.map((notification) => {
          const Icon = iconMap[notification.type] || Bell;
          const gradient = priorityColors[notification.priorite] || priorityColors.normale;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <Card 
                className="w-96 shadow-2xl border-none overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">
                          {notification.titre}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.priorite === 'urgente' && (
                        <Badge className="mt-2 bg-red-600 text-white text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}