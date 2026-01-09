import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import DashboardPersonnalise from '@/components/dashboard-pro/DashboardPersonnalise';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardProfessionnelPersonnalise() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: professional, isLoading: proLoading } = useQuery({
    queryKey: ['professional', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const pros = await base44.entities.Professionnel.filter({
        email: user.email
      });
      return pros[0] || null;
    },
    enabled: !!user
  });

  if (userLoading || proLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <DashboardPersonnalise professional={professional} user={user} />
      </div>
    </AuthGuard>
  );
}