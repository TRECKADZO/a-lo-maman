import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  Stethoscope,
  Calendar,
  DollarSign,
  Activity,
  Users,
  Settings,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const suggestions = [
  "Comment configurer mes disponibilités pour les consultations ?",
  "Comment fonctionne la facturation avec la CMU ?",
  "Comment générer une ordonnance électronique sécurisée ?",
  "Expliquez-moi le système de file d'attente virtuelle",
  "Comment consulter les données vitales de mes patients ?",
  "Quelles sont les nouvelles fonctionnalités de télémédecine ?",
  "Comment gérer mes tarifs et assurances acceptées ?",
  "Comment voir mes statistiques et revenus ?"
];

const categories = [
  { nom: 'Gestion administrative', icon: Settings, color: 'text-blue-500' },
  { nom: 'Facturation & revenus', icon: DollarSign, color: 'text-green-500' },
  { nom: 'Télémédecine', icon: Activity, color: 'text-purple-500' },
  { nom: 'Patients & dossiers', icon: Users, color: 'text-orange-500' },
  { nom: 'Fonctionnalités', icon: Lightbulb, color: 'text-yellow-500' }
];

export default function AssistantIAPro() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profilPro, isLoading: profileLoading } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  const { data: mesPatients } = useQuery({
    queryKey: ['mes_patients_count', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
    },
    enabled: !!profilPro,
    initialData: []
  });

  const { data: mesRendezVous } = useQuery({
    queryKey: ['rdv_count', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.RendezVous.filter({
        professionnel_id: profilPro.id
      });
    },
    enabled: !!profilPro,
    initialData: []
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Message d'accueil
  useEffect(() => {
    if (user && profilPro && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour Dr. ${profilPro.nom_complet} ! 👨‍⚕️\n\nJe suis votre assistant virtuel pour vous aider à utiliser efficacement A'lo Maman Pro.\n\n📋 **Ce que je peux faire pour vous :**\n\n• Répondre à vos questions sur la facturation (CMU, assurances)\n• Vous guider dans la configuration de vos disponibilités\n• Expliquer le fonctionnement des nouvelles fonctionnalités de télémédecine\n• Vous aider avec la gestion des ordonnances électroniques\n• Clarifier les règles de sécurité et confidentialité (RLS)\n• Vous informer sur les mises à jour et bonnes pratiques\n\nComment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date()
      }]);
    }
  }, [user, profilPro, messages.length]);

  const buildContext = () => {
    let context = `Tu es un assistant IA expert spécialisé dans le support des professionnels de santé utilisant la plateforme "A'lo Maman" en Côte d'Ivoire. Tu parles français de manière professionnelle et claire.\n\n`;
    
    context += `PROFIL DU PROFESSIONNEL:\n`;
    context += `- Nom: Dr. ${profilPro?.nom_complet}\n`;
    context += `- Spécialité: ${profilPro?.specialite}\n`;
    context += `- Nombre de patients suivis: ${mesPatients?.length || 0}\n`;
    context += `- Nombre de rendez-vous: ${mesRendezVous?.length || 0}\n`;
    context += `- Tarif consultation: ${profilPro?.tarif_consultation || 'Non défini'} FCFA\n`;
    context += `- Accepte CMU: ${profilPro?.accepte_cmu ? 'Oui' : 'Non'}\n`;
    context += `- Assurances acceptées: ${profilPro?.assurances_acceptees?.join(', ') || 'Aucune définie'}\n`;
    
    if (profilPro?.disponibilites && profilPro.disponibilites.length > 0) {
      context += `- Disponibilités configurées: ${profilPro.disponibilites.length} créneaux\n`;
    } else {
      context += `- ⚠️ Aucune disponibilité configurée\n`;
    }

    context += `\nFONCTIONNALITÉS DE LA PLATEFORME:\n\n`;

    context += `**1. GESTION ADMINISTRATIVE**\n`;
    context += `• Configuration des disponibilités (jours, horaires, types de consultation)\n`;
    context += `• Gestion des tarifs personnalisés\n`;
    context += `• Définition des assurances acceptées\n`;
    context += `• Configuration des rappels automatiques (24h et 1h avant RDV)\n\n`;

    context += `**2. FACTURATION & REVENUS**\n`;
    context += `• CMU (Couverture Maladie Universelle): Prise en charge 100% par l'État ivoirien\n`;
    context += `• Assurances privées: NSIA, Saham, Allianz, Sunu, etc.\n`;
    context += `• Paiement direct patients\n`;
    context += `• Tableau de bord analytique avec statistiques revenus\n`;
    context += `• Export des données pour comptabilité\n\n`;

    context += `**3. TÉLÉMÉDECINE**\n`;
    context += `• Consultations par vidéo (téléconsultation)\n`;
    context += `• Consultations téléphoniques\n`;
    context += `• File d'attente virtuelle avec gestion des urgences\n`;
    context += `• Monitoring santé en temps réel (données vitales des patients)\n`;
    context += `• Ordonnances électroniques sécurisées avec signature numérique\n`;
    context += `• Appels vidéo intégrés dans la messagerie\n\n`;

    context += `**4. GESTION PATIENTS**\n`;
    context += `• Dossiers médicaux électroniques\n`;
    context += `• Suivi des données vitales (fréquence cardiaque, tension, température)\n`;
    context += `• Alertes automatiques en cas de valeurs anormales\n`;
    context += `• Historique des consultations\n`;
    context += `• Carnets de santé enfants\n`;
    context += `• Messagerie sécurisée avec les patients\n\n`;

    context += `**5. ORDONNANCES ÉLECTRONIQUES**\n`;
    context += `• Génération d'ordonnances sécurisées\n`;
    context += `• Signature électronique avec hash SHA-256\n`;
    context += `• QR Code pour authentification\n`;
    context += `• Traçabilité complète (qui consulte, quand)\n`;
    context += `• Validité standard 3 mois\n`;
    context += `• Export PDF automatique\n\n`;

    context += `**6. FILE D'ATTENTE VIRTUELLE**\n`;
    context += `• Gestion en temps réel des patients en attente\n`;
    context += `• Priorisation par niveau d'urgence (normale, modérée, urgente)\n`;
    context += `• Estimation temps d'attente automatique\n`;
    context += `• Notifications automatiques aux patients\n`;
    context += `• Stats en direct (nombre en attente, durée moyenne)\n\n`;

    context += `**7. RÈGLES DE SÉCURITÉ (RLS)**\n`;
    context += `• Les professionnels ne peuvent modifier que leurs propres données\n`;
    context += `• Les dossiers patients sont accessibles uniquement si le pro est dans "professionnels_suivi"\n`;
    context += `• Les ordonnances sont créées avec signature électronique\n`;
    context += `• Les données vitales ne sont accessibles qu'aux pros autorisés\n`;
    context += `• Toutes les actions sont tracées et horodatées\n\n`;

    context += `**8. TABLEAU DE BORD ANALYTIQUE**\n`;
    context += `• Statistiques consultations (nombre, durée, type)\n`;
    context += `• Revenus par période (jour, mois, année)\n`;
    context += `• Répartition revenus (CMU, assurance, direct)\n`;
    context += `• Taux d'utilisation des fonctionnalités\n`;
    context += `• Graphiques d'évolution\n`;
    context += `• Export CSV pour comptabilité\n\n`;

    context += `INSTRUCTIONS:\n`;
    context += `- Soit professionnel, clair et concis\n`;
    context += `- Donne des instructions étape par étape quand nécessaire\n`;
    context += `- Utilise des exemples concrets adaptés au contexte ivoirien\n`;
    context += `- Si le professionnel n'a pas configuré quelque chose d'important (disponibilités, tarifs), suggère-le\n`;
    context += `- Mentionne les pages pertinentes de l'app (Mon Agenda, GestionDisponibilites, DashboardAnalytics, etc.)\n`;
    context += `- Explique les avantages de chaque fonctionnalité\n`;
    context += `- Pour les questions techniques, donne des réponses précises\n`;
    context += `- Si tu ne sais pas quelque chose, admets-le et suggère de contacter le support\n`;
    context += `- Utilise des émojis professionnels avec parcimonie (📋 ✅ 💡 ⚠️)\n`;

    return context;
  };

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const context = buildContext();
      
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'Professionnel' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      const fullPrompt = `${context}\n\nHISTORIQUE DE CONVERSATION:\n${conversationHistory}\n\nProfessionnel: ${userMessage}\n\nAssistant:`;

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
        content: "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.",
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

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Vérifier que c'est bien un professionnel
  const specialites = ['gynecologie', 'pediatrie', 'sage_femme', 'medecin_generaliste', 'infirmier', 'nutritionniste'];
  const isSpecialist = profilPro?.specialite && specialites.includes(profilPro.specialite);

  if (!isSpecialist) {
    navigate(createPageUrl('Dashboard'), { replace: true });
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-teal-100 dark:border-gray-800 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Assistant IA Professionnel
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Support et guide pour l'utilisation de A'lo Maman Pro
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards (visible when no messages) */}
      {messages.length <= 1 && (
        <div className="hidden md:block px-8 py-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-none shadow-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                <CardContent className="p-4">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">Patients suivis</h3>
                  <p className="text-2xl font-bold text-blue-600">{mesPatients?.length || 0}</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-gradient-to-br from-green-100 to-emerald-100">
                <CardContent className="p-4">
                  <Calendar className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">Rendez-vous</h3>
                  <p className="text-2xl font-bold text-green-600">{mesRendezVous?.length || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-purple-100 to-indigo-100">
                <CardContent className="p-4">
                  <Stethoscope className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">Spécialité</h3>
                  <p className="text-sm font-medium text-purple-600">{profilPro?.specialite}</p>
                </CardContent>
              </Card>
            </div>

            {/* Catégories d'aide */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Domaines d'assistance</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Badge key={cat.nom} variant="outline" className="px-3 py-2">
                      <Icon className={`w-4 h-4 mr-2 ${cat.color}`} />
                      {cat.nom}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-teal-400 to-cyan-500' 
                  : 'bg-gradient-to-br from-blue-400 to-purple-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-lg border border-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions (show when few messages) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Questions fréquentes :
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-white/80 dark:bg-gray-800/80 hover:bg-teal-50 dark:hover:bg-gray-700"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-teal-100 dark:border-gray-800 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Posez votre question..."
              disabled={isTyping}
              className="flex-1 bg-white dark:bg-gray-800"
            />
            
            <Button 
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Assistant IA pour vous aider dans la gestion de votre activité professionnelle
          </p>
        </div>
      </div>
    </div>
  );
}