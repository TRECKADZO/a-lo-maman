import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  Clock,
  CheckCircle,
  Star,
  AlertCircle,
  MessageSquare,
  ThumbsUp
} from "lucide-react";

import RepondreQuestion from "./RepondreQuestion";
import NoterReponse from "./NoterReponse";

export default function DetailQuestion({ question, onBack, isSpecialist, profilPro, currentUser }) {
  const queryClient = useQueryClient();
  const [afficherReponse, setAfficherReponse] = React.useState(false);
  const [reponseANoter, setReponseANoter] = React.useState(null);

  // Incrémenter le nombre de vues
  useEffect(() => {
    const incrementerVues = async () => {
      await base44.entities.QuestionSpecialiste.update(question.id, {
        nombre_vues: (question.nombre_vues || 0) + 1
      });
    };
    incrementerVues();
  }, [question.id]);

  const marquerResolueMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.QuestionSpecialiste.update(question.id, {
        statut: "resolue"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions_specialistes'] });
    }
  });

  const validerReponseMutation = useMutation({
    mutationFn: async (reponseId) => {
      const reponses = question.reponses.map(r => 
        r.id === reponseId ? { ...r, validee_par_auteur: true } : r
      );
      await base44.entities.QuestionSpecialiste.update(question.id, {
        reponses,
        statut: "resolue"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions_specialistes'] });
    }
  });

  const peutRepondre = isSpecialist && !question.reponses?.some(r => r.professionnel_id === profilPro?.id);
  const estAuteur = currentUser?.email === question.auteur_email;

  const getUrgenceBadge = (urgence) => {
    const config = {
      urgente: { color: "bg-red-100 text-red-800", icon: AlertCircle },
      importante: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
      normale: { color: "bg-gray-100 text-gray-800", icon: Clock },
    };
    const { color, icon: Icon } = config[urgence] || config.normale;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {urgence?.charAt(0).toUpperCase() + urgence?.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Question principale */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <CardTitle className="text-2xl">{question.titre}</CardTitle>
              <div className="flex flex-col gap-2">
                {getUrgenceBadge(question.urgence)}
                {question.statut === "resolue" && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Résolue
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Badge variant="outline">{question.categorie}</Badge>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {question.nombre_vues || 0} vues
              </span>
              <span>Par {question.anonyme ? "Anonyme" : question.auteur_nom}</span>
              <span>{new Date(question.created_date).toLocaleDateString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{question.question}</p>

            {estAuteur && question.statut !== "resolue" && question.reponses?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => marquerResolueMutation.mutate()}
                  disabled={marquerResolueMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme résolue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Réponses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Réponses ({question.reponses?.length || 0})
            </h3>
            {peutRepondre && (
              <Button onClick={() => setAfficherReponse(true)} className="bg-purple-600 hover:bg-purple-700">
                Répondre
              </Button>
            )}
          </div>

          {question.reponses?.map((reponse) => (
            <Card key={reponse.id} className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{reponse.professionnel_nom?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{reponse.professionnel_nom}</p>
                      <p className="text-sm text-gray-600">{reponse.professionnel_specialite}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {reponse.validee_par_auteur && (
                      <Badge className="bg-green-100 text-green-800">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Validée
                      </Badge>
                    )}
                    {reponse.note_moyenne > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{reponse.note_moyenne.toFixed(1)}</span>
                        <span className="text-gray-500">({reponse.nombre_notes})</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{reponse.reponse}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{new Date(reponse.date_reponse).toLocaleDateString()}</span>
                  {!reponse.notes?.some(n => n.user_email === currentUser?.email) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReponseANoter(reponse)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Noter cette réponse
                    </Button>
                  )}
                  {estAuteur && !reponse.validee_par_auteur && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => validerReponseMutation.mutate(reponse.id)}
                      disabled={validerReponseMutation.isPending}
                      className="text-green-600 border-green-600"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Marquer comme utile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!question.reponses || question.reponses.length === 0) && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Aucune réponse pour le moment</p>
                {isSpecialist && (
                  <p className="text-sm text-gray-500 mt-2">Soyez le premier à répondre !</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {afficherReponse && (
          <RepondreQuestion
            question={question}
            profilPro={profilPro}
            onClose={() => setAfficherReponse(false)}
            onSuccess={() => {
              setAfficherReponse(false);
              queryClient.invalidateQueries({ queryKey: ['questions_specialistes'] });
            }}
          />
        )}

        {reponseANoter && (
          <NoterReponse
            question={question}
            reponse={reponseANoter}
            currentUser={currentUser}
            onClose={() => setReponseANoter(null)}
            onSuccess={() => {
              setReponseANoter(null);
              queryClient.invalidateQueries({ queryKey: ['questions_specialistes'] });
            }}
          />
        )}
      </div>
    </div>
  );
}