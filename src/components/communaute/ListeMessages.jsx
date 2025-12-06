
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  User,
  Stethoscope,
  TrendingUp,
  CheckCircle2,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function countTotalReactions(reactions) {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((acc, users) => acc + (users?.length || 0), 0);
}

const specialiteLabels = {
    gynecologie: "Gynécologue",
    pediatrie: "Pédiatre",
    sage_femme: "Sage-femme",
    medecin_generaliste: "Médecin généraliste",
    infirmier: "Infirmier(ère)",
    nutritionniste: "Nutritionniste",
};

const categorieLabels = {
  grossesse_1er_trimestre: "Grossesse 1er trimestre",
  grossesse_2eme_trimestre: "Grossesse 2ème trimestre",
  grossesse_3eme_trimestre: "Grossesse 3ème trimestre",
  accouchement: "Accouchement",
  post_partum: "Post-partum",
  allaitement: "Allaitement",
  sante_nouveau_ne: "Nouveau-né",
  sante_nourrisson: "Nourrisson",
  sante_bambin: "Bambin",
  sante_enfant: "Enfant",
  developpement_enfant: "Développement",
  nutrition_grossesse: "Nutrition grossesse",
  nutrition_enfant: "Nutrition enfant",
  contraception: "Contraception",
  fertilite: "Fertilité",
  questions_specialistes: "Questions aux spécialistes",
  temoignages: "Témoignages",
  general: "Général"
};

export default function ListeMessages({ messagesEpingles = [], messagesNormaux = [], messages, messagesPinned, isLoading, onSelectMessage, onShowProfile, selectedCategorie }) {
  // Support both prop names for backward compatibility
  const epingles = messagesEpingles || messagesPinned || [];
  const normaux = messagesNormaux || messages || [];
  const getCategoryColor = (categorie) => {
    const colors = {
      grossesse_1er_trimestre: "bg-pink-100 text-pink-800",
      grossesse_2eme_trimestre: "bg-pink-100 text-pink-800",
      grossesse_3eme_trimestre: "bg-pink-100 text-pink-800",
      accouchement: "bg-rose-100 text-rose-800",
      post_partum: "bg-purple-100 text-purple-800",
      allaitement: "bg-indigo-100 text-indigo-800",
      sante_nouveau_ne: "bg-blue-100 text-blue-800",
      sante_nourrisson: "bg-blue-100 text-blue-800",
      sante_bambin: "bg-cyan-100 text-cyan-800",
      sante_enfant: "bg-cyan-100 text-cyan-800",
      developpement_enfant: "bg-teal-100 text-teal-800",
      nutrition_grossesse: "bg-green-100 text-green-800",
      nutrition_enfant: "bg-green-100 text-green-800",
      contraception: "bg-orange-100 text-orange-800",
      fertilite: "bg-yellow-100 text-yellow-800",
      questions_specialistes: "bg-purple-100 text-purple-800",
      temoignages: "bg-gray-100 text-gray-800",
      general: "bg-gray-100 text-gray-800"
    };
    return colors[categorie] || colors.general;
  };

  const MessageCard = ({ message, epingle = false }) => {
    const isSpecialistPost = !!message.auteur_specialite;
    const upvoteCount = message.upvotes?.length || 0;
    const hasHelpfulAnswer = message.reponses?.some(r => r.est_utile);
    const hasSpecialistAnswer = message.reponses?.some(r => r.auteur_specialite);
    
    return (
    <Card 
      className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-none active:scale-[0.99] overflow-hidden"
      onClick={() => onSelectMessage(message)}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${isSpecialistPost ? 'bg-teal-500' : 'bg-amber-500'}`}>
              {isSpecialistPost ? <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <User className="w-5 h-5 md:w-6 md:h-6 text-white" />}
            </div>
            <div className="flex flex-col items-center">
              <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <span className="text-xs md:text-sm font-semibold text-gray-700">{upvoteCount}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${getCategoryColor(message.categorie)} text-xs truncate`}>
                {categorieLabels[message.categorie] || message.categorie}
              </Badge>
              {epingle && (
                <Badge className="bg-amber-500 text-white text-xs">
                  <Pin className="w-3 h-3 mr-1 flex-shrink-0" />
                  Épinglé
                </Badge>
              )}
              {isSpecialistPost && (
                <Badge variant="outline" className="text-xs bg-teal-50 border-teal-200 text-teal-800 truncate">
                  <Stethoscope className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="hidden md:inline">Post de </span>Spécialiste
                </Badge>
              )}
              {hasHelpfulAnswer && (
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="hidden md:inline">Réponse </span>utile
                </Badge>
              )}
              {hasSpecialistAnswer && !hasHelpfulAnswer && (
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-xs">
                  <Stethoscope className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="hidden md:inline">Avis </span>spécialiste
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-base md:text-lg text-gray-800 mb-2 line-clamp-2 break-words">
              {message.sujet}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2 break-words">
              {message.contenu}
            </p>
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 flex-wrap">
              <span className="font-medium flex items-center gap-1.5 truncate max-w-full">
                {message.auteur_anonyme ? "Anonyme" : message.auteur_nom}
                {isSpecialistPost && !message.auteur_anonyme && (
                  <span className="text-xs text-teal-600 truncate">
                    ({specialiteLabels[message.auteur_specialite] || 'Spécialiste'})
                  </span>
                )}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">{format(new Date(message.created_date), 'dd MMM', { locale: fr })}</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                {message.reponses?.length || 0}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                {upvoteCount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )};

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages épinglés */}
      {epingles && epingles.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Pin className="w-5 h-5 text-amber-500" />
            Messages Épinglés
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {epingles.map(message => (
              <MessageCard key={message.id} message={message} epingle />
            ))}
          </div>
        </div>
      )}

      {/* Messages normaux */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {selectedCategorie === "toutes" 
            ? `Toutes les discussions (${normaux?.length || 0})`
            : `${categorieLabels[selectedCategorie] || selectedCategorie} (${normaux?.length || 0})`
          }
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {normaux && normaux.map(message => (
            <MessageCard key={message.id} message={message} />
          ))}
        </div>

        {(!normaux || normaux.length === 0) && (!epingles || epingles.length === 0) && (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun message dans cette catégorie
              </h3>
              <p className="text-gray-500 mb-6">
                Soyez la première à démarrer une discussion !
              </p>
              <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un message
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
