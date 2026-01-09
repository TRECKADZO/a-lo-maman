import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, Grid3x3, Trash2 } from 'lucide-react';
import WidgetRDV from './WidgetRDV';
import WidgetStats from './WidgetStats';
import WidgetRevenu from './WidgetRevenu';
import WidgetNotifications from './WidgetNotifications';
import WidgetPatientsEtat from './WidgetPatientsEtat';

const WIDGETS_DISPONIBLES = [
  { id: 'prochains_rdv', nom: 'Prochains RDV', icon: '📅' },
  { id: 'notifications', nom: 'Notifications', icon: '🔔' },
  { id: 'patients_critiques', nom: 'Patients urgents', icon: '⚠️' },
  { id: 'stats_activite', nom: 'Statistiques', icon: '📊' },
  { id: 'revenus', nom: 'Revenus', icon: '💰' },
  { id: 'messages', nom: 'Messages', icon: '💬' },
];

export default function DashboardPersonnalise({ professional, user }) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const queryClient = useQueryClient();

  // Récupérer la configuration des widgets
  const { data: widgetConfig, isLoading } = useQuery({
    queryKey: ['dashboard_widgets', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const widgets = await base44.entities.DashboardWidget.filter({
        user_email: user.email
      }).catch(() => []);
      
      if (widgets.length === 0) {
        // Configuration par défaut
        return ['prochains_rdv', 'notifications', 'stats_activite', 'revenus'];
      }
      return widgets.filter(w => w.visible).map(w => w.type).sort((a, b) => {
        const widgetA = widgets.find(w => w.type === a);
        const widgetB = widgets.find(w => w.type === b);
        return (widgetA?.position || 0) - (widgetB?.position || 0);
      });
    },
    enabled: !!user
  });

  // Sauvegarder la configuration
  const saveMutation = useMutation({
    mutationFn: async (widgets) => {
      const promises = widgets.map((widgetId, idx) =>
        base44.entities.DashboardWidget.filter({
          user_email: user.email,
          type: widgetId
        }).then(existing => {
          const data = { user_email: user.email, type: widgetId, position: idx, visible: true };
          if (existing.length > 0) {
            return base44.entities.DashboardWidget.update(existing[0].id, data);
          } else {
            return base44.entities.DashboardWidget.create(data);
          }
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_widgets'] });
      setShowSettings(false);
    }
  });

  useEffect(() => {
    if (widgetConfig) {
      setSelectedWidgets(widgetConfig);
    }
  }, [widgetConfig]);

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'prochains_rdv':
        return <WidgetRDV professional={professional} />;
      case 'stats_activite':
        return <WidgetStats professional={professional} />;
      case 'revenus':
        return <WidgetRevenu professional={professional} />;
      case 'notifications':
        return <WidgetNotifications user={user} />;
      case 'patients_critiques':
        return <WidgetPatientsEtat professional={professional} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Personnaliser
        </Button>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
        {selectedWidgets.map(widgetId => (
          <div key={widgetId}>
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>

      {/* Dialog paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Personnaliser le dashboard
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {WIDGETS_DISPONIBLES.map(widget => (
              <label key={widget.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={selectedWidgets.includes(widget.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedWidgets([...selectedWidgets, widget.id]);
                    } else {
                      setSelectedWidgets(selectedWidgets.filter(id => id !== widget.id));
                    }
                  }}
                />
                <span className="text-2xl">{widget.icon}</span>
                <span className="flex-1 font-medium">{widget.nom}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate(selectedWidgets)}
              disabled={saveMutation.isPending}
              className="flex-1 bg-teal-600"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Appliquer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}