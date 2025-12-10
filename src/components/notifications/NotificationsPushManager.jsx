import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Settings,
  Check,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPushManager() {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications_push', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }),
    enabled: !!user,
    refetchInterval: 30000, // Polling toutes les 30s
  });

  const notificationsNonLues = notifications.filter(n => !n.lu);

  // Son de notification
  const playNotificationSound = () => {
    if (soundEnabled && typeof Audio !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0ZZbXp6p1NFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg0aZbbp6p1MFAhDm+DwqGgaBzKJ0PPWhTMHHW/B7+KZRg==');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // Afficher les nouvelles notifications
  useEffect(() => {
    const lastCheck = localStorage.getItem('lastNotificationCheck');
    const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
    
    const newNotifications = notifications.filter(n => 
      !n.lu && new Date(n.created_date).getTime() > lastCheckTime
    );

    if (newNotifications.length > 0 && pushEnabled) {
      newNotifications.forEach(notif => {
        playNotificationSound();
        
        toast(notif.titre, {
          description: notif.message,
          duration: 5000,
          action: notif.lien ? {
            label: 'Voir',
            onClick: () => {
              window.location.href = notif.lien;
            }
          } : undefined
        });
      });
    }

    localStorage.setItem('lastNotificationCheck', Date.now().toString());
  }, [notifications, pushEnabled]);

  // Demander permission notifications navigateur
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications activées');
      }
    }
  };

  useEffect(() => {
    if (pushEnabled) {
      requestNotificationPermission();
    }
  }, [pushEnabled]);

  const marquerCommeLu = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { lu: true });
    queryClient.invalidateQueries(['notifications_push']);
  };

  const marquerToutLu = async () => {
    const promises = notificationsNonLues.map(n => 
      base44.entities.Notification.update(n.id, { lu: true })
    );
    await Promise.all(promises);
    queryClient.invalidateQueries(['notifications_push']);
    toast.success('Toutes les notifications marquées comme lues');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'rappel_rdv': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'resultat_medical': return <FileText className="w-5 h-5 text-green-500" />;
      case 'dmp': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'alerte_risque': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'moyenne': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications Push ({notificationsNonLues.length} non lues)
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={marquerToutLu}
                disabled={notificationsNonLues.length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Tout marquer lu
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Paramètres */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={setPushEnabled}
                  id="push-enabled"
                />
                <Label htmlFor="push-enabled">Notifications push</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  id="sound-enabled"
                />
                <Label htmlFor="sound-enabled">Son</Label>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Aucune notification</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border ${
                    !notif.lu ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notif.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{notif.titre}</p>
                        <Badge className={getPriorityColor(notif.priority)}>
                          {notif.priority}
                        </Badge>
                        {!notif.lu && (
                          <Badge className="bg-blue-500 text-white">Nouveau</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.created_date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {notif.lien && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = notif.lien}
                        >
                          Voir
                        </Button>
                      )}
                      {!notif.lu && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => marquerCommeLu(notif.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}