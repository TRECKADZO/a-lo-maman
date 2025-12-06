import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Save, Loader2, Edit } from 'lucide-react';

export default function EditerRappel({ rappel, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type_rappel: rappel.type_rappel,
    titre: rappel.titre,
    description: rappel.description || '',
    date_heure_rappel: rappel.date_heure_rappel,
    frequence: rappel.frequence,
    priorite: rappel.priorite,
    son_actif: rappel.son_actif !== false,
    vibration_active: rappel.vibration_active !== false,
    medicament_nom: rappel.medicament_nom || '',
    medicament_dosage: rappel.medicament_dosage || '',
    metrique_type: rappel.metrique_type || 'poids'
  });

  const modifierRappelMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RappelSante.update(rappel.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_sante'] });
      alert('✅ Rappel modifié avec succès !');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    modifierRappelMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-6 h-6 text-purple-600" />
              <span className="truncate">Modifier le rappel</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date et heure *</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_heure_rappel}
                  onChange={(e) => setFormData({ ...formData, date_heure_rappel: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <select
                  value={formData.priorite}
                  onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Son</Label>
                <Switch
                  checked={formData.son_actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, son_actif: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Vibration</Label>
                <Switch
                  checked={formData.vibration_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, vibration_active: checked })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={modifierRappelMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {modifierRappelMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}