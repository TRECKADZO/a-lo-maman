
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Loader2, Users, Stethoscope, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import ConversationList from '../components/messagerie/ConversationList';
import MessageView from '../components/messagerie/MessageView';
import AuthGuard from '../components/auth/AuthGuard';

export default function Messagerie() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationIdFromUrl = params.get('conversationId');
    if (conversationIdFromUrl) {
      setSelectedConversationId(conversationIdFromUrl);
    } else {
      setSelectedConversationId(null);
    }
  }, [location.search]);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.filter({ email: user.email }).catch(() => [])
      ]);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfiles[0] || null
      };
    },
    enabled: !!user,
  });
  
  const isSpecialist = !!profiles?.pro;
  const profilPro = profiles?.pro;

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Conversation.filter(
        { participant_emails: { "$in": [user.email] } }, 
        '-last_message_date'
      );
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Compter les messages non lus par conversation
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['unreadCounts', user?.email],
    queryFn: async () => {
      if (!user) return {};
      const allMessages = await base44.entities.Message.filter({ 
        sender_email: { $ne: user.email },
        is_read: false 
      });
      
      const counts = {};
      allMessages.forEach(msg => {
        counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: mesPatients = [] } = useQuery({
    queryKey: ['mes_patients', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      const enfants = await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
      return enfants;
    },
    enabled: !!profilPro && isSpecialist,
  });

  if (isLoadingUser || isLoadingProfiles) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      </AuthGuard>
    );
  }

  // Mobile view logic
  if (typeof window !== 'undefined' && window.innerWidth < 768 && selectedConversationId) {
    return (
      <AuthGuard>
        <div className="h-full flex flex-col">
          <MessageView
            conversationId={selectedConversationId}
            currentUserEmail={user?.email}
            isSpecialist={isSpecialist}
            onBack={() => {
              setSelectedConversationId(null);
              navigate(createPageUrl('Messagerie'), { replace: true });
            }}
          />
        </div>
      </AuthGuard>
    );
  }

  // VUE SPÉCIALISTE - Interface professionnelle
  if (isSpecialist) {
    const conversationsFiltrees = conversations.filter(conv => {
      if (!searchQuery) return true;
      const otherParticipant = conv.participant_emails.find(e => e !== user.email);
      return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.last_message_content?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const conversationsNonLues = conversationsFiltrees.filter(conv => {
      return unreadCounts[conv.id] > 0;
    });

    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    return (
      <AuthGuard>
        <div className="h-full flex flex-col md:flex-row bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-950">
          {/* Sidebar Spécialiste */}
          <div className={`h-full w-full md:w-2/5 lg:w-1/3 bg-white dark:bg-gray-900 md:border-r dark:border-gray-800 overflow-hidden flex flex-col ${selectedConversationId && 'hidden md:flex'}`}>
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-800 bg-gradient-to-r from-teal-500 to-cyan-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Messagerie Professionnelle
                </h2>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
                  <Input
                    placeholder="Rechercher un patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('MesPatients'))}
                  className="bg-white text-teal-600 hover:bg-gray-100"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden lg:inline">Mes Patients</span>
                </Button>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-white">{conversations.length}</p>
                  <p className="text-xs text-white/80">Total</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center relative">
                  <p className="text-2xl font-bold text-white">{conversationsNonLues.length}</p>
                  <p className="text-xs text-white/80">Non lues</p>
                  {totalUnread > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2">
                      {totalUnread}
                    </Badge>
                  )}
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-white">{mesPatients.length}</p>
                  <p className="text-xs text-white/80">Patients</p>
                </div>
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationsFiltrees.length > 0 ? (
                <div>
                  {conversationsFiltrees.map(conv => {
                    const otherEmail = conv.participant_emails.find(e => e !== user.email);
                    const isSelected = conv.id === selectedConversationId;
                    const hasUnread = unreadCounts[conv.id] > 0;
                    
                    return (
                      <div
                        key={conv.id}
                        onClick={() => navigate(createPageUrl(`Messagerie?conversationId=${conv.id}`))}
                        className={`p-4 border-b dark:border-gray-800 cursor-pointer transition-all relative ${
                          isSelected 
                            ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            {hasUnread && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{unreadCounts[conv.id]}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                {otherEmail}
                              </p>
                              {conv.last_message_date && (
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {format(new Date(conv.last_message_date), 'HH:mm', { locale: fr })}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                              {conv.last_message_content || 'Aucun message'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucune conversation'}
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl('MesPatients'))}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Voir mes patients
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Zone de message */}
          <div className="hidden md:flex flex-1 h-full bg-white dark:bg-gray-950">
            {!selectedConversationId ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 w-full bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-gray-900 dark:to-gray-950">
                <Stethoscope className="w-24 h-24 mb-6 text-teal-200" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Messagerie Professionnelle
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Sélectionnez une conversation pour communiquer avec vos patients de manière sécurisée.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('MesPatients'))}
                  className="mt-6 bg-teal-600 hover:bg-teal-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Accéder à mes patients
                </Button>
              </div>
            ) : (
              <MessageView
                conversationId={selectedConversationId}
                currentUserEmail={user?.email}
                isSpecialist={isSpecialist}
              />
            )}
          </div>
        </div>
      </AuthGuard>
    );
  }

  // VUE MAMAN (existante)
  return (
    <AuthGuard>
      <div className="h-full flex flex-col md:flex-row bg-white dark:bg-gray-900">
        <div className={`h-full w-full md:w-2/5 lg:w-1/3 md:border-r dark:border-gray-800 overflow-y-auto ${selectedConversationId && 'hidden md:block'}`}>
          <ConversationList
            currentUserEmail={user?.email}
            selectedConversationId={selectedConversationId}
            onSelectConversation={(id) => navigate(createPageUrl(`Messagerie?conversationId=${id}`))}
            isSpecialist={isSpecialist}
          />
        </div>

        <div className="hidden md:flex flex-1 h-full">
          {!selectedConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 w-full bg-gray-50 dark:bg-gray-900/50">
              <MessageSquare className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-semibold">Sélectionnez une conversation</h2>
              <p>Démarrez une discussion depuis le profil d'un spécialiste.</p>
            </div>
          ) : (
            <MessageView
              conversationId={selectedConversationId}
              currentUserEmail={user?.email}
              isSpecialist={isSpecialist}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
