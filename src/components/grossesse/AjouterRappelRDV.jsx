import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Bell } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { toast } from "sonner";

const TYPES_RDV = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'echographie_datation', label: 'Échographie de datation' },
  { value: 'echographie_morphologique', label: 'Échographie morphologique' },
  { value: 'echographie_croissance', label: 'Échographie de croissance' },
  { value: 'cours_preparation', label: 'Cours de préparation' },
  { value: 'dentiste', label: 'Dentiste' },
  { value: 'vaccin', label: 'Vaccination' },
  { value: 'examen_labo', label: 'Examen laboratoire' },
  { value: 'autre', label: 'Autre' }
];

export default function AjouterRappelRDV({ grossesse, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type_rdv: 'consultation_prenatale',
    titre: '',
    date_prevue: '',
    heure_prevue: '09:00',
    lieu: '',
    professionnel: '',
    statut: 'planifie',
    rappel_jours_avant: 1,
    notes: '',
    documents_requis: []
  });

  const [nouveauDocument, setNouveauDocument] = useState('');

  const ajouterDocument = () => {
    if (nouveauDocument.trim()) {
      setFormData(prev => ({
        ...prev,
        documents_requis: [...prev.documents_requis, nouveauDocument.trim()]
      }));
      setNouveauDocument('');
    }
  };

  const retirerDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents_requis: prev.documents_requis.filter((_, i) => i !== index)
    }));
  };

  const ajouterMutation = useMutation({
    mutationFn: async () => {
      const rappelsActuels = grossesse.rappels_rdv || [];
      const dateTimeComplete = `${formData.date_prevue}T${formData.heure_prevue}:00`;
      
      const nouveauRappel = {
        id: `rappel_${Date.now()}`,
        type_rdv: formData.type_rdv,
        titre: formData.titre || TYPES_RDV.find(t => t.value === formData.type_rdv)?.label,
        date_prevue: dateTimeComplete,
        lieu: formData.lieu,
        professionnel: formData.professionnel,
        statut: 'planifie',
        rappel_jours_avant: parseInt(formData.rappel_jours_avant),
        notes: formData.notes,
        documents_requis: formData.documents_requis
      };

      await base44.entities.SuiviGrossesse.update(grossesse.id, {
        rappels_rdv: [...rappelsActuels, nouveauRappel]
      });

      // Créer une notification de rappel
      await base44.entities.Notification.create({
        destinataire_email: grossesse.created_by,
        type: 'rendez_vous_confirmation',
        titre: `RDV planifié: ${nouveauRappel.titre}`,
        message: `Votre rendez-vous est prévu le ${new Date(dateTimeComplete).toLocaleDateString('fr-FR')} à ${formData.heure_prevue}`,
        action_page: 'Grossesse',
        priorite: 'normale',
        icone: 'Calendar'
      }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      toast.success('Rappel ajouté');
      onClose();
    },
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Nouveau rappel RDV" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <form onSubmit={(e) => { e.preventDefault(); ajouterMutation.mutate(); }} className="space-y-6">
          {/* Type de RDV */}
          <div>
            <Label>Type de rendez-vous *</Label>
            <Select value={formData.type_rdv} onValueChange={(value) => setFormData({ ...formData, type_rdv: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {TYPES_RDV.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titre personnalisé */}
          <div>
            <Label>Titre (optionnel)</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Laissez vide pour utiliser le type de RDV"
            />
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date_prevue}
                onChange={(e) => setFormData({ ...formData, date_prevue: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Heure</Label>
              <Input
                type="time"
                value={formData.heure_prevue}
                onChange={(e) => setFormData({ ...formData, heure_prevue: e.target.value })}
              />
            </div>
          </div>

          {/* Lieu et professionnel */}
          <div className="space-y-4">
            <div>
              <Label>Lieu</Label>
              <Input
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Hôpital, clinique..."
              />
            </div>
            <div>
              <Label>Professionnel</Label>
              <Input
                value={formData.professionnel}
                onChange={(e) => setFormData({ ...formData, professionnel: e.target.value })}
                placeholder="Nom du médecin"
              />
            </div>
          </div>

          {/* Rappel */}
          <div>
            <Label>Rappel avant le RDV</Label>
            <Select 
              value={formData.rappel_jours_avant.toString()} 
              onValueChange={(value) => setFormData({ ...formData, rappel_jours_avant: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 jour avant</SelectItem>
                <SelectItem value="2">2 jours avant</SelectItem>
                <SelectItem value="3">3 jours avant</SelectItem>
                <SelectItem value="7">1 semaine avant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents à apporter */}
          <div className="space-y-3">
            <Label>Documents à apporter</Label>
            
            {formData.documents_requis.length > 0 && (
              <div className="space-y-2">
                {formData.documents_requis.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm">{doc}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => retirerDocument(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={nouveauDocument}
                onChange={(e) => setNouveauDocument(e.target.value)}
                placeholder="Ex: Carte CMU, ordonnance..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    ajouterDocument();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={ajouterDocument}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={ajouterMutation.isPending || !formData.date_prevue}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {ajouterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Créer le rappel
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}