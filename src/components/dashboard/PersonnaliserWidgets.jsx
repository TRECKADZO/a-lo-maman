import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { Settings, Loader2, HeartPulse, Calendar, FileText, Brain, Baby, Bell } from "lucide-react";
import { toast } from "sonner";

const WIDGETS_DISPONIBLES = [
  { id: 'grossesse', label: 'Suivi Grossesse', icon: HeartPulse, color: 'text-pink-600' },
  { id: 'prochains_rdv', label: 'Prochains RDV', icon: Calendar, color: 'text-blue-600' },
  { id: 'documents_recents', label: 'Documents récents', icon: FileText, color: 'text-green-600' },
  { id: 'alertes_ia', label: 'Alertes IA', icon: Brain, color: 'text-purple-600' },
  { id: 'enfants', label: 'Mes Enfants', icon: Baby, color: 'text-blue-600' },
  { id: 'rappels', label: 'Rappels', icon: Bell, color: 'text-orange-600' }
];

export default function PersonnaliserWidgets({ preferences, onClose }) {
  const queryClient = useQueryClient();
  const [widgetsActifs, setWidgetsActifs] = useState(
    preferences?.widgets_actifs || WIDGETS_DISPONIBLES.map(w => w.id)
  );

  const toggleWidget = (widgetId) => {
    if (widgetsActifs.includes(widgetId)) {
      setWidgetsActifs(widgetsActifs.filter(w => w !== widgetId));
    } else {
      setWidgetsActifs([...widgetsActifs, widgetId]);
    }
  };

  const sauvegarderMutation = useMutation({
    mutationFn: async () => {
      if (preferences) {
        await base44.entities.PreferencesDashboard.update(preferences.id, {
          widgets_actifs: widgetsActifs
        });
      } else {
        await base44.entities.PreferencesDashboard.create({
          user_email: (await base44.auth.me()).email,
          widgets_actifs: widgetsActifs
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences_dashboard'] });
      toast.success('Préférences enregistrées');
      onClose();
    }
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Personnaliser mon tableau de bord">
      <div className="p-6 space-y-6 pb-32">
        <p className="text-sm text-gray-600">
          Choisissez les widgets à afficher sur votre tableau de bord
        </p>

        <div className="space-y-3">
          {WIDGETS_DISPONIBLES.map((widget) => {
            const Icon = widget.icon;
            const isActive = widgetsActifs.includes(widget.id);
            
            return (
              <div
                key={widget.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  isActive 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <Checkbox
                  id={widget.id}
                  checked={isActive}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={widget.id} className="flex items-center gap-3 cursor-pointer flex-1">
                  <Icon className={`w-5 h-5 ${widget.color}`} />
                  <span className="font-medium text-gray-900">{widget.label}</span>
                </Label>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={() => sauvegarderMutation.mutate()}
            disabled={sauvegarderMutation.isPending || widgetsActifs.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {sauvegarderMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}