import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Bot,
  Send,
  X,
  User,
  Sparkles,
  Calendar,
  Stethoscope,
  MessageCircle,
  ArrowRight,
  Phone,
  Mic,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const QUICK_ACTIONS = [
  { id: 'rdv', label: 'Prendre RDV', icon: Calendar, prompt: 'Je voudrais prendre un rendez-vous' },
  { id: 'specialiste', label: 'Trouver un spécialiste', icon: Stethoscope, prompt: 'Je cherche un spécialiste' },
  { id: 'services', label: 'Nos services', icon: Sparkles, prompt: 'Quels sont vos services ?' },
  { id: 'tarifs', label: 'Tarifs & CMU', icon: Phone, prompt: 'Informations sur les tarifs et la CMU' },
];

export default function ChatbotWidget({ isOpen, onToggle, fullPage = false }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: "👋 Bonjour ! Je suis l'assistant virtuel d'A'lo Maman. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
      quickActions: QUICK_ACTIONS
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: [],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      // Contexte pour l'IA
      const context = `
Tu es l'assistant virtuel d'A'lo Maman, une plateforme de télémédecine spécialisée en santé maternelle et infantile en Côte d'Ivoire.

SERVICES DISPONIBLES:
- Consultations avec gynécologues, pédiatres, sages-femmes, médecins généralistes, nutritionnistes
- Suivi de grossesse personnalisé
- Carnets de santé numériques pour enfants
- Suivi de contraception
- Assistant IA pour conseils santé
- Communauté d'entraide entre mamans
- Rappels automatiques (RDV, vaccins, médicaments)

SPÉCIALISTES DISPONIBLES:
${professionnels.slice(0, 5).map(p => `- ${p.nom_complet} (${p.specialite}) à ${p.ville || 'Non spécifié'}`).join('\n')}

TARIFS & CMU:
- CMU prise en charge pour la plupart des services
- Contraception: remboursée 70-100% par CMU
- Consultations: tarifs variables selon spécialiste
- Abonnement Premium: accès illimité messagerie et communauté

TYPES DE CONSULTATION:
- Cabinet
- Clinique
- Hôpital
- Téléphone (téléconsultation)

INSTRUCTIONS:
1. Réponds de manière chaleureuse, professionnelle et concise
2. Si la question concerne un RDV, propose de consulter la page Téléconsultation
3. Si c'est complexe ou médical sensible, recommande de contacter un professionnel via messagerie
4. Utilise des emojis pour rendre la conversation agréable
5. Fournis des réponses structurées et claires
6. Si tu ne sais pas, recommande de contacter le support

QUESTION DE L'UTILISATEUR:
${userMessage}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        add_context_from_internet: false,
      });

      return response;
    },
    onSuccess: (response, userMessage) => {
      const botMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
      };

      // Ajouter des actions suggérées selon le contexte
      const messageLower = userMessage.toLowerCase();
      if (messageLower.includes('rendez-vous') || messageLower.includes('rdv')) {
        botMessage.suggestions = [
          { label: 'Voir les spécialistes', link: createPageUrl('Teleconsultation'), icon: Stethoscope },
          { label: 'Mon agenda', link: createPageUrl('Calendrier'), icon: Calendar }
        ];
      } else if (messageLower.includes('spécialiste') || messageLower.includes('médecin')) {
        botMessage.suggestions = [
          { label: 'Trouver un spécialiste', link: createPageUrl('Teleconsultation'), icon: Stethoscope }
        ];
      } else if (messageLower.includes('grossesse') || messageLower.includes('enceinte')) {
        botMessage.suggestions = [
          { label: 'Suivi grossesse', link: createPageUrl('Grossesse'), icon: Sparkles }
        ];
      } else if (messageLower.includes('enfant') || messageLower.includes('bébé')) {
        botMessage.suggestions = [
          { label: 'Carnets enfants', link: createPageUrl('Enfants'), icon: Calendar }
        ];
      } else if (messageLower.includes('contraception')) {
        botMessage.suggestions = [
          { label: 'Guide contraception', link: createPageUrl('Contraception'), icon: Sparkles }
        ];
      } else if (messageLower.includes('communauté') || messageLower.includes('forum')) {
        botMessage.suggestions = [
          { label: 'Rejoindre la communauté', link: createPageUrl('Communaute'), icon: MessageCircle }
        ];
      }

      // Détecter si on doit suggérer le transfert vers un humain
      if (messageLower.includes('urgence') || messageLower.includes('douleur') || messageLower.includes('saignement') || messageLower.includes('grave')) {
        botMessage.alert = {
          type: 'warning',
          message: '⚠️ Pour les urgences médicales, consultez immédiatement un professionnel de santé ou appelez le 185.',
          action: { label: 'Contacter un spécialiste', link: createPageUrl('Messagerie') }
        };
      }

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: "❌ Désolé, j'ai rencontré une erreur. Veuillez réessayer ou contacter notre support.",
        timestamp: new Date(),
        isError: true
      }]);
      setIsTyping(false);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    chatMutation.mutate(input);
  };

  const handleQuickAction = (action) => {
    setInput(action.prompt);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speech Recognition using Web Speech API
  const recognitionRef = useRef(null);

  const startRecording = () => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur. Utilisez Chrome ou Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update input with interim results for visual feedback
      if (interimTranscript) {
        setInput(interimTranscript);
      }
      if (finalTranscript) {
        setInput(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (event.error === 'not-allowed') {
        alert('Veuillez autoriser l\'accès au microphone.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      // Auto-send if there's text
      if (input.trim()) {
        setTimeout(() => {
          handleSend();
        }, 300);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen && !fullPage) return null;

  return (
    <div className={fullPage ? 'h-full flex flex-col' : 'h-full w-full md:h-full md:w-full flex flex-col'}>
      <Card className="shadow-2xl border-none h-full flex flex-col rounded-none md:rounded-2xl">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Assistant A'lo Maman</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-purple-100">En ligne</span>
                </div>
              </div>
            </div>
            {!fullPage && (
              <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Messages - Native scroll */}
        <CardContent 
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50 to-pink-50"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 flex-shrink-0 ${message.type === 'user' ? 'bg-pink-500' : 'bg-purple-500'}`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </Avatar>
                
                <div className="flex flex-col gap-2">
                  <div className={`p-3 rounded-2xl ${
                    message.type === 'user' 
                      ? 'bg-pink-500 text-white' 
                      : message.isError 
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-white shadow-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  {message.quickActions && (
                    <div className="grid grid-cols-2 gap-2">
                      {message.quickActions.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="text-xs h-auto py-2 flex flex-col items-center gap-1 bg-white hover:bg-purple-50"
                        >
                          <action.icon className="w-4 h-4 text-purple-600" />
                          <span>{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="space-y-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full justify-start bg-white hover:bg-purple-50"
                        >
                          <Link to={suggestion.link} onClick={onToggle}>
                            <suggestion.icon className="w-4 h-4 mr-2 text-purple-600" />
                            {suggestion.label}
                            <ArrowRight className="w-4 h-4 ml-auto" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Alert */}
                  {message.alert && (
                    <div className={`p-3 rounded-lg border-2 ${
                      message.alert.type === 'warning' 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-blue-50 border-blue-300'
                    }`}>
                      <p className="text-sm text-gray-800 mb-2">{message.alert.message}</p>
                      {message.alert.action && (
                        <Button size="sm" asChild className="w-full bg-orange-600 hover:bg-orange-700">
                          <Link to={message.alert.action.link} onClick={onToggle}>
                            {message.alert.action.label}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <Avatar className="w-8 h-8 bg-purple-500">
                  <Bot className="w-5 h-5 text-white" />
                </Avatar>
                <div className="bg-white p-3 rounded-2xl shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input - Native keyboard handling */}
        <div 
          className="p-4 border-t bg-white flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {isRecording ? (
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 border-2 border-red-200">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Parlez maintenant...</p>
                <p className="text-xs text-gray-500 truncate">{input || 'En écoute...'}</p>
              </div>
              <span className="font-mono text-sm text-gray-600">{formatTime(recordingTime)}</span>
              <Button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 h-10 w-10 rounded-full"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={startRecording}
                disabled={isTyping}
                variant="outline"
                className="h-12 w-12 border-2 border-purple-300 hover:bg-purple-50 active:scale-95 transition-transform"
              >
                <Mic className="w-5 h-5 text-purple-600" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 h-12 text-base"
                disabled={isTyping}
                autoComplete="off"
                autoCorrect="on"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700 h-12 w-12 active:scale-95 transition-transform"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isRecording ? '🎤 Parlez clairement, puis appuyez stop' : '💡 Appuyez sur 🎤 pour dicter ou écrivez votre question'}
          </p>
        </div>
      </Card>
    </div>
  );
}