import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Minimize2, Paperclip, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['support_chats', user?.email],
    queryFn: () => base44.entities.SupportChat.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user && isOpen,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const activeChat = chats[0];

  const createChat = useMutation({
    mutationFn: (data) => base44.entities.SupportChat.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['support_chats']);
    },
  });

  const updateChat = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['support_chats']);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [activeChat?.messages, isOpen, isMinimized]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
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
      toast.error('Erreur lors de l\'envoi du fichier');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = activeChat?.messages?.filter(m => m.sender === 'admin' && !m.read)?.length || 0;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 md:right-6 shadow-lg z-40 rounded-full w-14 h-14 p-0"
        style={{
          bottom: 'calc(5rem + env(safe-area-inset-bottom))'
        }}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 p-0 flex items-center justify-center text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card
      className="fixed right-4 md:right-6 shadow-2xl z-50 flex flex-col"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom))',
        width: '380px',
        maxWidth: 'calc(100vw - 2rem)',
        height: isMinimized ? 'auto' : '500px',
        maxHeight: isMinimized ? 'auto' : 'calc(100vh - 10rem)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Support en direct</h3>
            <p className="text-xs opacity-90">Réponse rapide garantie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {!activeChat && (
              <div className="text-center text-gray-500 text-sm py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Démarrez une conversation avec notre équipe</p>
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
                disabled={!user || uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                className="flex-1"
                disabled={!user || uploading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !user || uploading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-2">
                Connectez-vous pour démarrer une conversation
              </p>
            )}
          </div>
        </>
      )}

      {isMinimized && unreadCount > 0 && (
        <div className="p-3 bg-white border-t">
          <p className="text-sm text-purple-600 font-medium">
            {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
}