import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  Baby,
  Heart,
  MessageCircle,
  Mic,
  X,
  Camera
} from 'lucide-react';
import { differenceInWeeks, differenceInMonths } from 'date-fns';
import VoiceRecorder from '../components/general/VoiceRecorder';
import AnalyseImageSante from '../components/ia/AnalyseImageSante';
import { PageTransition, CardTransition } from '@/components/ui/page-transition';
import { MobilePageContainer, StickyHeader, KeyboardAvoidingView } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';

const suggestions = [
  "Quels sont les symptômes normaux au premier trimestre ?",
  "Mon bébé a une éruption cutanée, que faire ?",
  "Quels vaccins sont recommandés pour mon bébé ?",
  "Comment gérer les nausées matinales ?",
  "Conseils nutrition adaptés à ma grossesse"
];

export default function AssistantIA() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: grossesse } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({ grossesse_active: true });
      return grossesses[0] || null;
    },
    initialData: null,
  });

  const { data: enfants } = useQuery({
    queryKey: ['enfants'],
    queryFn: async () => {
      const allEnfants = await base44.entities.EnfantCarnet.list('-date_naissance');
      return allEnfants;
    },
    initialData: [],
  });

  const { data: suiviContraception } = useQuery({
    queryKey: ['suiviContraception'],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviContraception.filter({ active: true });
      return suivis[0] || null;
    },
    initialData: null,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour ${user.full_name} ! 👋\n\nJe suis votre assistante personnelle A'lo Maman. Je suis là pour répondre à vos questions sur la grossesse, la santé de vos enfants, et vous aider à naviguer dans l'application.\n\nComment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date()
      }]);
    }
  }, [user, messages.length]);

  const buildContext = () => {
    let context = `Tu es un assistant IA bienveillant et expert en santé maternelle et infantile pour l'application "A'lo Maman" en Côte d'Ivoire. Tu parles français de manière chaleureuse et professionnelle.\n\n`;
    
    context += `PROFIL DE L'UTILISATRICE:\n`;
    context += `- Nom: ${user?.full_name}\n`;
    
    if (userProfile) {
      context += `- Ville: ${userProfile.ville || 'Non renseignée'}\n`;
      context += `- Région: ${userProfile.region || 'Non renseignée'}\n`;
    }

    if (grossesse) {
      const today = new Date();
      const ddr = new Date(grossesse.date_derniere_regle);
      const semainesGrossesse = Math.floor(differenceInWeeks(today, ddr));
      const trimestre = semainesGrossesse < 14 ? 1 : semainesGrossesse < 28 ? 2 : 3;
      
      context += `\nGROSSESSE ACTIVE:\n`;
      context += `- Semaines de grossesse: ${semainesGrossesse} SA\n`;
      context += `- Trimestre: ${trimestre}\n`;
      context += `- Date d'accouchement prévue: ${grossesse.date_accouchement_prevue}\n`;
      context += `- Type de grossesse: ${grossesse.type_grossesse}\n`;
      
      const symptomsRecents = (grossesse.symptomes_journal || [])
        .slice(-3)
        .flatMap(e => e.symptomes || []);
      if (symptomsRecents.length > 0) {
        context += `- Symptômes récents notés: ${[...new Set(symptomsRecents)].join(', ')}\n`;
      }

      const consultations = (grossesse.consultations || []).filter(c => c.poids);
      if (consultations.length > 0) {
        const dernierPoids = consultations[consultations.length - 1].poids;
        context += `- Dernier poids enregistré: ${dernierPoids} kg\n`;
      }

      const mouvementsRecents = (grossesse.mouvements_bebe || [])
        .filter(m => {
          const dateM = new Date(m.date);
          const diff = Math.floor((today - dateM) / (1000 * 60 * 60 * 24));
          return diff <= 7;
        });
      if (mouvementsRecents.length > 0) {
        const moyenne = Math.round(
          mouvementsRecents.reduce((sum, m) => sum + m.nombre_mouvements, 0) / mouvementsRecents.length
        );
        context += `- Mouvements du bébé (moyenne 7 derniers jours): ${moyenne}/jour\n`;
      }
    }

    if (enfants && enfants.length > 0) {
      context += `\nENFANTS:\n`;
      enfants.forEach((enfant, index) => {
        const mois = differenceInMonths(new Date(), new Date(enfant.date_naissance));
        context += `${index + 1}. ${enfant.prenom} (${mois} mois, ${enfant.sexe})\n`;
        
        if (enfant.allergies && enfant.allergies.length > 0) {
          context += `   - Allergies: ${enfant.allergies.join(', ')}\n`;
        }

        if (enfant.jalons_developpement && enfant.jalons_developpement.length > 0) {
          const derniersJalons = enfant.jalons_developpement
            .sort((a, b) => new Date(b.date_atteint) - new Date(a.date_atteint))
            .slice(0, 3)
            .map(j => j.jalon);
          context += `   - Jalons récents: ${derniersJalons.join(', ')}\n`;
        }

        if (enfant.vaccins) {
          const vaccinsEnRetard = enfant.vaccins.filter(v => 
            v.prochain_rappel && new Date(v.prochain_rappel) < new Date()
          );
          if (vaccinsEnRetard.length > 0) {
            context += `   - ⚠️ ${vaccinsEnRetard.length} vaccin(s) en retard\n`;
          }
        }

        if (enfant.mesures_croissance && enfant.mesures_croissance.length > 0) {
          const derniereMesure = enfant.mesures_croissance[enfant.mesures_croissance.length - 1];
          context += `   - Dernières mesures: ${derniereMesure.poids}kg, ${derniereMesure.taille}cm\n`;
        }
      });
    }

    if (suiviContraception) {
      context += `\nCONTRACEPTION:\n`;
      context += `- Méthode active en cours de suivi\n`;
    }

    context += `\nTES CAPACITÉS:\n`;
    context += `1. Répondre aux questions sur la grossesse, l'accouchement, le post-partum\n`;
    context += `2. Conseiller sur la santé et le développement des enfants\n`;
    context += `3. Guider dans l'utilisation de l'application A'lo Maman\n`;
    context += `4. Recommander des spécialistes (gynécologues, pédiatres, sages-femmes, etc.)\n`;
    context += `5. Aider à prendre rendez-vous avec des professionnels\n`;
    context += `6. Donner des informations sur la contraception\n`;
    context += `7. Répondre aux questions sur les vaccins (grossesse et enfants)\n`;
    context += `8. Fournir des conseils personnalisés basés sur les données de suivi\n`;
    context += `9. Alerter sur les rendez-vous ou vaccins en retard\n\n`;

    context += `CONTEXTE MÉDICAL IVOIRIEN:\n`;
    context += `- La CMU (Couverture Maladie Universelle) est disponible et couvre 70-100% des soins\n`;
    context += `- Les consultations prénatales sont essentielles et recommandées dès le 2ème mois\n`;
    context += `- Le calendrier vaccinal ivoirien doit être respecté\n`;
    context += `- Les structures de santé incluent des PMI, cliniques, hôpitaux\n\n`;

    context += `INSTRUCTIONS:\n`;
    context += `- Soit toujours chaleureuse, rassurante et professionnelle\n`;
    context += `- Personnalise tes réponses selon le profil et les données de suivi de l'utilisatrice\n`;
    context += `- Utilise les données de tracking (symptômes, poids, jalons) pour donner des conseils adaptés\n`;
    context += `- Si on te demande de trouver un spécialiste, suggère d'utiliser la page "Rendez-vous"\n`;
    context += `- Si on te demande de prendre RDV, guide étape par étape\n`;
    context += `- En cas de symptômes graves ou urgents, recommande TOUJOURS de consulter immédiatement\n`;
    context += `- Ne donne jamais de diagnostic médical, mais des informations générales\n`;
    context += `- Si tu vois des alertes (vaccins en retard, symptômes inquiétants), mentionne-les avec tact\n`;
    context += `- Utilise des émojis avec parcimonie pour rendre la conversation agréable\n`;

    return context;
  };

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const context = buildContext();
      
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'Utilisatrice' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      const fullPrompt = `${context}\n\nHISTORIQUE DE CONVERSATION:\n${conversationHistory}\n\nUtilisatrice: ${userMessage}\n\nAssistant:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error("Error calling AI:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolée, je rencontre un problème technique. Veuillez réessayer dans quelques instants.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  });

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    chatMutation.mutate(message);
  };

  const handleVoiceMessage = async (audioFile) => {
    setIsTranscribing(true);
    setShowVoiceRecorder(false);

    try {
      // Afficher un message temporaire avec animation
      const tempMessage = {
        role: 'user',
        content: '🎤 Transcription audio en cours...',
        timestamp: new Date(),
        isTranscribing: true
      };
      setMessages(prev => [...prev, tempMessage]);

      // Uploader le fichier audio
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      // Utiliser l'IA pour transcrire l'audio
      const transcriptionPrompt = `Tu es un assistant de transcription audio. Transcris fidèlement ce message audio en français.
      
INSTRUCTIONS:
- Donne UNIQUEMENT le texte transcrit, mot pour mot
- Ne fais aucun commentaire, aucune introduction, aucune conclusion
- Si l'audio est inaudible ou vide, réponds simplement: "[Audio inaudible]"
- Corrige les fautes de grammaire mineures si nécessaire
- Garde le ton et le style naturel du locuteur`;
      
      const transcription = await base44.integrations.Core.InvokeLLM({
        prompt: transcriptionPrompt,
        file_urls: file_url,
        add_context_from_internet: false
      });

      // Retirer le message temporaire
      setMessages(prev => prev.filter(m => !m.isTranscribing));
      
      // Vérifier si la transcription est valide
      if (transcription && transcription.trim() && !transcription.includes('[Audio inaudible]')) {
        // Envoyer la transcription comme question
        handleSendMessage(transcription.trim());
      } else {
        // Message d'erreur si transcription échouée
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Je n'ai pas pu comprendre votre message vocal. Pouvez-vous réessayer en parlant plus clairement ou utiliser le texte ?",
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      setMessages(prev => prev.filter(m => !m.isTranscribing));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolée, je n'ai pas pu transcrire votre message vocal. Veuillez réessayer ou écrire votre question.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  // Redirection pour les non-mamans
  useEffect(() => {
    if (userProfile && userProfile.type_compte !== 'maman') {
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [userProfile, navigate]);

  if (profileLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <PageTransition type="fade">
      <MobilePageContainer
        bg="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-950"
        header={
          <StickyHeader blur className="border-b border-purple-100 dark:border-gray-800">
            <div className="px-4 py-3 md:px-8 md:py-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl flex-shrink-0">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                      Assistant A'lo Maman
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                        En ligne
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StickyHeader>
        }
      >

        {/* Context Cards animées */}
        {messages.length <= 1 && (
          <div className="px-4 py-4 md:px-8 md:py-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {grossesse && (
                  <CardTransition delay={0.05}>
                    <Card className="border-none shadow-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Grossesse Active</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {Math.floor(differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle)))} SA
                        </p>
                      </CardContent>
                    </Card>
                  </CardTransition>
                )}
                
                {enfants && enfants.length > 0 && (
                  <CardTransition delay={0.1}>
                    <Card className="border-none shadow-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                          <Baby className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{enfants.length} Enfant{enfants.length > 1 ? 's' : ''}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Suivis dans l'app
                        </p>
                      </CardContent>
                    </Card>
                  </CardTransition>
                )}

                <CardTransition delay={0.15}>
                  <Card className="border-none shadow-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Questions</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Posez-moi tout !
                      </p>
                    </CardContent>
                  </Card>
                </CardTransition>

                <CardTransition delay={0.2}>
                  <Card className="border-none shadow-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Analyse Photo</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Éruption cutanée, etc.
                      </p>
                    </CardContent>
                  </Card>
                </CardTransition>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area avec scroll optimisé */}
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <CardTransition key={index} delay={index * 0.05}>
              <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-pink-400 to-rose-500' 
                    : 'bg-gradient-to-br from-purple-400 to-pink-500'
                }`}>
                  {message.role === 'user' ? (
                    message.isTranscribing ? (
                      <Mic className="w-6 h-6 text-white animate-pulse" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )
                  ) : (
                    <Bot className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-lg ${
                    message.role === 'user'
                      ? message.isTranscribing 
                        ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
                        : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                  }`}>
                    {message.isTranscribing ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Transcription audio en cours...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{message.content}</p>
                    )}
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </CardTransition>
          ))}

          {isTyping && (
            <CardTransition>
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-3xl px-5 py-3 shadow-lg">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </CardTransition>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions et outils */}
        {messages.length <= 1 && (
          <div className="px-4 pb-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Analyse d'image */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-500" />
                  Analyse visuelle :
                </p>
                <AnalyseImageSante 
                  onAnalysisComplete={(result) => {
                    const summary = `J'ai analysé l'image. ${result.message_rassurant || ''} 
                    Niveau d'urgence: ${result.niveau_urgence}. ${result.quand_consulter || ''}`;
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: summary,
                      timestamp: new Date()
                    }]);
                  }}
                />
              </div>

              {/* Questions fréquentes */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Questions fréquentes :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestions.map((suggestion, index) => (
                    <CardTransition key={index} delay={0.25 + (index * 0.05)}>
                      <Touchable 
                        onPress={() => handleSuggestionClick(suggestion)}
                        haptic
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left text-xs md:text-sm bg-white/90 dark:bg-gray-800/90 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-2xl border-purple-200 shadow-sm py-3 px-4"
                        >
                          <MessageCircle className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                          <span className="line-clamp-2">{suggestion}</span>
                        </Button>
                      </Touchable>
                    </CardTransition>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area avec safe area */}
        <KeyboardAvoidingView>
          <div 
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-purple-200 dark:border-gray-800 px-4 py-3 md:px-8 md:py-4 shadow-2xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-4xl mx-auto">
              {showVoiceRecorder ? (
                <div className="mb-3 bg-purple-50 dark:bg-purple-900/20 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      🎤 Message vocal
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowVoiceRecorder(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <VoiceRecorder
                    onSend={handleVoiceMessage}
                    onCancel={() => setShowVoiceRecorder(false)}
                    disabled={isTranscribing}
                  />
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                  <Touchable 
                    onPress={() => setShowVoiceRecorder(true)}
                    disabled={isTyping || isTranscribing}
                    haptic
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isTyping || isTranscribing}
                      className="shrink-0 w-12 h-12 bg-purple-50 border-2 border-purple-300 hover:bg-purple-100 dark:bg-purple-900/30 rounded-2xl shadow-lg"
                    >
                      <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </Button>
                  </Touchable>

                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={isTyping || isTranscribing}
                    className="flex-1 bg-white dark:bg-gray-800 h-12 rounded-2xl border-2 border-purple-200 focus:border-purple-400 px-4 text-base"
                  />
                  
                  <Touchable 
                    onPress={() => handleSendMessage()}
                    disabled={isTyping || !inputMessage.trim() || isTranscribing}
                    haptic
                  >
                    <Button 
                      type="submit"
                      disabled={isTyping || !inputMessage.trim() || isTranscribing}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-12 h-12 rounded-2xl shadow-lg"
                    >
                      {isTyping ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </Touchable>
                </form>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center leading-relaxed px-2">
                {showVoiceRecorder 
                  ? '🎤 Enregistrez votre question - transcription automatique'
                  : '💡 L\'assistant IA ne remplace pas un avis médical professionnel'
                }
              </p>
            </div>
          </div>
        </KeyboardAvoidingView>
      </MobilePageContainer>
    </PageTransition>
  );
}