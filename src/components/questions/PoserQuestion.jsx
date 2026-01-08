import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X, AlertCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";

const CATEGORIES = [
  { value: "grossesse", label: "Grossesse" },
  { value: "accouchement", label: "Accouchement" },
  { value: "postpartum", label: "Post-Partum" },
  { value: "allaitement", label: "Allaitement" },
  { value: "pediatrie", label: "Pédiatrie" },
  { value: "nutrition", label: "Nutrition" },
  { value: "vaccination", label: "Vaccination" },
  { value: "contraception", label: "Contraception" },
  { value: "developpement", label: "Développement" },
  { value: "sante_generale", label: "Santé Générale" }
];

export default function PoserQuestion({ onClose, onSuccess, user }) {
  const [formData, setFormData] = useState({
    titre: "",
    question: "",
    categorie: "",
    urgence: "normale",
    anonyme: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.QuestionSpecialiste.create({
        ...data,
        auteur_email: user.email,
        auteur_nom: data.anonyme ? "Utilisateur anonyme" : user.full_name,
        statut: "en_attente",
        nombre_vues: 0,
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Poser une question" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titre de la question *</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Quand commencer la diversification alimentaire ?"
              required
            />
          </div>

          <div>
            <Label>Catégorie *</Label>
            <Select
              value={formData.categorie}
              onValueChange={(value) => setFormData({ ...formData, categorie: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Votre question détaillée *</Label>
            <Textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Décrivez votre question en détail..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label>Niveau d'urgence</Label>
            <Select
              value={formData.urgence}
              onValueChange={(value) => setFormData({ ...formData, urgence: value })}
            >
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

          <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
            <Checkbox
              checked={formData.anonyme}
              onCheckedChange={(checked) => setFormData({ ...formData, anonyme: checked })}
            />
            <Label className="cursor-pointer">Poser cette question de manière anonyme</Label>
          </div>

          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Les réponses fournies sont à titre informatif. En cas d'urgence médicale, consultez immédiatement un professionnel de santé.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.titre || !formData.question || !formData.categorie}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Publier ma question"
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}