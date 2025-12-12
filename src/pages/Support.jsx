import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Send,
  Paperclip,
  Star,
  Bug,
  Lightbulb,
  Heart,
  MessageSquare,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  HelpCircle,
  Mic,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedbackType, setFeedbackType] = useState('improvement');
  const [rating, setRating] = useState(0);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Chat queries
  const { data: chats = [] } = useQuery({
    queryKey: ['support_chats', user?.email],
    queryFn: () => base44.entities.SupportChat.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user,
    refetchInterval: 3000,
  });

  const activeChat = chats[0];

  // Feedback queries
  const { data: myFeedbacks = [] } = useQuery({
    queryKey: ['my_feedbacks', user?.email],
    queryFn: () => base44.entities.UserFeedback.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const createChat = useMutation({
    mutationFn: async (data) => {
      const chat = await base44.entities.SupportChat.create(data);
      
      // Notifier tous les admins qu'un nouveau chat a été créé
      if (user) {
        const admins = await base44.entities.User.filter({ role: 'admin' }).catch(() => []);
        
        for (const admin of admins) {
          await base44.entities.Notification.create({
            destinataire_email: admin.email,
            type: 'message_nouveau',
            titre: '🆕 Nouveau chat support',
            message: `${user.full_name || user.email} a démarré une conversation`,
            action_page: 'AdminLiveChat',
            action_params: { chatId: chat.id },
            priorite: 'haute',
            icone: 'MessageCircle'
          }).catch(() => {});
        }
      }
      
      return chat;
    },
    onSuccess: () => queryClient.invalidateQueries(['support_chats']),
  });

  const updateChat = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.SupportChat.update(id, data);
      
      // Notifier les admins quand l'utilisateur envoie un message
      if (data.messages && user) {
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage.sender === 'user') {
          // Récupérer tous les admins
          const admins = await base44.entities.User.filter({ role: 'admin' }).catch(() => []);
          
          // Créer une notification pour chaque admin
          for (const admin of admins) {
            await base44.entities.Notification.create({
              destinataire_email: admin.email,
              type: 'message_nouveau',
              titre: '💬 Nouveau message support',
              message: `${user.full_name || user.email} a envoyé un message`,
              action_page: 'AdminLiveChat',
              action_params: { chatId: id },
              priorite: 'haute',
              icone: 'MessageCircle'
            }).catch(() => {});
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['support_chats']),
  });

  const submitFeedback = useMutation({
    mutationFn: (data) => base44.entities.UserFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my_feedbacks']);
      setFeedbackType('improvement');
      setRating(0);
      setFeedbackTitle('');
      setFeedbackDescription('');
      toast.success('Feedback envoyé !');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [activeChat?.messages, activeTab]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        // Envoyer automatiquement l'audio
        await sendAudioMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Erreur lors de l\'accès au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (blob) => {
    if (!user) return;

    setUploading(true);
    try {
      const audioFile = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      const newMessage = {
        id: Date.now().toString(),
        sender: 'user',
        sender_name: user.full_name || user.email,
        message: '🎤 Message vocal',
        attachment: {
          url: file_url,
          type: 'audio',
          name: audioFile.name,
          size: audioFile.size,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      if (activeChat) {
        await updateChat.mutateAsync({
          id: activeChat.id,
          data: {
            messages: [...(activeChat.messages || []), newMessage],
            last_message_at: new Date().toISOString(),
          },
        });
      } else {
        await createChat.mutateAsync({
          user_email: user.email,
          user_name: user.full_name || user.email,
          messages: [newMessage],
          status: 'waiting',
          last_message_at: new Date().toISOString(),
        });
      }
      
      toast.success('Message vocal envoyé');
      setAudioBlob(null);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newMessage = {
        id: Date.now().toString(),
        sender: 'user',
        sender_name: user.full_name || user.email,
        message: file.name,
        attachment: {
          url: file_url,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          name: file.name,
          size: file.size,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      if (activeChat) {
        await updateChat.mutateAsync({
          id: activeChat.id,
          data: {
            messages: [...(activeChat.messages || []), newMessage],
            last_message_at: new Date().toISOString(),
          },
        });
      } else {
        await createChat.mutateAsync({
          user_email: user.email,
          user_name: user.full_name || user.email,
          messages: [newMessage],
          status: 'waiting',
          last_message_at: new Date().toISOString(),
        });
      }
      
      toast.success('Fichier envoyé');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      sender_name: user.full_name || user.email,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    if (activeChat) {
      await updateChat.mutateAsync({
        id: activeChat.id,
        data: {
          messages: [...(activeChat.messages || []), newMessage],
          last_message_at: new Date().toISOString(),
        },
      });
    } else {
      await createChat.mutateAsync({
        user_email: user.email,
        user_name: user.full_name || user.email,
        messages: [newMessage],
        status: 'waiting',
        last_message_at: new Date().toISOString(),
      });
    }

    setMessage('');
  };

  const handleSubmitFeedback = () => {
    if (!user || !feedbackTitle || !feedbackDescription) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    submitFeedback.mutate({
      user_email: user.email,
      feedback_type: feedbackType,
      page: window.location.pathname,
      rating: rating || undefined,
      title: feedbackTitle,
      description: feedbackDescription,
      device_info: {
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        platform: navigator.platform
      }
    });
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-800' },
    { value: 'improvement', label: 'Amélioration', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'feature_request', label: 'Nouvelle fonctionnalité', icon: Star, color: 'bg-blue-100 text-blue-800' },
    { value: 'compliment', label: 'Compliment', icon: Heart, color: 'bg-pink-100 text-pink-800' }
  ];

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    planned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    wont_fix: 'bg-gray-100 text-gray-800',
  };

  const faqItems = [
    {
      question: 'Comment contacter le support ?',
      answer: 'Utilisez l\'onglet "Chat en direct" pour une réponse rapide, ou envoyez un feedback détaillé.'
    },
    {
      question: 'Combien de temps pour une réponse ?',
      answer: 'Le chat en direct est généralement répondu en quelques minutes. Les feedbacks sont traités sous 24-48h.'
    },
    {
      question: 'Puis-je envoyer des fichiers ?',
      answer: 'Oui ! Vous pouvez joindre des images et documents (max 10MB) dans le chat.'
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connectez-vous</h2>
            <p className="text-gray-600">Vous devez être connecté pour accéder au support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Feedback</h1>
          <p className="text-gray-600">Chattez avec notre équipe ou partagez vos suggestions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <Star className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat en direct
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {!activeChat && (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Envoyez un message pour démarrer</p>
                      </div>
                    )}

                    {activeChat?.messages?.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-800 shadow-sm'
                          }`}
                        >
                          {msg.sender === 'admin' && (
                            <p className="text-xs font-semibold mb-1 text-purple-600">
                              {msg.sender_name || 'Support'}
                            </p>
                          )}
                          
                          {msg.attachment ? (
                            <div className="space-y-2">
                              {msg.attachment.type === 'image' ? (
                                <img 
                                  src={msg.attachment.url} 
                                  alt={msg.attachment.name}
                                  className="rounded-lg max-w-full cursor-pointer"
                                  onClick={() => window.open(msg.attachment.url, '_blank')}
                                />
                              ) : msg.attachment.type === 'audio' ? (
                                <div className={`p-2 rounded ${msg.sender === 'user' ? 'bg-purple-700' : 'bg-gray-100'}`}>
                                  <audio 
                                    controls 
                                    src={msg.attachment.url}
                                    className="w-full max-w-xs"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={msg.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded ${
                                    msg.sender === 'user' ? 'bg-purple-700' : 'bg-gray-100'
                                  }`}
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm truncate">{msg.attachment.name}</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender === 'user' ? 'text-purple-200' : 'text-gray-400'
                            }`}
                          >
                            {moment(msg.timestamp).format('HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || isRecording}
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={uploading}
                        className={isRecording ? 'bg-red-100 hover:bg-red-200' : ''}
                      >
                        <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600 animate-pulse' : ''}`} />
                      </Button>
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={isRecording ? "Enregistrement en cours..." : "Écrivez votre message..."}
                        className="flex-1"
                        disabled={uploading || isRecording}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || uploading || isRecording}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {isRecording && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                        Appuyez à nouveau sur le micro pour arrêter l'enregistrement
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Envoyer un feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type de feedback <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map(type => {
                      const Icon = type.icon;
                      const isSelected = feedbackType === type.value;
                      
                      return (
                        <button
                          key={type.value}
                          onClick={() => setFeedbackType(type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected ? `border-${type.value === 'bug' ? 'red' : type.value === 'improvement' ? 'yellow' : type.value === 'feature_request' ? 'blue' : 'pink'}-500 ${type.color}` : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-xs font-medium">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Note globale (optionnel)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Résumé en quelques mots"
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Décrivez votre suggestion ou problème en détail..."
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackTitle || !feedbackDescription || submitFeedback.isPending}
                  className="w-full"
                >
                  {submitFeedback.isPending ? 'Envoi...' : 'Envoyer le feedback'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              {myFeedbacks.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun feedback envoyé</p>
                  </CardContent>
                </Card>
              ) : (
                myFeedbacks.map(feedback => {
                  const typeInfo = feedbackTypes.find(t => t.value === feedback.feedback_type);
                  const Icon = typeInfo?.icon || MessageSquare;

                  return (
                    <Card key={feedback.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${typeInfo?.color || 'bg-gray-100'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{feedback.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{feedback.description}</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              <Badge className={statusColors[feedback.status]}>
                                {feedback.status}
                              </Badge>
                              <Badge variant="outline">
                                {typeInfo?.label || feedback.feedback_type}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {moment(feedback.created_date).format('DD/MM/YYYY HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}