import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SupportFloatingButton() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['support_chats_badge', user?.email],
    queryFn: () => base44.entities.SupportChat.filter({ 
      user_email: user.email, 
      status: 'active' 
    }),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadCount = chats[0]?.messages?.filter(m => m.sender === 'admin' && !m.read)?.length || 0;

  return (
    <Button
      onClick={() => navigate(createPageUrl('Support'))}
      className="fixed right-4 md:right-6 shadow-lg z-40 rounded-full w-14 h-14 p-0 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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