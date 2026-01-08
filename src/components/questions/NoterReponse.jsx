import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Star } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";

export default function NoterReponse({ question, reponse, currentUser, onClose, onSuccess }) {
  const [note, setNote] = useState(0);
  const [hoveredNote, setHoveredNote] = useState(0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const nouvelleNote = {
        user_email: currentUser.email,
        note: note,
        date: new Date().toISOString()
      };

      const reponses = question.reponses.map(r => {
        if (r.id === reponse.id) {
          const notes = [...(r.notes || []), nouvelleNote];
          const somme = notes.reduce((acc, n) => acc + n.note, 0);
          const moyenne = somme / notes.length;
          
          return {
            ...r,
            notes,
            note_moyenne: moyenne,
            nombre_notes: notes.length
          };
        }
        return r;
      });

      await base44.entities.QuestionSpecialiste.update(question.id, {
        reponses
      });

      // Notification au professionnel
      await base44.entities.Notification.create({
        destinataire_email: reponse.professionnel_id,
        type: "communaute_reponse_utile",
        titre: "Votre réponse a été notée",
        message: `Votre réponse à "${question.titre}" a reçu une note de ${note}/5`,
        priorite: "normale",
        icone: "Star"
      });
    },
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (note > 0) {
      createMutation.mutate();
    }
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Noter cette réponse">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Réponse de {reponse.professionnel_nom}</p>
            <p className="text-sm text-gray-700 line-clamp-3">{reponse.reponse}</p>
          </div>

          <div className="text-center">
            <Label className="block mb-4">Quelle note donnez-vous à cette réponse ?</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNote(value)}
                  onMouseEnter={() => setHoveredNote(value)}
                  onMouseLeave={() => setHoveredNote(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      value <= (hoveredNote || note)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {note > 0 && (
              <p className="text-sm text-gray-600 mt-2">{note}/5 étoiles</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || note === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Valider ma note"
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}