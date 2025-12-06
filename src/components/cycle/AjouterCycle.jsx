import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";

export default function AjouterCycle({ onClose, cycleExistant }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date_debut_regles: cycleExistant?.date_debut_regles || new Date().toISOString().split('T')[0],
    date_fin_regles: cycleExistant?.date_fin_regles || "",
    duree_cycle: cycleExistant?.duree_cycle || 28,
    flux: cycleExistant?.flux || "moyen",
    symptomes: cycleExistant?.symptomes || [],
    douleur_niveau: cycleExistant?.douleur_niveau || 0,
    notes: cycleExistant?.notes || ""
  });

  const symptomesDisponibles = [
    "Crampes", "Fatigue", "Maux de tête", "Nausées", "Ballonnements",
    "Sautes d'humeur", "Sensibilité mammaire", "Acné", "Douleur lombaire"
  ];

  const toggleSymptome = (symptome) => {
    setFormData(prev => ({
      ...prev,
      symptomes: prev.symptomes.includes(symptome)
        ? prev.symptomes.filter(s => s !== symptome)
        : [...prev.symptomes, symptome]
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (cycleExistant) {
        return base44.entities.CycleMenstruel.update(cycleExistant.id, data);
      } else {
        return base44.entities.CycleMenstruel.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              {cycleExistant ? 'Modifier le cycle' : 'Enregistrer un nouveau cycle'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_debut">Date de début des règles *</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut_regles}
                  onChange={(e) => setFormData({ ...formData, date_debut_regles: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin">Date de fin des règles</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin_regles}
                  onChange={(e) => setFormData({ ...formData, date_fin_regles: e.target.value })}
                  min={formData.date_debut_regles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duree_cycle">Durée du cycle (jours)</Label>
                <Input
                  id="duree_cycle"
                  type="number"
                  min="21"
                  max="45"
                  value={formData.duree_cycle}
                  onChange={(e) => setFormData({ ...formData, duree_cycle: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Entre 21 et 45 jours</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flux">Flux menstruel</Label>
                <Select
                  value={formData.flux}
                  onValueChange={(value) => setFormData({ ...formData, flux: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leger">Léger</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="abondant">Abondant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Niveau de douleur (0-10)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.douleur_niveau}
                  onChange={(e) => setFormData({ ...formData, douleur_niveau: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-purple-600 w-12 text-center">
                  {formData.douleur_niveau}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Symptômes</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {symptomesDisponibles.map((symptome) => (
                  <button
                    key={symptome}
                    type="button"
                    onClick={() => toggleSymptome(symptome)}
                    className={`p-2 text-sm rounded-lg border-2 transition-all ${
                      formData.symptomes.includes(symptome)
                        ? 'bg-purple-100 border-purple-500 text-purple-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {symptome}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notez ici vos observations (humeur, activités, etc.)"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={saveMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
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