
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";

export default function ConfigurerSuivi({ suiviExistant, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    methode_id: suiviExistant?.methode_id || "",
    date_debut: suiviExistant?.date_debut || new Date().toISOString().split('T')[0],
    date_fin: suiviExistant?.date_fin || "", // Added date_fin to formData
    date_rappel_renouvellement: suiviExistant?.date_rappel_renouvellement || "", // Added date_rappel_renouvellement
    heure_prise: suiviExistant?.heure_prise || "20:00",
    rappels_actives: suiviExistant?.rappels_actives !== false,
  });

  const { data: methodes } = useQuery({
    queryKey: ['methodesContraception'],
    queryFn: () => base44.entities.MethodeContraception.list(),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const dataToSave = { ...data };
      if (!dataToSave.date_fin) {
        delete dataToSave.date_fin; // Do not save an empty end date
      }
      if (!dataToSave.date_rappel_renouvellement) {
        delete dataToSave.date_rappel_renouvellement; // Do not save an empty renewal reminder date
      }

      if (suiviExistant) {
        return base44.entities.SuiviContraception.update(suiviExistant.id, dataToSave);
      } else {
        return base44.entities.SuiviContraception.create(dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suiviContraception'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Card className="shadow-2xl border-2 border-rose-200">
      <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-rose-700">
            {suiviExistant ? 'Modifier le suivi' : 'Configurer un nouveau suivi'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="methode">Méthode contraceptive *</Label>
            <Select
              value={formData.methode_id}
              onValueChange={(value) => setFormData({ ...formData, methode_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisissez une méthode" />
              </SelectTrigger>
              <SelectContent>
                {methodes.map((methode) => (
                  <SelectItem key={methode.id} value={methode.id}>
                    {methode.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input
                id="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin (optionnel)</Label>
              <Input
                id="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_rappel_renouvellement">Date de rappel de renouvellement (optionnel)</Label>
            <Input
              id="date_rappel_renouvellement"
              type="date"
              value={formData.date_rappel_renouvellement}
              onChange={(e) => setFormData({ ...formData, date_rappel_renouvellement: e.target.value })}
            />
             <p className="text-xs text-gray-500">
              Utile pour ne pas oublier de renouveler un implant, stérilet, ou une ordonnance.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heure_prise">Heure habituelle de prise</Label>
            <Input
              id="heure_prise"
              type="time"
              value={formData.heure_prise}
              onChange={(e) => setFormData({ ...formData, heure_prise: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Vous recevrez un rappel à cette heure chaque jour
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rappels"
              checked={formData.rappels_actives}
              onChange={(e) => setFormData({ ...formData, rappels_actives: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded"
            />
            <Label htmlFor="rappels" className="cursor-pointer">
              Activer les rappels de prise
            </Label>
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
              className="flex-1 bg-rose-600 hover:bg-rose-700"
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
  );
}
