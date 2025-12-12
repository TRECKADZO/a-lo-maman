import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle,
  Send,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function AdminLiveChat() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['admin_support_chats', filterStatus],
    queryFn: () => {
      if (filterStatus === 'all') {
        return base44.entities.SupportChat.list('-last_message_at');
      }
      return base44.entities.SupportChat.filter({ status: filterStatus }, '-last_message_at');
    },
    enabled: user?.role === 'admin',
    refetchInterval: 3000,
  });

  const updateChat = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_support_chats']);
    },
  });

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      sender_name: user.full_name || 'Support',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    await updateChat.mutateAsync({
      id: selectedChat.id,
      data: {
        messages: [...(selectedChat.messages || []), newMessage],
        last_message_at: new Date().toISOString(),
        assigned_to: user.email,
      },
    });

    setMessage('');
  };

  const handleStatusChange = async (chatId, newStatus) => {
    await updateChat.mutateAsync({
      id: chatId,
      data: { status: newStatus },
    });
    toast.success('Statut mis à jour');
  };

  const markAsRead = async (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const updatedMessages = chat.messages.map(msg => ({
      ...msg,
      read: msg.sender === 'user' ? true : msg.read,
    }));

    await updateChat.mutateAsync({
      id: chatId,
      data: { messages: updatedMessages },
    });
  };

  useEffect(() => {
    if (selectedChat) {
      markAsRead(selectedChat.id);
    }
  }, [selectedChat?.id]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
            <p className="text-gray-600">Vous devez être administrateur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeChats = chats.filter(c => c.status === 'active');
  const stats = {
    active: activeChats.length,
    unassigned: activeChats.filter(c => !c.assigned_to).length,
    total: chats.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header & Stats */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Support en Direct</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversations actives</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-500" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non assignées</p>
                  <p className="text-2xl font-bold">{stats.unassigned}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="resolved">Résolues</SelectItem>
              <SelectItem value="closed">Fermées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune conversation</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const lastMsg = chat.messages?.[chat.messages.length - 1];
                    const unreadCount = chat.messages?.filter(m => m.sender === 'user' && !m.read)?.length || 0;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedChatId === chat.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <p className="font-medium text-sm">{chat.user_name}</p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{lastMsg?.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={
                            chat.status === 'active' ? 'bg-green-100 text-green-800' :
                            chat.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {chat.status}
                          </Badge>
                          <p className="text-xs text-gray-400">
                            {moment(chat.last_message_at).fromNow()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            {!selectedChat ? (
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez une conversation</p>
              </CardContent>
            ) : (
              <CardContent className="p-0 flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedChat.user_name}</h3>
                    <p className="text-sm text-gray-500">{selectedChat.user_email}</p>
                  </div>
                  <Select
                    value={selectedChat.status}
                    onValueChange={(value) => handleStatusChange(selectedChat.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {selectedChat.messages?.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'admin'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {msg.sender_name}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === 'admin' ? 'text-purple-200' : 'text-gray-400'
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
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Répondre au client..."
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}