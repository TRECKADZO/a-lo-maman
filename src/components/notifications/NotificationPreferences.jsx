import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Calendar,
  UserCheck,
  Heart,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings
} from 'lucide-react';

// Configuration détaillée des préférences de notifications
const NOTIFICATION_CATEGORIES = [
  {
    key: 'rendez_vous',
    label: 'Rendez-vous',
    description: 'Nouveaux RDV, modifications, annulations',
    icon: Calendar,
    color: 'text-blue-600',
    subPreferences: [
      {
        key: 'rappel_rendez_vous_24h',
        label: 'Rappel 24h avant',
        description: 'Recevoir un rappel la veille du RDV'
      },
      {
        key: 'rappel_rendez_vous_1h',
        label: 'Rappel 1h avant',
        description: 'Recevoir un rappel juste avant le RDV'
      },
      {
        key: 'nouveau_rendez_vous',
        label: 'Nouveaux rendez-vous',
        description: 'Notification lors d\'une nouvelle réservation'
      },
      {
        key: 'modification_rendez_vous',
        label: 'Modifications de RDV',
        description: 'Notification en cas de modification'
      },
      {
        key: 'annulation_rendez_vous',
        label: 'Annulations de RDV',
        description: 'Notification en cas d\'annulation'
      }
    ]
  },
  {
    key: 'messages',
    label: 'Messagerie',
    description: 'Messages privés avec les spécialistes',
    icon: MessageSquare,
    color: 'text-orange-600',
    subPreferences: [
      {
        key: 'nouveau_message',
        label: 'Nouveaux messages',
        description: 'Notification pour chaque nouveau message'
      },
      {
        key: 'reponse_message',
        label: 'Réponses aux messages',
        description: 'Notification quand on répond à vos messages'
      }
    ]
  },
  {
    key: 'communaute',
    label: 'Communauté',
    description: 'Forum et discussions',
    icon: UserCheck,
    color: 'text-purple-600',
    subPreferences: [
      {
        key: 'communaute_reponses',
        label: 'Réponses à mes posts',
        description: 'Notification quand quelqu\'un répond'
      },
      {
        key: 'communaute_mentions',
        label: 'Mentions',
        description: 'Notification quand vous êtes mentionné'
      },
      {
        key: 'communaute_votes',
        label: 'Votes et réactions',
        description: 'Notification pour les upvotes et réactions'
      },
      {
        key: 'reponse_utile',
        label: 'Réponse marquée utile',
        description: 'Quand votre réponse aide quelqu\'un'
      }
    ]
  },
  {
    key: 'sante',
    label: 'Santé et Suivi',
    description: 'Rappels médicaux et suivis',
    icon: Heart,
    color: 'text-red-600',
    subPreferences: [
      {
        key: 'rappels_vaccins',
        label: 'Rappels de vaccination',
        description: 'Notifications pour les vaccins à venir'
      },
      {
        key: 'rappels_medicaments',
        label: 'Prise de médicaments',
        description: 'Rappels pour la prise de médicaments'
      },
      {
        key: 'jalons_grossesse',
        label: 'Jalons de grossesse',
        description: 'Étapes importantes de la grossesse'
      },
      {
        key: 'jalons_enfant',
        label: 'Jalons de développement',
        description: 'Étapes de développement de l\'enfant'
      }
    ]
  },
  {
    key: 'assistant_ia',
    label: 'Assistant IA',
    description: 'Conseils et recommandations',
    icon: AlertCircle,
    color: 'text-indigo-600',
    subPreferences: [
      {
        key: 'conseils_ia',
        label: 'Conseils personnalisés',
        description: 'Recommandations de l\'assistant IA'
      },
      {
        key: 'alertes_sante',
        label: 'Alertes santé',
        description: 'Alertes importantes détectées par l\'IA'
      }
    ]
  }
];

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Utiliser ProfilMaman au lieu de UserProfile
  const { data: profilMaman, isLoading } = useQuery({
    queryKey: ['profilMaman', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences) => {
      if (!profilMaman) return;
      await base44.entities.ProfilMaman.update(profilMaman.id, {
        preferences_notifications: newPreferences
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profilMaman'] });
    },
  });

  const preferences = profilMaman?.preferences_notifications || {
    rendez_vous: true,
    rappel_rendez_vous_24h: true,
    rappel_rendez_vous_1h: true,
    nouveau_rendez_vous: true,
    modification_rendez_vous: true,
    annulation_rendez_vous: true,
    messages: true,
    nouveau_message: true,
    reponse_message: true,
    communaute: true,
    communaute_reponses: true,
    communaute_mentions: true,
    communaute_votes: false,
    reponse_utile: true,
    sante: true,
    rappels_vaccins: true,
    rappels_medicaments: true,
    jalons_grossesse: true,
    jalons_enfant: true,
    assistant_ia: true,
    conseils_ia: true,
    alertes_sante: true,
    notifications_push: true,
    notifications_email: false,
    notifications_sms: false,
  };

  const handleToggleCategory = (categoryKey, value) => {
    const newPreferences = { ...preferences, [categoryKey]: value };
    updatePreferencesMutation.mutate(newPreferences);
  };

  const handleToggleSubPreference = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    updatePreferencesMutation.mutate(newPreferences);
  };

  const handleToggleChannel = (channelKey, value) => {
    const newPreferences = { ...preferences, [channelKey]: value };
    updatePreferencesMutation.mutate(newPreferences);
  };

  const handleEnableAll = () => {
    const allEnabled = { ...preferences };
    NOTIFICATION_CATEGORIES.forEach(category => {
      allEnabled[category.key] = true;
      category.subPreferences?.forEach(sub => {
        allEnabled[sub.key] = true;
      });
    });
    allEnabled.notifications_push = true;
    updatePreferencesMutation.mutate(allEnabled);
  };

  const handleDisableAll = () => {
    const allDisabled = { ...preferences };
    NOTIFICATION_CATEGORIES.forEach(category => {
      allDisabled[category.key] = false;
      category.subPreferences?.forEach(sub => {
        allDisabled[sub.key] = false;
      });
    });
    updatePreferencesMutation.mutate(allDisabled);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-none bg-card mt-6">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-none bg-card mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Préférences de notifications
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableAll}
              disabled={updatePreferencesMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tout activer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableAll}
              disabled={updatePreferencesMutation.isPending}
            >
              <BellOff className="w-4 h-4 mr-2" />
              Tout désactiver
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Canaux de communication */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Canaux de notification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 transition-all ${
              preferences.notifications_push 
                ? 'border-purple-300 bg-purple-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className={`w-5 h-5 ${preferences.notifications_push ? 'text-purple-600' : 'text-gray-400'}`} />
                  <Label className="font-semibold">Notifications push</Label>
                </div>
                <Switch
                  checked={preferences.notifications_push}
                  onCheckedChange={(checked) => handleToggleChannel('notifications_push', checked)}
                />
              </div>
              <p className="text-xs text-gray-600">Dans l'application</p>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${
              preferences.notifications_email 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className={`w-5 h-5 ${preferences.notifications_email ? 'text-blue-600' : 'text-gray-400'}`} />
                  <Label className="font-semibold">Email</Label>
                </div>
                <Switch
                  checked={preferences.notifications_email}
                  onCheckedChange={(checked) => handleToggleChannel('notifications_email', checked)}
                />
              </div>
              <p className="text-xs text-gray-600">Par email</p>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${
              preferences.notifications_sms 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-5 h-5 ${preferences.notifications_sms ? 'text-green-600' : 'text-gray-400'}`} />
                  <Label className="font-semibold">SMS</Label>
                </div>
                <Switch
                  checked={preferences.notifications_sms}
                  onCheckedChange={(checked) => handleToggleChannel('notifications_sms', checked)}
                />
              </div>
              <p className="text-xs text-gray-600">Par SMS</p>
              <Badge variant="outline" className="text-xs mt-2">Bientôt disponible</Badge>
            </div>
          </div>
        </div>

        {/* Catégories de notifications */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Types de notifications</h3>
          </div>

          {NOTIFICATION_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isEnabled = preferences[category.key];

            return (
              <Card key={category.key} className={`transition-all ${
                isEnabled ? 'border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50' : 'bg-gray-50'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-white' : 'bg-gray-200'}`}>
                        <Icon className={`w-5 h-5 ${isEnabled ? category.color : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{category.label}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleCategory(category.key, checked)}
                    />
                  </div>
                </CardHeader>

                {isEnabled && category.subPreferences && (
                  <CardContent>
                    <div className="space-y-3 pl-4 border-l-2 border-pink-200">
                      {category.subPreferences.map((sub) => (
                        <div key={sub.key} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <Label className="font-medium">{sub.label}</Label>
                            <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                          </div>
                          <Switch
                            checked={preferences[sub.key]}
                            onCheckedChange={(checked) => handleToggleSubPreference(sub.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Message de sauvegarde */}
        {updatePreferencesMutation.isSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Vos préférences de notifications ont été enregistrées avec succès !
            </AlertDescription>
          </Alert>
        )}

        {/* Info sur les notifications */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>💡 Conseil :</strong> Les modifications sont sauvegardées automatiquement. Vous pouvez modifier vos préférences à tout moment.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}