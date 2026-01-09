import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Send, Loader2, FileText, Download, MoreVertical, Smile } from 'lucide-react';
import { toast } from 'sonner';

export default function ConversationView({ conversation, user }) {
  const [messageInput, setMessageInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Récupérer les messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: async () => {
      // Note: Dans une vraie app, créer une fonction backend pour filtrer par conversation
      return [];
    },
    enabled: !!conversation?.id
  });

  // Envoyer un message
  const envoyerMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('gererMessagerie', {
        action: 'envoyer_message',
        conversation_id: conversation.id,
        contenu: messageInput,
        documents
      });
    },
    onSuccess: () => {
      setMessageInput('');
      setDocuments([]);
      toast.success('Message envoyé');
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi');
    }
  });

  // Marquer comme lu
  useEffect(() => {
    if (conversation.id && user) {
      base44.asServiceRole.functions.invoke('gererMessagerie', {
        action: 'marquer_lu',
        conversation_id: conversation.id
      }).catch(console.error);
    }
  }, [conversation.id]);

  // Auto-scroll vers les derniers messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setDocuments([...documents, {
          nom: file.name,
          url: file_url,
          type: file.type,
          taille: file.size
        }]);
        toast.success(`${file.name} ajouté`);
      } catch (error) {
        toast.error(`Erreur: ${file.name}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-teal-50 to-cyan-50">
        <div>
          <h3 className="font-semibold">{conversation.titre}</h3>
          <p className="text-xs text-gray-500">
            {conversation.participants.length} participant{conversation.participants.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.auteur_email === user.email ? 'justify-end' : 'justify-start'}`}>
              {msg.auteur_email !== user.email && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback>{msg.auteur_nom?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-xs ${msg.auteur_email === user.email ? 'bg-teal-100 text-gray-900' : 'bg-gray-100 text-gray-900'} p-3 rounded-lg`}>
                {msg.auteur_email !== user.email && (
                  <p className="text-xs font-semibold text-teal-600 mb-1">{msg.auteur_nom}</p>
                )}
                <p className="text-sm break-words">{msg.contenu}</p>
                {msg.documents && msg.documents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.documents.map((doc, idx) => (
                      <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-teal-600 hover:underline">
                        <FileText className="w-3 h-3" />
                        {doc.nom}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-sm">Aucun message pour le moment</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Documents à envoyer */}
      {documents.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-t">
          <p className="text-xs font-semibold text-blue-900 mb-2">Documents joints ({documents.length})</p>
          <div className="space-y-1">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {doc.nom}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                  className="h-auto p-0"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Votre message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && messageInput.trim()) {
                e.preventDefault();
                envoyerMutation.mutate();
              }
            }}
            className="flex-1 resize-none"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded">
              <Upload className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
              />
            </label>
            <Button
              onClick={() => envoyerMutation.mutate()}
              disabled={!messageInput.trim() || envoyerMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {envoyerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}