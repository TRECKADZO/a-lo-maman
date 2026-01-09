import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function CreerRappelSuivi({ patientEmail, patientNom, professionnelId, professionnelNom, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_rappel: 'consultation_suivi',
    date_prevue: '',
    priorite: 'normale',
    notifier_patient: true,
    notifier_professionnel: true,
    jours_avant_notification: 7,
    notes_internes: ''
  });

  const createRappelMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.RappelSuiviPersonnalise.create({
        patient_email: patientEmail,
        patient_nom: patientNom,
        professionnel_id: professionnelId,
        professionnel_nom: professionnelNom,
        titre: formData.titre,
        description: formData.description,
        type_rappel: formData.type_rappel,
        date_prevue: formData.date_prevue,
        priorite: formData.priorite,
        notifier_patient: formData.notifier_patient,
        notifier_professionnel: formData.notifier_professionnel,
        jours_avant_notification: parseInt(formData.jours_avant_notification),
        notes_internes: formData.notes_internes,
        statut: 'actif'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_suivi'] });
      toast.success('Rappel créé avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Créer un rappel de suivi</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre du rappel *</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Consultation de contrôle"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails du rappel..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de rappel</Label>
              <Select value={formData.type_rappel} onValueChange={(v) => setFormData({ ...formData, type_rappel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation_suivi">Consultation de suivi</SelectItem>
                  <SelectItem value="examen_controle">Examen de contrôle</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="traitement">Traitement</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={formData.priorite} onValueChange={(v) => setFormData({ ...formData, priorite: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date prévue *</Label>
              <Input
                type="date"
                value={formData.date_prevue}
                onChange={(e) => setFormData({ ...formData, date_prevue: e.target.value })}
              />
            </div>
            <div>
              <Label>Notifier (jours avant)</Label>
              <Input
                type="number"
                value={formData.jours_avant_notification}
                onChange={(e) => setFormData({ ...formData, jours_avant_notification: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifier_patient}
                onCheckedChange={(checked) => setFormData({ ...formData, notifier_patient: checked })}
              />
              <Label>Notifier le patient</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifier_professionnel}
                onCheckedChange={(checked) => setFormData({ ...formData, notifier_professionnel: checked })}
              />
              <Label>Me notifier (professionnel)</Label>
            </div>
          </div>

          <div>
            <Label>Notes internes (non visibles par le patient)</Label>
            <Textarea
              value={formData.notes_internes}
              onChange={(e) => setFormData({ ...formData, notes_internes: e.target.value })}
              placeholder="Notes personnelles..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => createRappelMutation.mutate()}
              disabled={!formData.titre || !formData.date_prevue || createRappelMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {createRappelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Créer le rappel
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}