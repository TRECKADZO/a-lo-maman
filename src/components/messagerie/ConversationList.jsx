import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as UserIcon, MessageSquare, Stethoscope, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import NouveauMessage from './NouveauMessage';

function ConversationListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

function ConversationListItem({ conversation, isSelected, onSelect, currentUserEmail }) {
  const otherParticipantEmail = conversation.participant_emails.find(email => email !== currentUserEmail);

  const { data: otherUser, isLoading } = useQuery({
    queryKey: ['participant_details', otherParticipantEmail],
    queryFn: async () => {
      if (!otherParticipantEmail) return { full_name: 'Utilisateur inconnu', type: 'unknown' };
      const proProfile = await base44.entities.Professionnel.filter({ email: otherParticipantEmail });
      if (proProfile.length > 0) return { ...proProfile[0], type: 'pro' };

      const userProfile = await base44.entities.UserProfile.filter({ created_by: otherParticipantEmail });
      if (userProfile.length > 0) return { ...userProfile[0], type: 'user' };

      return { full_name: otherParticipantEmail, type: 'unknown' };
    },
    enabled: !!otherParticipantEmail,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount', conversation.id, currentUserEmail],
    queryFn: async () => {
        const unreadMessages = await base44.entities.Message.filter({
            conversation_id: conversation.id,
            is_read: false,
            sender_email: { "$ne": currentUserEmail }
        });
        return unreadMessages.length;
    },
    enabled: !!conversation.id && !!currentUserEmail,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <ConversationListItemSkeleton />;
  }

  const name = otherUser?.nom_complet || otherUser?.full_name || "Utilisateur inconnu";
  const photo = otherUser?.photo || otherUser?.photo_profil;
  const lastMessageDate = conversation.last_message_date
    ? formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true, locale: fr })
    : '';

  const hasUnread = unreadCount > 0;

  return (
    <div
      className={`flex items-start gap-4 p-4 cursor-pointer transition-colors relative ${isSelected ? 'bg-pink-50 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
      onClick={() => onSelect(conversation.id)}
    >
      {hasUnread && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pink-500 rounded-full"></span>}
      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          otherUser?.type === 'pro' ? <Stethoscope className="w-6 h-6 text-white" /> : <UserIcon className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{name}</h3>
          <p className={`text-xs flex-shrink-0 ${hasUnread ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{lastMessageDate}</p>
        </div>
        <div className="flex justify-between items-start">
          <p className={`text-sm truncate pr-2 ${hasUnread ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>{conversation.last_message_content}</p>
          {hasUnread && (
            <span className="flex-shrink-0 text-xs bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationList({ currentUserEmail, selectedConversationId, onSelectConversation, isSpecialist }) {
  const navigate = useNavigate();
  const [showNouveauMessage, setShowNouveauMessage] = useState(false);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      return await base44.entities.Conversation.filter(
        { participant_emails: { "$in": [currentUserEmail] } }, 
        '-last_message_date'
      );
    },
    enabled: !!currentUserEmail,
    refetchInterval: 10000,
  });

  const handleNewMessage = () => {
    if (isSpecialist) {
      // Pour les spécialistes, rediriger vers la liste de patients
      navigate(createPageUrl('MesPatients'));
    } else {
      // Pour les mamans, ouvrir le modal de sélection de spécialiste
      setShowNouveauMessage(true);
    }
  };

  if (isLoading) {
     return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b dark:border-gray-800">
                <h2 className="text-2xl font-bold">Messagerie</h2>
            </div>
            <div className="divide-y dark:divide-gray-800">
                {[...Array(5)].map((_, i) => <ConversationListItemSkeleton key={i} />)}
            </div>
        </div>
     );
  }

  if (!conversations || conversations.length === 0) {
    return (
        <div className="p-4 flex flex-col h-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Messagerie</h2>
                <Button size="sm" onClick={handleNewMessage} className="bg-pink-500 hover:bg-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau
                </Button>
            </div>
            <div className="flex-1 p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
                <MessageSquare className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600"/>
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-2">Aucune conversation</h3>
                <p className="mb-4">
                  {isSpecialist 
                    ? "Démarrez une discussion depuis le profil d'un patient."
                    : "Démarrez une conversation avec un spécialiste."
                  }
                </p>
                <Button onClick={handleNewMessage} variant="outline">
                  {isSpecialist ? "Voir mes patients" : "Contacter un spécialiste"}
                </Button>
            </div>

            {/* Modal nouveau message pour mamans */}
            {showNouveauMessage && (
              <NouveauMessage
                onClose={() => setShowNouveauMessage(false)}
                currentUserEmail={currentUserEmail}
              />
            )}
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
         <h2 className="text-2xl font-bold">Messagerie</h2>
         <Button size="sm" onClick={handleNewMessage} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
         </Button>
       </div>
       <ScrollArea className="flex-1">
          <div className="divide-y dark:divide-gray-800">
            {conversations.map(convo => (
              <ConversationListItem
                key={convo.id}
                conversation={convo}
                isSelected={convo.id === selectedConversationId}
                onSelect={onSelectConversation}
                currentUserEmail={currentUserEmail}
              />
            ))}
          </div>
       </ScrollArea>

       {/* Modal nouveau message pour mamans */}
       {showNouveauMessage && (
         <NouveauMessage
           onClose={() => setShowNouveauMessage(false)}
           currentUserEmail={currentUserEmail}
         />
       )}
    </div>
  );
}