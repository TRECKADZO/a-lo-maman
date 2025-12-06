import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Star } from "lucide-react";

const jalonsParCategorie = {
  "moteur": [
    "Tient sa tête", "Se retourne", "S'assoit", "Rampe", "Se met debout",
    "Marche", "Court", "Monte les escaliers", "Saute"
  ],
  "langage": [
    "Gazouille", "Dit 'papa/maman'", "Dit ses premiers mots", "Fait des phrases de 2 mots",
    "Fait des phrases complètes", "Raconte une histoire"
  ],
  "social": [
    "Sourit", "Réagit à son prénom", "Joue à coucou", "Montre du doigt",
    "Partage avec les autres", "Joue avec d'autres enfants"
  ],
  "cognitif": [
    "Suit des yeux", "Reconnaît les visages", "Cherche un objet caché",
    "Empile des blocs", "Reconnaît les couleurs", "Compte jusqu'à 10"
  ]
};

export default function AjouterJalonModal({ enfantId, jalonsExistants = [], onClose }) {
  const [formData, setFormData] = useState({
    categorie: "",
    jalon: "",
    date_atteint: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [customJalon, setCustomJalon] = useState("");
  const queryClient = useQueryClient();

  const ajouterJalonMutation = useMutation({
    mutationFn: async (data) => {
      const jalons = [...jalonsExistants, data];
      return base44.entities.EnfantCarnet.update(enfantId, { jalons_developpement: jalons });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      onClose();
    },
    onError: (error) => {
      console.error("Error adding milestone:", error);
      alert("Une erreur est survenue lors de l'ajout du jalon.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const jalonFinal = customJalon.trim() || formData.jalon;
    
    if (!formData.categorie || !jalonFinal) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    ajouterJalonMutation.mutate({
      categorie: formData.categorie,
      jalon: jalonFinal,
      date_atteint: formData.date_atteint,
      notes: formData.notes
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Ajouter un jalon de développement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie *</Label>
            <Select
              value={formData.categorie}
              onValueChange={(value) => {
                setFormData({ ...formData, categorie: value, jalon: "" });
                setCustomJalon("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisissez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moteur">Motricité</SelectItem>
                <SelectItem value="langage">Langage</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="cognitif">Cognitif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.categorie && (
            <div className="space-y-2">
              <Label htmlFor="jalon">Jalon atteint *</Label>
              <Select
                value={formData.jalon}
                onValueChange={(value) => {
                  setFormData({ ...formData, jalon: value });
                  setCustomJalon("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un jalon" />
                </SelectTrigger>
                <SelectContent>
                  {jalonsParCategorie[formData.categorie].map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                  <SelectItem value="custom">Autre...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.jalon === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom_jalon">Décrivez le jalon</Label>
              <Input
                id="custom_jalon"
                value={customJalon}
                onChange={(e) => setCustomJalon(e.target.value)}
                placeholder="Ex: A fait du vélo sans les petites roues"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date_atteint">Date *</Label>
            <Input
              id="date_atteint"
              type="date"
              value={formData.date_atteint}
              onChange={(e) => setFormData({ ...formData, date_atteint: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Ajoutez des détails ou observations..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={ajouterJalonMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={ajouterJalonMutation.isPending}
            >
              {ajouterJalonMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}