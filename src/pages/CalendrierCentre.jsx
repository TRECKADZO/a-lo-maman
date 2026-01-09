import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import CalendrierCentre from '../components/centre/CalendrierCentre';

export default function CalendrierCentrePage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: centre, isLoading } = useQuery({
    queryKey: ['centre', user?.email],
    queryFn: async () => {
      const centres = await base44.entities.Clinique.filter({
        $or: [
          { administrateurs: { $in: [user.email] } },
          { administrateur_email: user.email }
        ]
      });
      return centres[0];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Aucun centre trouvé</p>
      </div>
    );
  }

  return <CalendrierCentre centre={centre} />;
}