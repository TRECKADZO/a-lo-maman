import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";

export default function RepondreQuestion({ question, profilPro, onClose, onSuccess }) {
  const [reponse, setReponse] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const nouvelleReponse = {
        id: Date.now().toString(),
        professionnel_id: profilPro.id,
        professionnel_nom: profilPro.nom_complet,
        professionnel_specialite: profilPro.specialite?.replace(/_/g, ' '),
        reponse: reponse,
        date_reponse: new Date().toISOString(),
        notes: [],
        note_moyenne: 0,
        nombre_notes: 0,
        validee_par_auteur: false
      };

      const reponses = [...(question.reponses || []), nouvelleReponse];
      
      await base44.entities.QuestionSpecialiste.update(question.id, {
        reponses,
        statut: "repondue"
      });

      // Notification à l'auteur
      await base44.entities.Notification.create({
        destinataire_email: question.auteur_email,
        type: "communaute_reponse",
        titre: "Nouvelle réponse à votre question",
        message: `${profilPro.nom_complet} a répondu à votre question "${question.titre}"`,
        action_page: "QuestionsSpecialistes",
        priorite: "haute",
        icone: "MessageSquare"
      });
    },
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Répondre à la question" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-900 mb-2">{question.titre}</p>
            <p className="text-sm text-purple-700 line-clamp-3">{question.question}</p>
          </div>

          <div>
            <Label>Votre réponse professionnelle *</Label>
            <Textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Apportez votre expertise médicale..."
              rows={10}
              required
            />
          </div>

          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              En tant que professionnel de santé, votre réponse engage votre responsabilité. 
              Assurez-vous de fournir des informations précises et basées sur des données médicales fiables.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !reponse.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Publier ma réponse"
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}