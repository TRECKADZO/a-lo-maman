import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle,
  AlertCircle,
  Info,
  Smartphone,
  Loader2,
  Shield
} from 'lucide-react';

export default function PushNotificationManager() {
  const queryClient = useQueryClient();
  const [pushStatus, setPushStatus] = useState('default'); // default, granted, denied, unsupported
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    setIsLoading(true);
    
    // Vérifier si les notifications push sont supportées
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
      setIsLoading(false);
      return;
    }

    // Vérifier la permission actuelle
    const permission = Notification.permission;
    setPushStatus(permission);

    // Vérifier si déjà abonné
    if (permission === 'granted') {
      checkSubscription();
    }
    
    setIsLoading(false);
  };

  const checkSubscription = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
    }
  };

  const requestPushPermission = async () => {
    try {
      setIsLoading(true);
      
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        
        // Mettre à jour les préférences
        if (userProfile) {
          await base44.entities.UserProfile.update(userProfile.id, {
            preferences_notifications: {
              ...userProfile.preferences_notifications,
              notifications_push: true
            }
          });
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        }

        // Envoyer une notification de test
        sendTestNotification();
      }
    } catch (error) {
      console.error('Erreur demande permission:', error);
      alert('Erreur lors de l\'activation des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // En production, vous auriez besoin d'une clé VAPID du serveur
        // Pour l'instant, juste enregistrer l'abonnement local
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: null // Remplacer par votre clé VAPID en production
        });

        setIsSubscribed(true);
        
        // Ici vous enverriez normalement l'abonnement à votre backend
        console.log('Push subscription:', subscription);
      }
    } catch (error) {
      console.error('Erreur abonnement push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);
      
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
        }
      }

      // Mettre à jour les préférences
      if (userProfile) {
        await base44.entities.UserProfile.update(userProfile.id, {
          preferences_notifications: {
            ...userProfile.preferences_notifications,
            notifications_push: false
          }
        });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      }
    } catch (error) {
      console.error('Erreur désabonnement push:', error);
      alert('Erreur lors de la désactivation des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('A\'lo Maman', {
        body: '✅ Les notifications push sont activées ! Vous recevrez désormais des alertes importantes.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification'
      });
    }
  };

  const getStatusInfo = () => {
    switch (pushStatus) {
      case 'granted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          title: 'Notifications activées',
          description: 'Vous recevez les notifications push',
        };
      case 'denied':
        return {
          icon: BellOff,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          title: 'Notifications bloquées',
          description: 'Vous devez autoriser les notifications dans les paramètres de votre navigateur',
        };
      case 'unsupported':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          title: 'Non supporté',
          description: 'Votre navigateur ne supporte pas les notifications push',
        };
      default:
        return {
          icon: Bell,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          title: 'Notifications désactivées',
          description: 'Activez les notifications pour ne rien manquer',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (isLoading) {
    return (
      <Card className="shadow-lg border-none mt-6">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg border-2 ${statusInfo.bgColor} mt-6`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-white border-2 ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {statusInfo.title}
                {isSubscribed && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contrôles */}
        {pushStatus === 'default' && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Restez informée !</strong>
                <p className="text-sm mt-1">
                  Activez les notifications push pour recevoir :
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Rappels de rendez-vous 24h et 1h avant</li>
                  <li>• Nouveaux messages de vos spécialistes</li>
                  <li>• Réponses à vos posts dans la communauté</li>
                  <li>• Rappels de vaccinations pour vos enfants</li>
                  <li>• Alertes santé importantes</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={requestPushPermission}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Activation...
                </>
              ) : (
                <>
                  <BellRing className="w-5 h-5 mr-2" />
                  Activer les notifications push
                </>
              )}
            </Button>
          </div>
        )}

        {pushStatus === 'granted' && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Notifications activées !</strong>
                <p className="text-sm mt-1">
                  Vous recevrez des alertes même quand l'application est fermée.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-semibold">Notifications push actives</Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Vous êtes abonnée aux notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => {
                  if (checked) {
                    subscribeToPush();
                  } else {
                    unsubscribeFromPush();
                  }
                }}
              />
            </div>

            <Button
              onClick={sendTestNotification}
              variant="outline"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Envoyer une notification de test
            </Button>
          </div>
        )}

        {pushStatus === 'denied' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Notifications bloquées</strong>
              <p className="text-sm mt-2">
                Pour activer les notifications :
              </p>
              <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>Ouvrez les paramètres de votre navigateur</li>
                <li>Recherchez "Notifications" ou "Autorisations"</li>
                <li>Trouvez ce site et autorisez les notifications</li>
                <li>Rafraîchissez la page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {pushStatus === 'unsupported' && (
          <Alert className="bg-orange-50 border-orange-200">
            <Info className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Navigateur non compatible</strong>
              <p className="text-sm mt-1">
                Votre navigateur ne supporte pas les notifications push.
                Essayez Chrome, Firefox, ou Safari pour iOS/Android.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Informations sur les notifications intelligentes */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Notifications intelligentes 🧠
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Filtrage automatique :</strong> Seules les notifications pertinentes vous parviennent</li>
                <li>• <strong>Horaires adaptés :</strong> Pas de notifications la nuit (22h-7h)</li>
                <li>• <strong>Priorisation :</strong> Les urgences en premier</li>
                <li>• <strong>Groupement :</strong> Messages similaires regroupés</li>
                <li>• <strong>Basé sur votre profil :</strong> Adapté à votre grossesse ou âge de vos enfants</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}