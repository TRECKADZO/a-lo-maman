import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Milk, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DIFFICULTES_ALLAITEMENT = [
  "Douleurs aux mamelons",
  "Engorgement",
  "Crevasses",
  "Insuffisance de lait",
  "Bébé ne prend pas bien le sein",
  "Fatigue excessive",
  "Mastite"
];

export default function SuiviAllaitement({ suivi }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: suivi.allaitement?.type || 'exclusif',
    difficultes: suivi.allaitement?.difficultes || [],
    soutien_recu: suivi.allaitement?.soutien_recu || false
  });

  const toggleDifficulte = (diff) => {
    if (formData.difficultes.includes(diff)) {
      setFormData({
        ...formData,
        difficultes: formData.difficultes.filter(d => d !== diff)
      });
    } else {
      setFormData({
        ...formData,
        difficultes: [...formData.difficultes, diff]
      });
    }
  };

  const enregistrerMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SuiviPostPartum.update(suivi.id, {
        allaitement: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suivi_postpartum']);
      toast.success('Suivi allaitement mis à jour');
      setShowForm(false);
    }
  });

  const getTypeLabel = (type) => {
    const labels = {
      'exclusif': 'Allaitement exclusif',
      'mixte': 'Allaitement mixte',
      'artificiel': 'Lait artificiel',
      'arrete': 'Arrêté'
    };
    return labels[type] || type;
  };

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Milk className="w-5 h-5 text-blue-600" />
            Allaitement
          </h3>
          {!showForm && suivi.allaitement && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Modifier
            </Button>
          )}
        </div>

        {!showForm && suivi.allaitement ? (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="font-semibold text-blue-900">{getTypeLabel(suivi.allaitement.type)}</p>
            </div>

            {suivi.allaitement.difficultes && suivi.allaitement.difficultes.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900 mb-2">Difficultés rencontrées</p>
                    <div className="flex flex-wrap gap-2">
                      {suivi.allaitement.difficultes.map((diff, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {diff}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {suivi.allaitement.soutien_recu && (
              <Badge className="bg-green-100 text-green-800">
                Soutien professionnel reçu
              </Badge>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Type d'allaitement</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusif">Allaitement exclusif</SelectItem>
                  <SelectItem value="mixte">Allaitement mixte</SelectItem>
                  <SelectItem value="artificiel">Lait artificiel</SelectItem>
                  <SelectItem value="arrete">Arrêté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-3 block">Difficultés rencontrées</Label>
              <div className="space-y-2">
                {DIFFICULTES_ALLAITEMENT.map((diff) => (
                  <div key={diff} className="flex items-center gap-2">
                    <Checkbox
                      id={diff}
                      checked={formData.difficultes.includes(diff)}
                      onCheckedChange={() => toggleDifficulte(diff)}
                    />
                    <Label htmlFor={diff} className="cursor-pointer text-sm">
                      {diff}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="soutien"
                checked={formData.soutien_recu}
                onCheckedChange={(checked) => setFormData({ ...formData, soutien_recu: checked })}
              />
              <Label htmlFor="soutien" className="cursor-pointer">
                J'ai reçu un soutien professionnel
              </Label>
            </div>

            <div className="flex gap-3">
              {suivi.allaitement && (
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </Button>
              )}
              <Button
                onClick={() => enregistrerMutation.mutate()}
                disabled={enregistrerMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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