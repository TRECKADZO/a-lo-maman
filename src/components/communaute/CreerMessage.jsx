import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Send, Loader2, MessageSquare, Mic } from "lucide-react";
import VoiceRecorder from '../general/VoiceRecorder';

export default function CreerMessage({ onClose }) {
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState('texte'); // 'texte' ou 'vocal'
  const [formData, setFormData] = useState({
    sujet: "",
    categorie: "",
    contenu: "",
    auteur_anonyme: false,
    vocal_uri: null,
    vocal_name: null,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const categories = [
    { value: "grossesse_1er_trimestre", label: "Grossesse 1er trimestre", icon: "🤰", group: "Grossesse" },
    { value: "grossesse_2eme_trimestre", label: "Grossesse 2ème trimestre", icon: "🤰", group: "Grossesse" },
    { value: "grossesse_3eme_trimestre", label: "Grossesse 3ème trimestre", icon: "🤰", group: "Grossesse" },
    { value: "accouchement", label: "Accouchement", icon: "👶", group: "Grossesse" },
    { value: "post_partum", label: "Post-partum", icon: "💕", group: "Grossesse" },
    { value: "allaitement", label: "Allaitement", icon: "🍼", group: "Grossesse" },
    { value: "sante_nouveau_ne", label: "Santé nouveau-né (0-1 mois)", icon: "👶", group: "Santé Enfant" },
    { value: "sante_nourrisson", label: "Santé nourrisson (1-12 mois)", icon: "👶", group: "Santé Enfant" },
    { value: "sante_bambin", label: "Santé bambin (1-3 ans)", icon: "🧒", group: "Santé Enfant" },
    { value: "sante_enfant", label: "Santé enfant (3+ ans)", icon: "🧒", group: "Santé Enfant" },
    { value: "developpement_enfant", label: "Développement", icon: "🎯", group: "Santé Enfant" },
    { value: "nutrition_grossesse", label: "Nutrition grossesse", icon: "🥗", group: "Nutrition & Santé" },
    { value: "nutrition_enfant", label: "Nutrition enfant", icon: "🥗", group: "Nutrition & Santé" },
    { value: "contraception", label: "Contraception", icon: "💊", group: "Nutrition & Santé" },
    { value: "fertilite", label: "Fertilité", icon: "🌸", group: "Nutrition & Santé" },
    { value: "questions_specialistes", label: "Questions aux spécialistes", icon: "👨‍⚕️", group: "Spécial" },
    { value: "temoignages", label: "Témoignages", icon: "💬", group: "Spécial" },
    { value: "general", label: "Général", icon: "💬", group: "Spécial" }
  ];

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {});

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user?.email,
  });

  const creerMessageMutation = useMutation({
    mutationFn: async (data) => {
      const isSpecialist = !!profilPro;

      return base44.entities.MessageCommunaute.create({
        ...data,
        auteur_nom: data.auteur_anonyme ? "Anonyme" : user.full_name || "Utilisateur",
        auteur_type: isSpecialist ? 'specialiste' : 'maman',
        auteur_specialite: !data.auteur_anonyme && isSpecialist ? profilPro.specialite : null,
        reactions: {},
        reponses: [],
        upvotes: [],
        statut_moderation: "approuve",
        signalements: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
      onClose();
    },
  });

  const handleVoiceSend = async (audioFile) => {
    try {
      const { file_uri } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      setFormData({
        ...formData,
        vocal_uri: file_uri,
        vocal_name: audioFile.name,
      });
    } catch (error) {
      console.error("Error uploading voice message:", error);
      alert("Erreur lors de l'upload du message vocal");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sujet.trim()) {
      alert('Le sujet est obligatoire');
      return;
    }
    
    if (!formData.categorie) {
      alert('Veuillez choisir une catégorie');
      return;
    }
    
    if (messageType === 'texte' && !formData.contenu.trim()) {
      alert('Le message est obligatoire');
      return;
    }
    
    if (messageType === 'vocal' && !formData.vocal_uri) {
      alert('Veuillez enregistrer un message vocal');
      return;
    }
    
    const dataToSubmit = {
      sujet: formData.sujet,
      categorie: formData.categorie,
      contenu: messageType === 'vocal' ? '🎤 Message vocal' : formData.contenu,
      auteur_anonyme: formData.auteur_anonyme,
      vocal_uri: messageType === 'vocal' ? formData.vocal_uri : null,
      vocal_name: messageType === 'vocal' ? formData.vocal_name : null,
    };
    
    creerMessageMutation.mutate(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-0 md:p-4 overflow-y-auto">
      <Card className="w-full md:max-w-2xl my-0 md:my-8 shadow-2xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Créer un nouveau message</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sujet">Sujet *</Label>
              <Input
                id="sujet"
                value={formData.sujet}
                onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                placeholder="De quoi voulez-vous parler ?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie / Forum *</Label>
              <Select
                value={formData.categorie}
                onValueChange={(value) => setFormData({ ...formData, categorie: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une catégorie" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto z-[200]">
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs pour choisir entre texte et vocal */}
            <Tabs value={messageType} onValueChange={setMessageType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="texte" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message texte
                </TabsTrigger>
                <TabsTrigger value="vocal" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Message vocal
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="texte" className="mt-4 space-y-2">
                <Label htmlFor="contenu">Message *</Label>
                <Textarea
                  id="contenu"
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  placeholder="Partagez votre expérience, posez vos questions..."
                  rows={8}
                  required={messageType === 'texte'}
                />
                <p className="text-xs text-gray-500">
                  Soyez respectueuse et bienveillante dans vos échanges
                </p>
              </TabsContent>
              
              <TabsContent value="vocal" className="mt-4 space-y-2">
                <Label>Message vocal *</Label>
                <VoiceRecorder 
                  onSend={handleVoiceSend}
                  onCancel={() => setFormData({ ...formData, vocal_uri: null, vocal_name: null })}
                />
                {formData.vocal_uri && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Mic className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Message vocal enregistré ✓</span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonyme"
                checked={formData.auteur_anonyme}
                onChange={(e) => setFormData({ ...formData, auteur_anonyme: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <Label htmlFor="anonyme" className="cursor-pointer">
                Publier anonymement
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={creerMessageMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={creerMessageMutation.isPending}
              >
                {creerMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publier
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