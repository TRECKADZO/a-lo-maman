import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageSquare,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Heart,
  ThumbsUp,
  Shield,
  ArrowLeft,
  Stethoscope,
  CheckCircle2
} from "lucide-react";

import DetailMessage from "../components/communaute/DetailMessage";
import ListeMessages from "../components/communaute/ListeMessages";
import CreerMessage from "../components/communaute/CreerMessage";
import SousForumsList, { SOUS_FORUMS } from '../components/communaute/SousForumsList';
import ProfilUtilisateurForum from '../components/communaute/ProfilUtilisateurForum';
import OutilsModeration from '../components/communaute/OutilsModeration';
import ExperienceSharing from '../components/communaute/ExperienceSharing';

export default function Communaute() {
  const [messageSelectionne, setMessageSelectionne] = useState(null);
  const [showCreerMessage, setShowCreerMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('toutes');
  const [selectedSousForum, setSelectedSousForum] = useState(null);
  const [showProfilUtilisateur, setShowProfilUtilisateur] = useState(null);
  const [showModeration, setShowModeration] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user?.email,
  });

  const isSpecialist = !!profilPro;

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages_communaute'],
    queryFn: async () => {
      const approvedMessages = await base44.entities.MessageCommunaute.filter({ 
        statut_moderation: 'approuve' 
      }, '-created_date');
      return approvedMessages;
    },
    initialData: [],
  });

  const categories = [
    { value: "grossesse_1er_trimestre", label: "Grossesse 1er trimestre", icon: "🤰", parent: "grossesse" },
    { value: "grossesse_2eme_trimestre", label: "Grossesse 2ème trimestre", icon: "🤰", parent: "grossesse" },
    { value: "grossesse_3eme_trimestre", label: "Grossesse 3ème trimestre", icon: "🤰", parent: "grossesse" },
    { value: "accouchement", label: "Accouchement", icon: "👶", parent: "grossesse" },
    { value: "post_partum", label: "Post-partum", icon: "💕", parent: "grossesse" },
    { value: "allaitement", label: "Allaitement", icon: "🍼", parent: "grossesse" },
    { value: "sante_nouveau_ne", label: "Santé nouveau-né (0-1 mois)", icon: "👶", parent: "enfant" },
    { value: "sante_nourrisson", label: "Santé nourrisson (1-12 mois)", icon: "👶", parent: "enfant" },
    { value: "sante_bambin", label: "Santé bambin (1-3 ans)", icon: "🧒", parent: "enfant" },
    { value: "sante_enfant", label: "Santé enfant (3+ ans)", icon: "🧒", parent: "enfant" },
    { value: "developpement_enfant", label: "Développement", icon: "🎯", parent: "enfant" },
    { value: "nutrition_grossesse", label: "Nutrition grossesse", icon: "🥗", parent: "nutrition" },
    { value: "nutrition_enfant", label: "Nutrition enfant", icon: "🥗", parent: "nutrition" },
    { value: "contraception", label: "Contraception", icon: "💊", parent: "sante" },
    { value: "fertilite", label: "Fertilité", icon: "🌸", parent: "sante" },
    { value: "questions_specialistes", label: "Questions aux spécialistes", icon: "👨‍⚕️", parent: "special" },
    { value: "temoignages", label: "Témoignages", icon: "💬", parent: "special" },
    { value: "general", label: "Général", icon: "💬", parent: "special" }
  ];

  const groupedCategories = {
    grossesse: categories.filter(c => c.parent === "grossesse"),
    enfant: categories.filter(c => c.parent === "enfant"),
    nutrition: categories.filter(c => c.parent === "nutrition"),
    sante: categories.filter(c => c.parent === "sante"),
    special: categories.filter(c => c.parent === "special")
  };

  // Filtrer par sous-forum
  const messagesFiltres = messages.filter(msg => {
    const matchSearch = !searchQuery || msg.sujet?.toLowerCase().includes(searchQuery.toLowerCase()) || msg.contenu?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategorie = selectedCategorie === 'toutes' || msg.categorie === selectedCategorie;
    const matchSousForum = !selectedSousForum || msg.sous_forum === selectedSousForum;
    return matchSearch && matchCategorie && matchSousForum;
  });

  const messagesPinned = messagesFiltres.filter(m => m.epingle);
  const messagesNormaux = messagesFiltres.filter(m => !m.epingle);

  // Compter messages par sous-forum
  const messagesBySousForum = messages.reduce((acc, msg) => {
    if (msg.sous_forum) {
      acc[msg.sous_forum] = (acc[msg.sous_forum] || 0) + 1;
    }
    return acc;
  }, {});

  const stats = {
    total: messages.length,
    membres: new Set(messages.map(m => m.created_by)).size,
    aujourdhui: messages.filter(m => new Date(m.created_date).toDateString() === new Date().toDateString()).length
  };

  // VUE SPÉCIALISTE - Questions nécessitant leur expertise
  const questionsNonRepondues = isSpecialist ? messages.filter(msg =>
    (!msg.reponses || msg.reponses.length === 0) && msg.categorie === 'questions_specialistes'
  ) : [];

  const questionsSansReponseSpecialiste = isSpecialist ? messages.filter(msg =>
    msg.categorie === 'questions_specialistes' && msg.reponses && msg.reponses.length > 0 && !msg.reponses.some(r => !!r.auteur_specialite)
  ) : [];

  const mesReponses = isSpecialist ? messages.filter(msg =>
    msg.reponses && msg.reponses.some(r => r.auteur_email === user?.email)
  ) : [];

  // Retour à la liste des sous-forums
  if (selectedSousForum && !messageSelectionne) {
    const forum = SOUS_FORUMS.find(f => f.id === selectedSousForum);
    const Icon = forum?.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 pb-24 lg:pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedSousForum(null)}
              className="active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Retour aux forums</span>
            </Button>
            <Button onClick={() => setShowCreerMessage(true)} className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-600 active:scale-95 transition-transform">
              <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Nouvelle discussion</span>
            </Button>
          </div>

          {forum && (
            <Card className="shadow-lg border-none overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${forum.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {Icon && <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 break-words">{forum.titre}</h2>
                    <p className="text-sm md:text-base text-gray-600 break-words line-clamp-2">{forum.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {messagesFiltres.length > 0 ? (
            <ListeMessages
              messages={messagesNormaux}
              messagesPinned={messagesPinned}
              onSelectMessage={setMessageSelectionne}
              onShowProfile={setShowProfilUtilisateur}
            />
          ) : (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 break-words">Aucune discussion dans ce forum</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // VUE SPÉCIALISTE
  if (isSpecialist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 pb-24 lg:pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3 break-words">
                <Stethoscope className="w-8 h-8 md:w-10 md:h-10 text-teal-600 flex-shrink-0" />
                <span className="break-words">Communauté - Espace Professionnel</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 break-words">
                Partagez votre expertise et aidez les mamans
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => setShowModeration(true)}
                  size="sm"
                  className="active:scale-95 transition-transform"
                >
                  <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Modération</span>
                </Button>
              )}
              <Button onClick={() => setShowCreerMessage(true)} className="bg-gradient-to-r from-teal-500 to-cyan-600 active:scale-95 transition-transform flex-1 md:flex-none">
                <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="truncate">Partager mon expertise</span>
              </Button>
            </div>
          </div>

          {/* Stats Spécialiste */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card className="shadow-lg border-none bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Sans réponse</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{questionsNonRepondues.length}</p>
                  </div>
                  <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-red-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Sans avis pro</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600">{questionsSansReponseSpecialiste.length}</p>
                  </div>
                  <Stethoscope className="w-10 h-10 md:w-12 md:h-12 text-orange-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Mes réponses</p>
                    <p className="text-2xl md:text-3xl font-bold text-teal-600">{mesReponses.length}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-teal-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Total</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-blue-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vue principale */}
          {messageSelectionne ? (
            <DetailMessage
              message={messageSelectionne}
              onRetour={() => setMessageSelectionne(null)}
              onShowProfile={setShowProfilUtilisateur}
            />
          ) : (
            <>
              {/* Onglets Spécialiste */}
              <Tabs value={selectedCategorie} onValueChange={setSelectedCategorie}>
                <TabsList className="w-full h-auto flex flex-wrap gap-1 p-1">
                  <TabsTrigger value="sans_reponse" className="py-2 px-2 md:px-4 text-xs md:text-sm flex items-center gap-1 md:gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Sans réponse ({questionsNonRepondues.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="sans_specialiste" className="py-2 px-2 md:px-4 text-xs md:text-sm flex items-center gap-1 md:gap-2">
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Sans avis ({questionsSansReponseSpecialiste.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="mes_reponses" className="py-2 px-2 md:px-4 text-xs md:text-sm flex items-center gap-1 md:gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Mes réponses ({mesReponses.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="toutes" className="py-2 px-2 md:px-4 text-xs md:text-sm flex items-center gap-1 md:gap-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Toutes ({stats.total})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sans_reponse" className="mt-6">
                  <Card className="mb-6 bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-red-800 break-words">
                        <strong>Questions urgentes :</strong> Ces mamans attendent une réponse. Votre expertise peut les aider !
                      </p>
                    </CardContent>
                  </Card>
                  <ListeMessages
                    messages={questionsNonRepondues}
                    messagesPinned={[]}
                    onSelectMessage={setMessageSelectionne}
                    onShowProfile={setShowProfilUtilisateur}
                  />
                </TabsContent>

                <TabsContent value="sans_specialiste" className="mt-6">
                  <Card className="mb-6 bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-orange-800 break-words">
                        <strong>Avis professionnel attendu :</strong> Ces discussions ont des réponses, mais pas encore d'avis d'un spécialiste.
                      </p>
                    </CardContent>
                  </Card>
                  <ListeMessages
                    messages={questionsSansReponseSpecialiste}
                    messagesPinned={[]}
                    onSelectMessage={setMessageSelectionne}
                    onShowProfile={setShowProfilUtilisateur}
                  />
                </TabsContent>

                <TabsContent value="mes_reponses" className="mt-6">
                  <Card className="mb-6 bg-teal-50 border-teal-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-teal-800 break-words">
                        <strong>Vos contributions :</strong> Discussions auxquelles vous avez apporté votre expertise.
                      </p>
                    </CardContent>
                  </Card>
                  <ListeMessages
                    messages={mesReponses}
                    messagesPinned={[]}
                    onSelectMessage={setMessageSelectionne}
                    onShowProfile={setShowProfilUtilisateur}
                  />
                </TabsContent>

                <TabsContent value="toutes" className="mt-6">
                  {/* Search and filters relevant to all messages */}
                  <Card className="shadow-lg border-none bg-card mb-6">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            placeholder="🔍 Rechercher une discussion..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <SousForumsList
                    onSelectSousForum={setSelectedSousForum}
                    messagesBySousForum={messagesBySousForum}
                  />
                  <div className="mt-6">
                    <ListeMessages
                      messages={messagesNormaux}
                      messagesPinned={messagesPinned}
                      onSelectMessage={setMessageSelectionne}
                      onShowProfile={setShowProfilUtilisateur}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {showCreerMessage && (
            <CreerMessage onClose={() => setShowCreerMessage(false)} />
          )}

          {showProfilUtilisateur && (
            <ProfilUtilisateurForum
              userEmail={showProfilUtilisateur}
              onClose={() => setShowProfilUtilisateur(null)}
            />
          )}

          {showModeration && (
            <OutilsModeration onClose={() => setShowModeration(false)} />
          )}
        </div>
      </div>
    );
  }

  // VUE MAMAN (existante)
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 pb-24 lg:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3 break-words">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-amber-600 flex-shrink-0" />
            <span className="truncate">Communauté</span>
          </h1>
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                onClick={() => setShowModeration(true)}
                size="sm"
                className="active:scale-95 transition-transform"
              >
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Modération</span>
              </Button>
            )}
            <Button onClick={() => setShowCreerMessage(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 flex-1 md:flex-none active:scale-95 transition-transform">
              <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Nouveau message</span>
            </Button>
            <Button onClick={() => setShowExperience(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 flex-1 md:flex-none active:scale-95 transition-transform">
              <Heart className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate hidden md:inline">Partager mon histoire</span>
              <span className="truncate md:hidden">Histoire</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Membres actifs</p>
                  <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.membres}</p>
                </div>
                <Users className="w-10 h-10 md:w-12 md:h-12 text-amber-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Messages totaux</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.total}</p>
                </div>
                <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-orange-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Aujourd'hui</p>
                  <p className="text-2xl md:text-3xl font-bold text-teal-600">{stats.aujourdhui}</p>
                </div>
                <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-teal-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vue principale */}
        {messageSelectionne ? (
          <DetailMessage
            message={messageSelectionne}
            onRetour={() => setMessageSelectionne(null)}
            onShowProfile={setShowProfilUtilisateur}
          />
        ) : (
          <>
            {/* Sous-forums */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 break-words">Forums Thématiques</h2>
              <SousForumsList
                onSelectSousForum={setSelectedSousForum}
                messagesBySousForum={messagesBySousForum}
              />
            </div>

            {/* Recherche et filtres */}
            <Card className="shadow-lg border-none bg-card">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="🔍 Rechercher une discussion..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <Tabs value={selectedCategorie} onValueChange={setSelectedCategorie} className="mt-4">
                  <TabsList className="w-full h-auto flex-wrap justify-start">
                    <TabsTrigger value="toutes" className="py-2 px-2 md:px-4 text-xs md:text-sm">
                      Toutes
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 space-y-6">
                    {/* Grossesse & Maternité */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-pink-700 break-words">🤰 Grossesse & Maternité</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {groupedCategories.grossesse.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategorie(cat.value)}
                            className={`p-3 md:p-4 rounded-lg border-2 text-left transition-all ${
                              selectedCategorie === cat.value
                                ? 'bg-pink-100 border-pink-500 shadow-md'
                                : 'bg-white border-gray-200 hover:border-pink-300 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl md:text-2xl flex-shrink-0">{cat.icon}</span>
                              <span className="font-semibold text-sm break-words">{cat.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {messages.filter(m => m.categorie === cat.value).length} messages
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Santé Enfant */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-700 break-words">👶 Santé de l'Enfant</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {groupedCategories.enfant.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategorie(cat.value)}
                            className={`p-3 md:p-4 rounded-lg border-2 text-left transition-all ${
                              selectedCategorie === cat.value
                                ? 'bg-blue-100 border-blue-500 shadow-md'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl md:text-2xl flex-shrink-0">{cat.icon}</span>
                              <span className="font-semibold text-sm break-words">{cat.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {messages.filter(m => m.categorie === cat.value).length} messages
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nutrition & Santé */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-700 break-words">🥗 Nutrition & Santé</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[...groupedCategories.nutrition, ...groupedCategories.sante].map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategorie(cat.value)}
                            className={`p-3 md:p-4 rounded-lg border-2 text-left transition-all ${
                              selectedCategorie === cat.value
                                ? 'bg-green-100 border-green-500 shadow-md'
                                : 'bg-white border-gray-200 hover:border-green-300 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl md:text-2xl flex-shrink-0">{cat.icon}</span>
                              <span className="font-semibold text-sm break-words">{cat.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {messages.filter(m => m.categorie === cat.value).length} messages
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spécial */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-purple-700 break-words">✨ Forums Spéciaux</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {groupedCategories.special.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategorie(cat.value)}
                            className={`p-3 md:p-4 rounded-lg border-2 text-left transition-all ${
                              selectedCategorie === cat.value
                                ? 'bg-purple-100 border-purple-500 shadow-md'
                                : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl md:text-2xl flex-shrink-0">{cat.icon}</span>
                              <span className="font-semibold text-sm break-words">{cat.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {messages.filter(m => m.categorie === cat.value).length} messages
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Messages */}
            <ListeMessages
              messages={messagesNormaux}
              messagesPinned={messagesPinned}
              onSelectMessage={setMessageSelectionne}
              onShowProfile={setShowProfilUtilisateur}
            />
          </>
        )}

        {showCreerMessage && (
          <CreerMessage onClose={() => setShowCreerMessage(false)} />
        )}

        {showProfilUtilisateur && (
          <ProfilUtilisateurForum
            userEmail={showProfilUtilisateur}
            onClose={() => setShowProfilUtilisateur(null)}
          />
        )}

        {showModeration && (
          <OutilsModeration onClose={() => setShowModeration(false)} />
        )}

        {showExperience && (
          <ExperienceSharing onClose={() => setShowExperience(false)} defaultCategorie={selectedCategorie} />
        )}
      </div>
    </div>
  );
}