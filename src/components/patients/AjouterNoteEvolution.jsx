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
import { Loader2, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AjouterNoteEvolution({ patientEmail, patientNom, professionnelId, professionnelNom, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type_note: 'evolution',
    contenu: '',
    symptomes_observes: '',
    examens_prescrits: '',
    traitement_prescrit: '',
    prochaine_etape: '',
    priorite: 'normale',
    visible_patient: true,
    tags: ''
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.NoteEvolutionPatient.create({
        patient_email: patientEmail,
        patient_nom: patientNom,
        professionnel_id: professionnelId,
        professionnel_nom: professionnelNom,
        type_note: formData.type_note,
        contenu: formData.contenu,
        symptomes_observes: formData.symptomes_observes ? formData.symptomes_observes.split(',').map(s => s.trim()) : [],
        examens_prescrits: formData.examens_prescrits ? formData.examens_prescrits.split(',').map(s => s.trim()) : [],
        traitement_prescrit: formData.traitement_prescrit,
        prochaine_etape: formData.prochaine_etape,
        priorite: formData.priorite,
        visible_patient: formData.visible_patient,
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes_evolution'] });
      toast.success('Note d\'évolution ajoutée');
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
          <CardTitle>Ajouter une note d'évolution</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de note</Label>
              <Select value={formData.type_note} onValueChange={(v) => setFormData({ ...formData, type_note: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolution">Évolution</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="traitement">Traitement</SelectItem>
                  <SelectItem value="suivi">Suivi</SelectItem>
                  <SelectItem value="alerte">Alerte</SelectItem>
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
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="importante">Importante</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Contenu de la note *</Label>
            <Textarea
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              placeholder="Décrivez l'évolution du patient..."
              rows={6}
            />
          </div>

          <div>
            <Label>Symptômes observés (séparés par virgules)</Label>
            <Input
              value={formData.symptomes_observes}
              onChange={(e) => setFormData({ ...formData, symptomes_observes: e.target.value })}
              placeholder="Ex: fatigue, nausées, douleurs"
            />
          </div>

          <div>
            <Label>Traitement prescrit</Label>
            <Textarea
              value={formData.traitement_prescrit}
              onChange={(e) => setFormData({ ...formData, traitement_prescrit: e.target.value })}
              placeholder="Médicaments, posologie..."
              rows={3}
            />
          </div>

          <div>
            <Label>Prochaine étape recommandée</Label>
            <Textarea
              value={formData.prochaine_etape}
              onChange={(e) => setFormData({ ...formData, prochaine_etape: e.target.value })}
              placeholder="Ex: Consultation de contrôle dans 2 semaines"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.visible_patient}
              onCheckedChange={(checked) => setFormData({ ...formData, visible_patient: checked })}
            />
            <Label>Visible par le patient</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => createNoteMutation.mutate()}
              disabled={!formData.contenu || createNoteMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
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