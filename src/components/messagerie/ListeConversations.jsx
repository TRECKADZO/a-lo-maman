import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Loader2 } from 'lucide-react';

export default function ListeConversations({ user, onSelectConversation, selectedId }) {
  const [search, setSearch] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const result = await base44.entities.Conversation.filter({
        participants: { $elemMatch: { email: user.email } }
      });
      return result.sort((a, b) => 
        new Date(b.dernier_message_date) - new Date(a.dernier_message_date)
      );
    },
    enabled: !!user
  });

  const filtered = conversations?.filter(conv =>
    conv.titre?.toLowerCase().includes(search.toLowerCase()) ||
    conv.participants?.some(p => p.nom?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Messages</h2>
          <Button size="sm" className="bg-teal-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm p-4">Aucune conversation</p>
        ) : (
          <div className="space-y-2 p-2">
            {filtered.map((conv) => {
              const nonLu = conv.non_lus?.[user.email] || 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedId === conv.id
                      ? 'bg-teal-100 border-l-4 border-teal-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm truncate flex-1">{conv.titre}</p>
                    {nonLu > 0 && (
                      <Badge className="bg-red-500 ml-2 flex-shrink-0">{nonLu}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate mb-1">
                    {conv.dernier_message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(conv.dernier_message_date).toLocaleString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}