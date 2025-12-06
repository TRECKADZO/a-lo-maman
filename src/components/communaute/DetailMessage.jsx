import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Send,
  Pin,
  User,
  Stethoscope,
  CheckCircle2,
  Mic
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EmojiReactions from './EmojiReactions';
import VoiceRecorder from '../general/VoiceRecorder';

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

// Fonction helper pour envoyer notification de réponse
const notifyCommunauteReponse = async (destinataire, auteurNom, sujet, messageId) => {
  try {
    await base44.entities.Notification.create({
      destinataire_email: destinataire,
      type: 'communaute_reponse',
      titre: 'Nouvelle réponse à votre message',
      message: `${auteurNom} a répondu à votre message "${sujet}"`,
      action_page: 'Communaute',
      action_params: { messageId },
      priorite: 'normale',
      icone: 'MessageSquare',
    });
  } catch (error) {
    console.error('Erreur notification réponse:', error);
  }
};

// Fonction helper pour envoyer notification de réponse utile
const notifyCommunauteReponseUtile = async (destinataire, auteurNom, sujet) => {
  try {
    await base44.entities.Notification.create({
      destinataire_email: destinataire,
      type: 'communaute_reponse_utile',
      titre: 'Votre réponse a été marquée comme utile',
      message: `${auteurNom} a marqué votre réponse comme utile dans "${sujet}"`,
      action_page: 'Communaute',
      priorite: 'normale',
      icone: 'CheckCircle',
    });
  } catch (error) {
    console.error('Erreur notification réponse utile:', error);
  }
};

export default function DetailMessage({ message, onRetour }) {
  const [nouvelleReponse, setNouvelleReponse] = useState("");
  const [reponseType, setReponseType] = useState('texte');
  const [vocalData, setVocalData] = useState({ uri: null, name: null });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const isAuthor = user && message.created_by === user.email;
  const hasUpvoted = message.upvotes?.includes(user?.email);

  const ajouterReponseMutation = useMutation({
    mutationFn: async ({ contenu, vocalUri, vocalName }) => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const userProfile = profiles[0] || null;
      const isSpecialist = userProfile && userProfile.type_compte && userProfile.type_compte !== 'maman';
      
      const reponses = message.reponses || [];
      reponses.push({
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        auteur_nom: user.full_name || "Anonyme",
        auteur_email: user.email,
        auteur_specialite: isSpecialist ? userProfile.type_compte : null,
        contenu: contenu || "🎤 Message vocal",
        vocal_uri: vocalUri,
        vocal_name: vocalName,
        date: new Date().toISOString(),
        reactions: {},
        upvotes: [],
        est_utile: false
      });
      
      const result = await base44.entities.MessageCommunaute.update(message.id, { reponses });
      
      if (user && message.created_by !== user.email) {
        await notifyCommunauteReponse(
          message.created_by,
          user.full_name || "Un membre",
          message.sujet,
          message.id
        );
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
      setNouvelleReponse("");
      setVocalData({ uri: null, name: null });
      setReponseType('texte');
    },
  });

  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      const upvotes = message.upvotes || [];
      const newUpvotes = hasUpvoted
        ? upvotes.filter(email => email !== user.email)
        : [...upvotes, user.email];
      
      return base44.entities.MessageCommunaute.update(message.id, { upvotes: newUpvotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const toggleUpvoteReplyMutation = useMutation({
    mutationFn: async ({ replyId }) => {
      const updatedReplies = (message.reponses || []).map(reply => {
        if (reply.id === replyId) {
          const upvotes = reply.upvotes || [];
          const hasVoted = upvotes.includes(user.email);
          return {
            ...reply,
            upvotes: hasVoted
              ? upvotes.filter(email => email !== user.email)
              : [...upvotes, user.email]
          };
        }
        return reply;
      });

      return base44.entities.MessageCommunaute.update(message.id, { reponses: updatedReplies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const markAsHelpfulMutation = useMutation({
    mutationFn: async ({ replyId }) => {
      const updatedReplies = (message.reponses || []).map(reply => {
        if (reply.id === replyId) {
          return { ...reply, est_utile: !reply.est_utile };
        }
        return reply;
      });

      const result = await base44.entities.MessageCommunaute.update(message.id, { reponses: updatedReplies });
      
      if (user) {
        const reply = message.reponses.find(r => r.id === replyId);
        if (reply && !reply.est_utile && reply.auteur_email !== user.email) {
          await notifyCommunauteReponseUtile(
            reply.auteur_email,
            user.full_name || "L'auteur du post",
            message.sujet
          );
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const handleVoiceSend = async (audioFile) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      setVocalData({
        uri: file_url,
        name: audioFile.name,
      });
    } catch (error) {
      console.error("Error uploading voice message:", error);
      alert("Erreur lors de l'upload du message vocal");
    }
  };

  const handleEnvoyerReponse = (e) => {
    e.preventDefault();
    
    if (reponseType === 'texte' && !nouvelleReponse.trim()) {
      alert('Veuillez écrire une réponse');
      return;
    }
    
    if (reponseType === 'vocal' && !vocalData.uri) {
      alert('Veuillez enregistrer un message vocal');
      return;
    }
    
    ajouterReponseMutation.mutate({
      contenu: reponseType === 'texte' ? nouvelleReponse : null,
      vocalUri: reponseType === 'vocal' ? vocalData.uri : null,
      vocalName: reponseType === 'vocal' ? vocalData.name : null,
    });
  };

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

  const updateReactionsMutation = useMutation({
    mutationFn: async ({ entityId, newReactions }) => 
        base44.entities.MessageCommunaute.update(entityId, { reactions: newReactions }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const updateReplyReactionsMutation = useMutation({
    mutationFn: async ({ messageId, updatedReplies }) => {
        return base44.entities.MessageCommunaute.update(messageId, { reponses: updatedReplies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const handleReplyReactionUpdate = (replyId, newReactions) => {
    const updatedReplies = (message.reponses || []).map(reply => {
      if (reply.id === replyId) {
        return { ...reply, reactions: newReactions };
      }
      return reply;
    });

    updateReplyReactionsMutation.mutate({
      messageId: message.id,
      updatedReplies: updatedReplies,
    });
  };

  const sortedReplies = [...(message.reponses || [])].sort((a, b) => {
    if (a.est_utile && !b.est_utile) return -1;
    if (!a.est_utile && b.est_utile) return 1;
    
    const aVotes = a.upvotes?.length || 0;
    const bVotes = b.upvotes?.length || 0;
    if (aVotes !== bVotes) return bVotes - aVotes;
    
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onRetour} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      {/* Message principal */}
      <Card className="shadow-xl border-none">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getCategoryColor(message.categorie)}>
                  {categorieLabels[message.categorie] || message.categorie}
                </Badge>
                {message.epingle && (
                  <Badge className="bg-amber-500 text-white">
                    <Pin className="w-3 h-3 mr-1" />
                    Épinglé
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{message.sujet}</CardTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <span>{message.auteur_anonyme ? "Anonyme" : message.auteur_nom}</span>
                <span>•</span>
                <span>{format(new Date(message.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-6">
            {message.contenu}
          </p>
          
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant={hasUpvoted ? "default" : "outline"}
              size="sm"
              onClick={() => toggleUpvoteMutation.mutate()}
              className={hasUpvoted ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              {message.upvotes?.length || 0} Utile
            </Button>
            
            <EmojiReactions 
              reactions={message.reactions || {}}
              onUpdate={(newReactions) => updateReactionsMutation.mutate({ entityId: message.id, newReactions })}
            />
            
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              {message.reponses?.length || 0} Réponses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Réponses */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">
            Réponses ({message.reponses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedReplies.length > 0 ? (
            sortedReplies.map((reponse) => {
              const isSpecialistReply = !!reponse.auteur_specialite;
              const replyUpvotes = reponse.upvotes?.length || 0;
              const hasUpvotedReply = reponse.upvotes?.includes(user?.email);
              const hasVocal = !!reponse.vocal_uri;
              
              return (
              <div 
                key={reponse.id || reponse.date} 
                className={`p-4 rounded-lg relative ${
                  reponse.est_utile 
                    ? 'bg-green-50 border-2 border-green-300 dark:bg-green-900/20 dark:border-green-800' 
                    : isSpecialistReply 
                      ? 'bg-teal-50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800' 
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                {reponse.est_utile && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Réponse utile
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSpecialistReply ? 'bg-teal-500' : 'bg-amber-500'}`}>
                      {isSpecialistReply ? <Stethoscope className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                    </div>
                    <button
                      onClick={() => toggleUpvoteReplyMutation.mutate({ replyId: reponse.id })}
                      className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                        hasUpvotedReply ? 'text-amber-600' : 'text-gray-400 hover:text-amber-600'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-semibold">{replyUpvotes}</span>
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{reponse.auteur_nom}</span>
                      {isSpecialistReply && (
                        <Badge variant="outline" className="text-xs bg-white border-teal-200 text-teal-800 dark:bg-gray-700 dark:text-teal-300 dark:border-gray-600">
                          <Stethoscope className="w-3 h-3 mr-1" />
                          {specialiteLabels[reponse.auteur_specialite] || 'Spécialiste'}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(reponse.date), 'dd MMM à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    
                    {hasVocal ? (
                      <div className="mb-2">
                        <audio controls className="w-full max-w-md">
                          <source src={reponse.vocal_uri} type="audio/webm" />
                          <source src={reponse.vocal_uri} type="audio/ogg" />
                          Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">{reponse.contenu}</p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <EmojiReactions
                        reactions={reponse.reactions || {}}
                        onUpdate={(newReactions) => handleReplyReactionUpdate(reponse.id, newReactions)}
                      />
                      
                      {isAuthor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsHelpfulMutation.mutate({ replyId: reponse.id })}
                          className={`text-xs ${reponse.est_utile ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {reponse.est_utile ? 'Utile' : 'Marquer comme utile'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune réponse pour le moment</p>
          )}

          {/* Formulaire nouvelle réponse avec onglets texte/vocal */}
          <form onSubmit={handleEnvoyerReponse} className="pt-4 border-t">
            <Tabs value={reponseType} onValueChange={setReponseType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="texte" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Texte
                </TabsTrigger>
                <TabsTrigger value="vocal" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Vocal
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="texte">
                <Textarea
                  value={nouvelleReponse}
                  onChange={(e) => setNouvelleReponse(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  rows={3}
                  className="mb-3"
                />
              </TabsContent>
              
              <TabsContent value="vocal">
                <VoiceRecorder 
                  onSend={handleVoiceSend}
                  onCancel={() => setVocalData({ uri: null, name: null })}
                />
                {vocalData.uri && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Mic className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Message vocal enregistré ✓</span>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <Button 
              type="submit" 
              disabled={
                (reponseType === 'texte' && !nouvelleReponse.trim()) ||
                (reponseType === 'vocal' && !vocalData.uri) ||
                ajouterReponseMutation.isPending
              }
              className="bg-amber-600 hover:bg-amber-700 mt-3"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}