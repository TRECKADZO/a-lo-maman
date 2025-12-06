import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageCircle, Plus, Send, FileText, Paperclip,
  Check, CheckCheck, Pin, ArrowLeft, Loader2, Download,
  Baby, Heart, Syringe, Calendar, AlertCircle,
  MoreVertical, Trash2, Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPES_FILS = [
  { value: 'general', label: 'Général', icon: MessageCircle, color: 'pink' },
  { value: 'vaccins', label: 'Vaccins', icon: Syringe, color: 'green' },
  { value: 'grossesse', label: 'Grossesse', icon: Heart, color: 'rose' },
  { value: 'sante', label: 'Santé', icon: AlertCircle, color: 'blue' },
  { value: 'documents', label: 'Documents', icon: FileText, color: 'purple' },
  { value: 'evenements', label: 'Événements', icon: Calendar, color: 'amber' },
];

export default function MessagerieFilsDiscussion({ famille, user, enfants = [] }) {
  const queryClient = useQueryClient();
  const [selectedFil, setSelectedFil] = useState(null);
  const [showCreateFil, setShowCreateFil] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [newFilData, setNewFilData] = useState({ titre: '', type: 'general', enfant_id: '' });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: fils, isLoading } = useQuery({
    queryKey: ['fils_discussion', famille?.id],
    queryFn: async () => {
      const allFils = await base44.entities.FilDiscussionFamille.filter({
        famille_id: famille.id
      });
      return allFils.sort((a, b) => {
        if (a.epingle && !b.epingle) return -1;
        if (!a.epingle && b.epingle) return 1;
        return new Date(b.dernier_message_date || b.created_date) - new Date(a.dernier_message_date || a.created_date);
      });
    },
    enabled: !!famille?.id,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedFil?.messages]);

  // Créer un fil
  const createFilMutation = useMutation({
    mutationFn: async () => {
      const participants = [user.email, ...(famille?.membres?.filter(m => m.statut === 'accepte').map(m => m.email) || [])];
      
      await base44.entities.FilDiscussionFamille.create({
        famille_id: famille.id,
        titre: newFilData.titre,
        type: newFilData.type,
        enfant_id: newFilData.enfant_id || null,
        icone: TYPES_FILS.find(t => t.value === newFilData.type)?.icon?.name || '💬',
        couleur: TYPES_FILS.find(t => t.value === newFilData.type)?.color || 'pink',
        participants,
        messages: [],
        epingle: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fils_discussion'] });
      setShowCreateFil(false);
      setNewFilData({ titre: '', type: 'general', enfant_id: '' });
    }
  });

  // Envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const message = {
        id: Date.now().toString(),
        auteur_email: user.email,
        auteur_nom: user.full_name,
        contenu: messageData.contenu,
        date: new Date().toISOString(),
        type: messageData.type || 'texte',
        document: messageData.document || null,
        lu_par: [{ email: user.email, date_lecture: new Date().toISOString() }],
        important: false,
        reponse_a: replyTo?.id || null
      };

      const messages = [...(selectedFil.messages || []), message];
      
      await base44.entities.FilDiscussionFamille.update(selectedFil.id, {
        messages,
        dernier_message_date: new Date().toISOString()
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fils_discussion'] });
      setNewMessage('');
      setReplyTo(null);
      setShowAttachment(false);
    }
  });

  // Marquer comme lu
  const markAsReadMutation = useMutation({
    mutationFn: async (filId) => {
      const fil = fils?.find(f => f.id === filId);
      if (!fil) return;

      const messages = fil.messages?.map(msg => {
        const dejaLu = msg.lu_par?.some(l => l.email === user.email);
        if (!dejaLu) {
          return {
            ...msg,
            lu_par: [...(msg.lu_par || []), { email: user.email, date_lecture: new Date().toISOString() }]
          };
        }
        return msg;
      });

      await base44.entities.FilDiscussionFamille.update(filId, { messages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fils_discussion'] });
    }
  });

  // Upload document
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload privé pour les documents médicaux
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      
      // Créer une URL signée pour l'affichage
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 3600
      });

      sendMessageMutation.mutate({
        contenu: `📎 ${file.name}`,
        type: 'document',
        document: {
          nom: file.name,
          type_doc: file.type,
          file_uri,
          file_url: signed_url,
          taille: file.size,
          permissions_lecture: selectedFil.participants
        }
      });
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du document');
    }
  };

  // Épingler/désépingler
  const togglePinMutation = useMutation({
    mutationFn: async (filId) => {
      const fil = fils?.find(f => f.id === filId);
      await base44.entities.FilDiscussionFamille.update(filId, { epingle: !fil?.epingle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fils_discussion'] });
    }
  });

  const getUnreadCount = (fil) => {
    return fil.messages?.filter(msg => 
      !msg.lu_par?.some(l => l.email === user?.email)
    ).length || 0;
  };

  const getTypeIcon = (type) => {
    const typeInfo = TYPES_FILS.find(t => t.value === type);
    const Icon = typeInfo?.icon || MessageCircle;
    return <Icon className={`w-5 h-5 text-${typeInfo?.color || 'gray'}-500`} />;
  };

  // Vue liste des fils
  if (!selectedFil) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Discussions</h3>
          <Button
            onClick={() => setShowCreateFil(true)}
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouveau fil
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
            </CardContent>
          </Card>
        ) : fils?.length > 0 ? (
          <div className="space-y-2">
            {fils.map(fil => {
              const unread = getUnreadCount(fil);
              const lastMsg = fil.messages?.[fil.messages.length - 1];
              const enfant = enfants?.find(e => e.id === fil.enfant_id);
              
              return (
                <Card
                  key={fil.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${fil.epingle ? 'border-amber-300 bg-amber-50' : ''}`}
                  onClick={() => {
                    setSelectedFil(fil);
                    markAsReadMutation.mutate(fil.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-${TYPES_FILS.find(t => t.value === fil.type)?.color || 'gray'}-100 rounded-xl flex items-center justify-center`}>
                        {getTypeIcon(fil.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {fil.epingle && <Pin className="w-3 h-3 text-amber-500" />}
                          <h4 className="font-semibold truncate">{fil.titre}</h4>
                          {unread > 0 && (
                            <Badge className="bg-pink-500">{unread}</Badge>
                          )}
                        </div>
                        {enfant && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <Baby className="w-3 h-3 mr-1" />
                            {enfant.prenom}
                          </Badge>
                        )}
                        {lastMsg && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {lastMsg.auteur_nom}: {lastMsg.contenu}
                          </p>
                        )}
                      </div>
                      {lastMsg && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(lastMsg.date), 'HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun fil de discussion</p>
              <Button onClick={() => setShowCreateFil(true)} variant="outline">
                Créer le premier fil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal créer fil */}
        <BottomSheet
          isOpen={showCreateFil}
          onClose={() => setShowCreateFil(false)}
          title="Nouveau fil de discussion"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Titre du fil</label>
              <Input
                value={newFilData.titre}
                onChange={(e) => setNewFilData({ ...newFilData, titre: e.target.value })}
                placeholder="Ex: Vaccins de Lucas, Suivi 3ème trimestre..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={newFilData.type}
                onValueChange={(v) => setNewFilData({ ...newFilData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_FILS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className={`w-4 h-4 text-${t.color}-500`} />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {enfants?.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Enfant concerné (optionnel)</label>
                <Select
                  value={newFilData.enfant_id}
                  onValueChange={(v) => setNewFilData({ ...newFilData, enfant_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enfant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Aucun</SelectItem>
                    {enfants.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4" />
                          {e.prenom}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={() => createFilMutation.mutate()}
              disabled={!newFilData.titre || createFilMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
            >
              {createFilMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Créer le fil'
              )}
            </Button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  // Vue conversation
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setSelectedFil(null)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h4 className="font-semibold">{selectedFil.titre}</h4>
          <p className="text-xs text-gray-500">
            {selectedFil.participants?.length || 0} participants
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => togglePinMutation.mutate(selectedFil.id)}>
              <Pin className="w-4 h-4 mr-2" />
              {selectedFil.epingle ? 'Désépingler' : 'Épingler'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {selectedFil.messages?.map((msg, i) => {
          const isMe = msg.auteur_email === user?.email;
          const repliedMsg = msg.reponse_a ? selectedFil.messages?.find(m => m.id === msg.reponse_a) : null;
          const allRead = selectedFil.participants?.every(p => 
            msg.lu_par?.some(l => l.email === p)
          );

          return (
            <div
              key={i}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${isMe ? 'order-2' : 'order-1'}`}>
                {repliedMsg && (
                  <div className="text-xs bg-gray-200 rounded-t-lg px-3 py-1 border-l-2 border-pink-400">
                    <span className="font-medium">{repliedMsg.auteur_nom}:</span> {repliedMsg.contenu?.slice(0, 50)}...
                  </div>
                )}
                <div className={`p-3 rounded-2xl ${repliedMsg ? 'rounded-t-none' : ''} ${
                  isMe ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white shadow-sm'
                }`}>
                  {!isMe && (
                    <p className="text-xs font-medium mb-1 text-gray-600">{msg.auteur_nom}</p>
                  )}
                  
                  {msg.type === 'document' && msg.document && (
                    <div className={`p-2 rounded-lg mb-2 flex items-center gap-2 ${isMe ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <FileText className="w-5 h-5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{msg.document.nom}</p>
                        <p className="text-xs opacity-70">{Math.round(msg.document.taille / 1024)} Ko</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
                            file_uri: msg.document.file_uri,
                            expires_in: 300
                          });
                          window.open(signed_url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-sm">{msg.contenu}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {format(new Date(msg.date), 'HH:mm', { locale: fr })}
                    </span>
                    {isMe && (
                      allRead ? (
                        <CheckCheck className="w-4 h-4 text-blue-300" />
                      ) : (
                        <Check className="w-4 h-4 text-white/70" />
                      )
                    )}
                  </div>
                </div>
                
                {!isMe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 text-xs text-gray-400"
                    onClick={() => setReplyTo(msg)}
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Répondre
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Réponse */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-100 border-t flex items-center gap-2">
          <Reply className="w-4 h-4 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{replyTo.auteur_nom}</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.contenu}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessageMutation.isPending}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newMessage.trim()) {
                sendMessageMutation.mutate({ contenu: newMessage, type: 'texte' });
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessageMutation.mutate({ contenu: newMessage, type: 'texte' })}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}