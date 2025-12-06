import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Save, Loader2, Bell } from 'lucide-react';

export default function CreerRappel({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type_rappel: 'medicament',
    titre: '',
    description: '',
    date_heure_rappel: '',
    frequence: 'unique',
    heure_rappel: '09:00',
    priorite: 'normale',
    notification_avant: [15],
    son_actif: true,
    vibration_active: true,
    medicament_nom: '',
    medicament_dosage: '',
    metrique_type: 'poids'
  });

  const creerRappelMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RappelSante.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_sante'] });
      alert('✅ Rappel créé avec succès !');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.titre || !formData.date_heure_rappel) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    creerRappelMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span className="truncate">Créer un rappel</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type de rappel *</Label>
              <select
                value={formData.type_rappel}
                onChange={(e) => setFormData({ ...formData, type_rappel: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="medicament">Médicament</option>
                <option value="metrique_sante">Métrique de santé</option>
                <option value="rendez_vous">Rendez-vous</option>
                <option value="vaccination">Vaccination</option>
                <option value="renouvellement_prescription">Renouvellement prescription</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                placeholder="Ex: Prendre Paracétamol"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
              />
            </div>

            {formData.type_rappel === 'medicament' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du médicament</Label>
                    <Input
                      placeholder="Paracétamol"
                      value={formData.medicament_nom}
                      onChange={(e) => setFormData({ ...formData, medicament_nom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      placeholder="500mg"
                      value={formData.medicament_dosage}
                      onChange={(e) => setFormData({ ...formData, medicament_dosage: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {formData.type_rappel === 'metrique_sante' && (
              <div className="space-y-2">
                <Label>Type de métrique</Label>
                <select
                  value={formData.metrique_type}
                  onChange={(e) => setFormData({ ...formData, metrique_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="poids">Poids</option>
                  <option value="tension_arterielle">Tension artérielle</option>
                  <option value="glycemie">Glycémie</option>
                  <option value="temperature">Température</option>
                  <option value="frequence_cardiaque">Fréquence cardiaque</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Instructions ou notes..."
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
                <Label>Fréquence</Label>
                <select
                  value={formData.frequence}
                  onChange={(e) => setFormData({ ...formData, frequence: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="unique">Une fois</option>
                  <option value="quotidien">Quotidien</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuel">Mensuel</option>
                </select>
              </div>
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

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label className="text-base font-semibold">Paramètres de notification</Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Activer le son</Label>
                <Switch
                  checked={formData.son_actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, son_actif: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Activer la vibration</Label>
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
                disabled={creerRappelMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {creerRappelMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer
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