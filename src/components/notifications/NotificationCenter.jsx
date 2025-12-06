import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Bell,
  Calendar,
  MessageSquare,
  Users,
  Heart,
  AlertCircle,
  Sparkles,
  Check,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  basse: 'bg-gray-100 border-gray-300',
  normale: 'bg-blue-100 border-blue-300',
  haute: 'bg-orange-100 border-orange-300',
  urgente: 'bg-red-100 border-red-300'
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { destinataire_email: user.email },
        '-created_date',
        50
      );
      return notifs;
    },
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const unreadCount = notifications.filter(n => !n.lu).length;

  const marquerCommeLuMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { lu: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const supprimerNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const marquerToutCommeLuMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.lu);
      await Promise.all(
        unreadNotifs.map(n => base44.entities.Notification.update(n.id, { lu: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    if (!notification.lu) {
      marquerCommeLuMutation.mutate(notification.id);
    }

    // Naviguer vers la page appropriée
    if (notification.action_page) {
      let url = createPageUrl(notification.action_page);
      
      // Ajouter les paramètres si nécessaire
      if (notification.action_params) {
        const params = new URLSearchParams(notification.action_params);
        url += `?${params.toString()}`;
      }
      
      navigate(url);
      setIsOpen(false);
    }
  };

  const groupedNotifications = {
    today: [],
    yesterday: [],
    older: []
  };

  notifications.forEach(notif => {
    const notifDate = new Date(notif.created_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (notifDate.toDateString() === today.toDateString()) {
      groupedNotifications.today.push(notif);
    } else if (notifDate.toDateString() === yesterday.toDateString()) {
      groupedNotifications.yesterday.push(notif);
    } else {
      groupedNotifications.older.push(notif);
    }
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => marquerToutCommeLuMutation.mutate()}
                disabled={marquerToutCommeLuMutation.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y">
            {groupedNotifications.today.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                </div>
                {groupedNotifications.today.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onClick={() => handleNotificationClick(notif)}
                    onDelete={() => supprimerNotificationMutation.mutate(notif.id)}
                  />
                ))}
              </div>
            )}

            {groupedNotifications.yesterday.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Hier</p>
                </div>
                {groupedNotifications.yesterday.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onClick={() => handleNotificationClick(notif)}
                    onDelete={() => supprimerNotificationMutation.mutate(notif.id)}
                  />
                ))}
              </div>
            )}

            {groupedNotifications.older.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Plus ancien</p>
                </div>
                {groupedNotifications.older.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onClick={() => handleNotificationClick(notif)}
                    onDelete={() => supprimerNotificationMutation.mutate(notif.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ notification, onClick, onDelete }) {
  const Icon = iconMap[notification.type] || Bell;
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors relative ${
        !notification.lu ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          priorityColors[notification.priorite] || priorityColors.normale
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm">{notification.titre}</p>
            {!notification.lu && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(notification.created_date), 'HH:mm', { locale: fr })}
          </p>
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
}