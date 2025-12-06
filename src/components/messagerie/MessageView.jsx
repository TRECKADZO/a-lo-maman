import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Send,
  Loader2,
  Paperclip,
  ArrowLeft,
  User,
  Stethoscope,
  FileText,
  Video,
  Calendar,
  Pill,
  Image as ImageIcon,
  File,
  Mic,
  Camera
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import MessageBulle from './MessageBulle';
import VideoCallInterface from './VideoCallInterface';
import PlanifierRDVSuivi from './PlanifierRDVSuivi';
import EnvoyerOrdonnance from './EnvoyerOrdonnance';
import VoiceRecorder from '../general/VoiceRecorder';
import SecureMessageIndicator from './SecureMessageIndicator';
import VideoQualityTest from '../teleconsultation/VideoQualityTest';
import EnhancedVideoCall from '../teleconsultation/EnhancedVideoCall';

const specialiteLabels = {
    gynecologie: "Gynécologue",
    pediatrie: "Pédiatre",
    sage_femme: "Sage-femme",
    medecin_generaliste: "Médecin généraliste",
    infirmier: "Infirmier(ère)",
    nutritionniste: "Nutritionniste",
};

const typesFichiers = {
  'resultat_labo': { label: 'Résultat labo', icon: FileText, color: 'text-blue-600' },
  'rapport_medical': { label: 'Rapport médical', icon: FileText, color: 'text-purple-600' },
  'ordonnance': { label: 'Ordonnance', icon: Pill, color: 'text-green-600' },
  'radio': { label: 'Radio', icon: ImageIcon, color: 'text-orange-600' },
  'echographie': { label: 'Échographie', icon: ImageIcon, color: 'text-pink-600' },
  'photo': { label: 'Photo', icon: ImageIcon, color: 'text-cyan-600' },
  'document': { label: 'Document', icon: File, color: 'text-gray-600' },
  'autre': { label: 'Autre', icon: File, color: 'text-gray-600' },
};

function ParticipantHeader({ otherParticipantEmail, isSpecialist, onStartVideoCall, onStartEnhancedVideo, onPlanifierRDV, onEnvoyerOrdonnance }) {
  const { data: participantProfile, isLoading } = useQuery({
    queryKey: ['participantProfile', otherParticipantEmail],
    queryFn: async () => {
      if (!otherParticipantEmail) return null;
      const proPromise = base44.entities.Professionnel.filter({ email: otherParticipantEmail });
      const userPromise = base44.entities.UserProfile.filter({ created_by: otherParticipantEmail });

      const [proResult, userResult] = await Promise.all([proPromise, userPromise]);

      if (proResult.length > 0) return { ...proResult[0], type: 'pro' };
      if (userResult.length > 0) return { ...userResult[0], type: 'user' };

      return { full_name: otherParticipantEmail, type: 'unknown' };
    },
    enabled: !!otherParticipantEmail,
  });

  const { data: patientRecord } = useQuery({
      queryKey: ['patientRecordForChat', otherParticipantEmail],
      queryFn: async () => {
        if (!otherParticipantEmail || !isSpecialist) return null;
        const enfants = await base44.entities.EnfantCarnet.filter({ created_by: otherParticipantEmail });
        return enfants[0] || null;
      },
      enabled: !!otherParticipantEmail && isSpecialist
  });

  if (isLoading) {
    return <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>;
  }

  const name = participantProfile?.nom_complet || participantProfile?.full_name || "Utilisateur";
  const photo = participantProfile?.photo || participantProfile?.photo_profil;

  return (
    <div className="flex-1 flex items-center gap-3 min-w-0">
       <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> :
         (participantProfile?.type === 'pro' ? <Stethoscope className="w-5 h-5 text-white"/> : <User className="w-5 h-5 text-white"/>)}
       </div>
       <div className="min-w-0 flex-1">
          <h2 className="font-semibold truncate">{name}</h2>
          <p className="text-xs text-green-500">
            {participantProfile?.specialite ? specialiteLabels[participantProfile.specialite] || 'Spécialiste' : 'En ligne'}
          </p>
       </div>

       <div className="flex items-center gap-2 flex-shrink-0">
         <Button
           onClick={onStartEnhancedVideo}
           size="sm"
           variant="outline"
           className="bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/50"
         >
           <Video className="w-4 h-4 md:mr-2" />
           <span className="hidden md:inline">Appel vidéo</span>
         </Button>

         {isSpecialist && (
           <>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button size="sm" variant="outline" className="bg-purple-50 border-purple-200 hover:bg-purple-100">
                   <Calendar className="w-4 h-4 md:mr-2" />
                   <span className="hidden md:inline">Actions</span>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56">
                 <DropdownMenuItem onClick={onPlanifierRDV}>
                   <Calendar className="w-4 h-4 mr-2" />
                   Planifier rendez-vous
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onEnvoyerOrdonnance}>
                   <Pill className="w-4 h-4 mr-2" />
                   Envoyer ordonnance
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 {patientRecord && (
                   <DropdownMenuItem asChild>
                     <Link to={createPageUrl(`DossierPatient?enfantId=${patientRecord.id}`)}>
                       <FileText className="w-4 h-4 mr-2" />
                       Voir dossier patient
                     </Link>
                   </DropdownMenuItem>
                 )}
               </DropdownMenuContent>
             </DropdownMenu>
           </>
         )}

         {isSpecialist && patientRecord && (
           <Button asChild variant="ghost" size="sm" className="md:hidden">
              <Link to={createPageUrl(`DossierPatient?enfantId=${patientRecord.id}`)}>
                  <FileText className="w-4 h-4"/>
              </Link>
           </Button>
         )}
       </div>
    </div>
  );
}

export default function MessageView({ conversationId, currentUserEmail, onBack, isSpecialist }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVideoTest, setShowVideoTest] = useState(false);
  const [showEnhancedVideo, setShowEnhancedVideo] = useState(false);
  const [showPlanifierRDV, setShowPlanifierRDV] = useState(false);
  const [showEnvoyerOrdonnance, setShowEnvoyerOrdonnance] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
    enabled: !!conversationId,
    refetchInterval: 2000, // Polling plus rapide pour messagerie instantanée
  });

  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => base44.entities.Conversation.get(conversationId),
    enabled: !!conversationId,
  });

  const otherParticipantEmail = conversation?.participant_emails.find(email => email !== currentUserEmail);

  const markAsReadMutation = useMutation({
    mutationFn: (messageIds) => {
      const updates = messageIds.map(id => base44.entities.Message.update(id, { is_read: true }));
      return Promise.all(updates);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['unreadCount', conversationId, currentUserEmail] });
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUserEmail] });
    }
  });

  // Gestion des indicateurs de frappe
  const updateTypingStatus = useMutation({
    mutationFn: async (typing) => {
      if (!otherParticipantEmail) return;
      // Créer une notification temporaire pour indiquer la frappe
      if (typing) {
        await base44.entities.Notification.create({
          destinataire_email: otherParticipantEmail,
          type: 'systeme',
          titre: 'Frappe en cours',
          message: `${currentUserEmail} est en train d'écrire...`,
          metadata: {
            conversationId: conversationId,
            typing: true,
            sender: currentUserEmail
          }
        });
      }
    },
    onError: (error) => {
      console.error("Failed to send typing status", error);
    }
  });

  // Détecter la frappe de l'utilisateur
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) { // Only start typing if not already and content exists
      setIsTyping(true);
      updateTypingStatus.mutate(true);
    }

    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // No need to explicitly send "stopped typing" notification,
      // the recipient will stop showing it based on notification age.
    }, 2000); // Stop typing after 2 seconds of inactivity
  };

  // Vérifier si l'autre utilisateur est en train d'écrire
  useEffect(() => {
    if (!otherParticipantEmail || !conversationId) return;

    const checkTyping = async () => {
      try {
        const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();
        const recentNotifications = await base44.entities.Notification.filter({
          destinataire_email: currentUserEmail,
          type: 'systeme',
          'metadata.conversationId': conversationId,
          'metadata.typing': true,
          created_date: { $gte: threeSecondsAgo }
        });
        
        setOtherUserTyping(recentNotifications.some(notif => notif.metadata.sender === otherParticipantEmail));
      } catch (error) {
        console.error('Erreur lors de la vérification de frappe:', error);
      }
    };

    // Poll every second to check for typing notifications
    const interval = setInterval(checkTyping, 1000);
    return () => clearInterval(interval); // Cleanup on unmount or dependency change
  }, [conversationId, currentUserEmail, otherParticipantEmail]);

  useEffect(() => {
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.is_read && m.sender_email !== currentUserEmail)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate(unreadIds);
      }
    }
  }, [messages, currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, optimisticMessages, otherUserTyping]); // Also scroll when typing indicator appears/disappears


  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachmentData, optimisticId }) => {
      // Arrêter l'indicateur de frappe
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const messageData = {
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        content: content || null,
        is_read: false,
      };

      if (attachmentData) {
        messageData.attachment_uri = attachmentData.uri;
        messageData.attachment_name = attachmentData.name;
        messageData.attachment_type = attachmentData.type;
        messageData.file_category = attachmentData.file_category;
      }

      const sentMessage = await base44.entities.Message.create(messageData);
      
      // Mettre à jour la conversation
      await base44.entities.Conversation.update(conversationId, {
        last_message_content: content || `📎 ${attachmentData?.name || 'Fichier'}`,
        last_message_date: new Date().toISOString()
      });

      // Envoyer une notification au destinataire
      await base44.entities.Notification.create({
        destinataire_email: otherParticipantEmail,
        type: 'message_nouveau',
        titre: 'Nouveau message',
        message: content ? content.substring(0, 100) : 'Vous avez reçu une pièce jointe',
        action_page: 'Messagerie',
        action_params: { conversationId },
        priorite: 'normale',
        icone: 'MessageSquare',
      });

      return { sentMessage, optimisticId };
    },
    onSuccess: ({ sentMessage, optimisticId }) => {
      setOptimisticMessages(prev => prev.filter(m => m.optimisticId !== optimisticId));
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    },
    onError: (error, variables) => {
       console.error("Failed to send message", error);
       setOptimisticMessages(prev => prev.map(m =>
        m.optimisticId === variables.optimisticId ? { ...m, error: true } : m
      ));
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const optimisticId = Date.now();
    const messageData = {
      conversation_id: conversationId,
      sender_email: currentUserEmail,
      content: newMessage.trim(),
      is_read: false,
      optimisticId,
    };

    setOptimisticMessages(prev => [...prev, messageData]);
    setNewMessage('');
    sendMessageMutation.mutate({ content: newMessage.trim(), optimisticId });
  };

  const handleFileSelect = (type) => {
    setSelectedFileType(type);
    if (type === 'photo') {
      photoInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setShowAttachmentMenu(false);
  };

  const handleFileChange = async (e, isPhoto = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      const optimisticId = Date.now();
      const fileCategory = isPhoto ? 'photo' : selectedFileType;
      
      const messageData = {
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        content: null,
        is_read: false,
        attachment_uri: file_uri,
        attachment_name: file.name,
        attachment_type: file.type,
        file_category: fileCategory,
        optimisticId,
      };

      setOptimisticMessages(prev => [...prev, messageData]);

      const attachmentData = {
        uri: file_uri,
        name: file.name,
        type: file.type,
        file_category: fileCategory,
      };

      sendMessageMutation.mutate({
        attachmentData,
        optimisticId,
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
      setSelectedFileType(null);
      e.target.value = null;
    }
  };

  const handleVoiceSend = async (audioFile) => {
    setIsUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: audioFile });

      const optimisticId = Date.now();
      const messageData = {
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        content: null,
        is_read: false,
        attachment_uri: file_uri,
        attachment_name: audioFile.name,
        attachment_type: audioFile.type,
        file_category: 'vocal',
        optimisticId,
      };

      setOptimisticMessages(prev => [...prev, messageData]);

      const attachmentData = {
        uri: file_uri,
        name: audioFile.name,
        type: audioFile.type,
        file_category: 'vocal',
      };

      sendMessageMutation.mutate({
        attachmentData,
        optimisticId,
      });

      setShowVoiceRecorder(false);
    } catch (error) {
      console.error("Error uploading voice message:", error);
      alert("Erreur lors de l'envoi du message vocal.");
    } finally {
      setIsUploading(false);
    }
  };

  const allMessages = [...messages, ...optimisticMessages];

  if (showVideoTest) {
    return (
      <VideoQualityTest
        onTestComplete={(results) => {
          setShowVideoTest(false);
          setShowEnhancedVideo(true);
        }}
        onClose={() => setShowVideoTest(false)}
      />
    );
  }

  if (showEnhancedVideo) {
    return (
      <EnhancedVideoCall
        conversationId={conversationId}
        participantEmail={otherParticipantEmail}
        currentUserEmail={currentUserEmail}
        isSpecialist={isSpecialist}
        onClose={() => setShowEnhancedVideo(false)}
      />
    );
  }

  if (showVideoCall) {
    return (
      <VideoCallInterface
        conversationId={conversationId}
        participantEmail={otherParticipantEmail}
        currentUserEmail={currentUserEmail}
        onClose={() => setShowVideoCall(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <header className="p-4 border-b dark:border-gray-800 flex items-center gap-3 shrink-0 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-gray-900 dark:to-gray-950">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5"/>
          </Button>
        )}
        {isLoadingConversation ? (
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <ParticipantHeader
            otherParticipantEmail={otherParticipantEmail}
            isSpecialist={isSpecialist}
            onStartVideoCall={() => setShowVideoCall(true)}
            onStartEnhancedVideo={() => setShowVideoTest(true)}
            onPlanifierRDV={() => setShowPlanifierRDV(true)}
            onEnvoyerOrdonnance={() => setShowEnvoyerOrdonnance(true)}
          />
        )}
      </header>

      <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="p-4 space-y-4">
            <SecureMessageIndicator />
            
            {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
              <>
                {allMessages.map(msg => (
                    <MessageBulle
                      key={msg.id || msg.optimisticId}
                      message={msg}
                      isCurrentUser={msg.sender_email === currentUserEmail}
                      isSpecialist={isSpecialist}
                    />
                ))}
                
                {/* Indicateur de frappe */}
                {otherUserTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">En train d'écrire...</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <div className="p-4">
          {showVoiceRecorder ? (
            <div className="mb-3">
              <VoiceRecorder
                onSend={handleVoiceSend}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </div>
          ) : (
            <>
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={(e) => handleFileChange(e, true)}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                />

                {/* Menu pièces jointes */}
                <DropdownMenu open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isUploading || sendMessageMutation.isPending}
                      className="shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => handleFileSelect('photo')}>
                      <Camera className="w-4 h-4 mr-2 text-cyan-600" />
                      Photo / Caméra
                    </DropdownMenuItem>
                    
                    {isSpecialist ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleFileSelect('ordonnance')}>
                          <Pill className="w-4 h-4 mr-2 text-green-600" />
                          Ordonnance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileSelect('resultat_labo')}>
                          <FileText className="w-4 h-4 mr-2 text-blue-600" />
                          Résultat labo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileSelect('rapport_medical')}>
                          <FileText className="w-4 h-4 mr-2 text-purple-600" />
                          Rapport médical
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleFileSelect('resultat_labo')}>
                          <FileText className="w-4 h-4 mr-2 text-blue-600" />
                          Résultat labo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileSelect('radio')}>
                          <ImageIcon className="w-4 h-4 mr-2 text-orange-600" />
                          Radiographie
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileSelect('echographie')}>
                          <ImageIcon className="w-4 h-4 mr-2 text-pink-600" />
                          Échographie
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleFileSelect('document')}>
                      <File className="w-4 h-4 mr-2 text-gray-600" />
                      Autre document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bouton vocal */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowVoiceRecorder(true)}
                  disabled={isUploading || sendMessageMutation.isPending}
                  className="shrink-0 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30"
                >
                  <Mic className="w-5 h-5 text-purple-600" />
                </Button>

                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Écrivez votre message..."
                  className="flex-1"
                  disabled={isUploading || sendMessageMutation.isPending}
                  autoComplete="off"
                />
                <Button type="submit" disabled={!newMessage.trim() || isUploading || sendMessageMutation.isPending}>
                  {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </>
          )}

          {isUploading && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Envoi du fichier en cours...</span>
            </div>
          )}
        </div>
      </div>

      {showPlanifierRDV && (
        <PlanifierRDVSuivi
          patientEmail={otherParticipantEmail}
          conversationId={conversationId}
          onClose={() => setShowPlanifierRDV(false)}
        />
      )}

      {showEnvoyerOrdonnance && (
        <EnvoyerOrdonnance
          patientEmail={otherParticipantEmail}
          conversationId={conversationId}
          onClose={() => setShowEnvoyerOrdonnance(false)}
        />
      )}
    </div>
  );
}