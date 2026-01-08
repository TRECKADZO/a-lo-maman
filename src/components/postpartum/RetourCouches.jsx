import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplet, Calendar, Save, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function RetourCouches({ suivi }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(!suivi.retour_couches?.date_retour);
  const [formData, setFormData] = useState({
    date_retour: suivi.retour_couches?.date_retour || '',
    allaitement: suivi.retour_couches?.allaitement || false,
    notes: suivi.retour_couches?.notes || ''
  });

  const enregistrerMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SuiviPostPartum.update(suivi.id, {
        retour_couches: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suivi_postpartum']);
      toast.success('Retour de couches enregistré');
      setShowForm(false);
    }
  });

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600" />
            Retour de couches
          </h3>
          {suivi.retour_couches?.date_retour && !showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Modifier
            </Button>
          )}
        </div>

        {!showForm && suivi.retour_couches?.date_retour ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
              <Calendar className="w-5 h-5 text-rose-600" />
              <div>
                <p className="text-xs text-gray-500">Date du retour</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(suivi.retour_couches.date_retour), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            
            {suivi.retour_couches.allaitement && (
              <Badge className="bg-blue-100 text-blue-800">
                Sous allaitement
              </Badge>
            )}
            
            {suivi.retour_couches.notes && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">{suivi.retour_couches.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Date du retour de couches</Label>
              <Input
                type="date"
                value={formData.date_retour}
                onChange={(e) => setFormData({ ...formData, date_retour: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="allaitement"
                checked={formData.allaitement}
                onCheckedChange={(checked) => setFormData({ ...formData, allaitement: checked })}
              />
              <Label htmlFor="allaitement" className="cursor-pointer">
                Sous allaitement
              </Label>
            </div>

            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observations, symptômes..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              {suivi.retour_couches?.date_retour && (
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </Button>
              )}
              <Button
                onClick={() => enregistrerMutation.mutate()}
                disabled={enregistrerMutation.isPending || !formData.date_retour}
                className="flex-1 bg-rose-600 hover:bg-rose-700"
              >
                {enregistrerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}