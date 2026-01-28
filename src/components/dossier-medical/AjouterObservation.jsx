import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TYPES_OBSERVATIONS = [
  { value: 'tension', label: 'Pression artérielle', unite: 'mmHg' },
  { value: 'poids', label: 'Poids', unite: 'kg' },
  { value: 'temperature', label: 'Température', unite: '°C' },
  { value: 'glycemie', label: 'Glycémie', unite: 'g/L' },
  { value: 'frequence_cardiaque', label: 'Fréquence cardiaque', unite: 'bpm' },
  { value: 'saturation_oxygene', label: 'Saturation O2', unite: '%' },
  { value: 'ecg', label: 'ECG', unite: '' },
  { value: 'score_douleur', label: 'Score douleur', unite: '/10' },
];

export default function AjouterObservation({ dossierId, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'tension',
    valeur: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const dossier = await base44.entities.DossierMedicalComplet.filter({ id: dossierId });
      if (!dossier[0]) throw new Error('Dossier introuvable');

      const user = await base44.auth.me();
      const nouvelleObs = {
        type: data.type,
        valeur: data.valeur,
        unite: TYPES_OBSERVATIONS.find(t => t.value === data.type)?.unite || '',
        date_mesure: new Date().toISOString(),
        professionnel_id: user.email,
        notes: data.notes,
      };

      const observations = [...(dossier[0].observations_vitales || []), nouvelleObs];
      
      await base44.entities.DossierMedicalComplet.update(dossierId, {
        observations_vitales: observations,
        derniere_synchronisation: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dossier_medical', dossierId]);
      toast.success('Observation ajoutée');
      onClose();
      setFormData({ type: 'tension', valeur: '', notes: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une Observation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type d'observation</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_OBSERVATIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Valeur</Label>
            <Input
              placeholder={`Ex: 120/80 ${TYPES_OBSERVATIONS.find(t => t.value === formData.type)?.unite || ''}`}
              value={formData.valeur}
              onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
            />
          </div>

          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Notes complémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => mutation.mutate(formData)}
            disabled={!formData.valeur || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}