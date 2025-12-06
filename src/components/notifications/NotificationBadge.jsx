import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

/**
 * Badge de notification réutilisable
 * Affiche le nombre de notifications non lues
 */
export default function NotificationBadge({ 
  className = '', 
  showIcon = true,
  variant = 'default',
  size = 'default' 
}) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { destinataire_email: user.email, lu: false },
        '-created_date',
        100
      );
      return notifs;
    },
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const unreadCount = notifications.length;

  if (unreadCount === 0) return null;

  const sizeClasses = {
    sm: 'h-4 min-w-4 text-[10px] px-1',
    default: 'h-5 min-w-5 text-xs px-1.5',
    lg: 'h-6 min-w-6 text-sm px-2'
  };

  return (
    <Badge 
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center 
        bg-red-500 text-white 
        rounded-full font-bold
        animate-pulse
        ${className}
      `}
      variant={variant}
    >
      {showIcon && <Bell className="w-3 h-3 mr-1" />}
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}