import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, Info, Loader2 } from 'lucide-react';

export default function WidgetNotifications({ user }) {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications_pro', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      // Récupérer les rappels non notifiés
      const rappels = await base44.entities.RappelSuiviPersonnalise.filter({
        patient_email: user.email,
        statut: 'actif'
      }).catch(() => []);

      const notifications = [];

      // Ajouter les rappels dus
      rappels.forEach(rappel => {
        const datePrevue = new Date(rappel.date_prevue);
        const aujourd = new Date();
        const joursRestants = Math.ceil((datePrevue - aujourd) / (1000 * 60 * 60 * 24));

        if (joursRestants <= 3 && joursRestants > 0) {
          notifications.push({
            id: rappel.id,
            type: 'rappel',
            titre: rappel.titre,
            message: `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`,
            urgence: joursRestants <= 1 ? 'urgent' : 'normal'
          });
        }
      });

      return notifications.sort((a, b) => {
        const urgenceScore = { urgent: 3, haute: 2, normal: 1 };
        return (urgenceScore[b.urgence] || 0) - (urgenceScore[a.urgence] || 0);
      }).slice(0, 5);
    },
    enabled: !!user,
    refetchInterval: 300000
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune notification</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const Icon = notif.urgence === 'urgent' ? AlertTriangle : Info;
              const colorClass = notif.urgence === 'urgent' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50';
              
              return (
                <Alert key={notif.id} className={colorClass}>
                  <Icon className={`w-4 h-4 ${notif.urgence === 'urgent' ? 'text-red-600' : 'text-blue-600'}`} />
                  <AlertDescription className="text-sm">
                    <p className="font-semibold">{notif.titre}</p>
                    <p className="text-xs text-gray-600">{notif.message}</p>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}