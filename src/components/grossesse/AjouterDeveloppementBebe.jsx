import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Baby } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { toast } from "sonner";

export default function AjouterDeveloppementBebe({ grossesse, semainesGrossesse, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    semaine_amenorrhee: semainesGrossesse || 0,
    date_mesure: new Date().toISOString().split('T')[0],
    taille_estimee_cm: '',
    poids_estime_g: '',
    perimetre_cranien_mm: '',
    longueur_femorale_mm: '',
    diametre_biparietal_mm: '',
    source: 'echographie',
    notes: ''
  });

  const ajouterMutation = useMutation({
    mutationFn: async () => {
      const developpementsActuels = grossesse.developpement_bebe || [];
      const nouveauDeveloppement = {
        ...formData,
        semaine_amenorrhee: parseInt(formData.semaine_amenorrhee),
        taille_estimee_cm: formData.taille_estimee_cm ? parseFloat(formData.taille_estimee_cm) : null,
        poids_estime_g: formData.poids_estime_g ? parseFloat(formData.poids_estime_g) : null,
        perimetre_cranien_mm: formData.perimetre_cranien_mm ? parseFloat(formData.perimetre_cranien_mm) : null,
        longueur_femorale_mm: formData.longueur_femorale_mm ? parseFloat(formData.longueur_femorale_mm) : null,
        diametre_biparietal_mm: formData.diametre_biparietal_mm ? parseFloat(formData.diametre_biparietal_mm) : null,
      };

      await base44.entities.SuiviGrossesse.update(grossesse.id, {
        developpement_bebe: [...developpementsActuels, nouveauDeveloppement]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      toast.success('Développement enregistré');
      onClose();
    },
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Développement du bébé" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <form onSubmit={(e) => { e.preventDefault(); ajouterMutation.mutate(); }} className="space-y-6">
          {/* Date et semaine */}
          <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de mesure</Label>
                  <Input
                    type="date"
                    value={formData.date_mesure}
                    onChange={(e) => setFormData({ ...formData, date_mesure: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Semaine SA</Label>
                  <Input
                    type="number"
                    value={formData.semaine_amenorrhee}
                    onChange={(e) => setFormData({ ...formData, semaine_amenorrhee: e.target.value })}
                    placeholder="SA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mesures principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Baby className="w-5 h-5 text-pink-600" />
              Mesures du bébé
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taille (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.taille_estimee_cm}
                  onChange={(e) => setFormData({ ...formData, taille_estimee_cm: e.target.value })}
                  placeholder="Ex: 25.3"
                />
              </div>
              <div>
                <Label>Poids (g)</Label>
                <Input
                  type="number"
                  value={formData.poids_estime_g}
                  onChange={(e) => setFormData({ ...formData, poids_estime_g: e.target.value })}
                  placeholder="Ex: 500"
                />
              </div>
            </div>
          </div>

          {/* Mesures biométriques */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Mesures biométriques (optionnel)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Périmètre crânien (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.perimetre_cranien_mm}
                  onChange={(e) => setFormData({ ...formData, perimetre_cranien_mm: e.target.value })}
                  placeholder="PC"
                />
              </div>
              <div>
                <Label>Longueur fémorale (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.longueur_femorale_mm}
                  onChange={(e) => setFormData({ ...formData, longueur_femorale_mm: e.target.value })}
                  placeholder="LF"
                />
              </div>
            </div>

            <div>
              <Label>Diamètre bipariétal (mm)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.diametre_biparietal_mm}
                onChange={(e) => setFormData({ ...formData, diametre_biparietal_mm: e.target.value })}
                placeholder="BIP"
              />
            </div>
          </div>

          {/* Source et notes */}
          <div className="space-y-4">
            <div>
              <Label>Source des données</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="echographie">Échographie</SelectItem>
                  <SelectItem value="estimation">Estimation</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes complémentaires..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={ajouterMutation.isPending || !formData.date_mesure || !formData.semaine_amenorrhee}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {ajouterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}