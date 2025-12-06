import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

export default function ChatAssistant() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <ChatbotWidget isOpen={true} fullPage={true} />
    </div>
  );
}