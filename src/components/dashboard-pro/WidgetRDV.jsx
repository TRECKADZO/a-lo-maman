import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format, isSameDay, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function WidgetRDV({ professional, compact = false }) {
  const { data: appointments } = useQuery({
    queryKey: ['appointments_today', professional?.email],
    queryFn: async () => {
      if (!professional) return [];
      
      const all = await base44.entities.RendezVousAdministratif.filter({
        professionnel_id: professional.id
      }).catch(() => []);

      const now = new Date();
      return all
        .filter(rdv => {
          const rdvDate = new Date(rdv.date_rdv);
          return isSameDay(rdvDate, now) || (isAfter(rdvDate, now) && rdvDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
        })
        .sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv))
        .slice(0, compact ? 3 : 10);
    },
    enabled: !!professional,
    refetchInterval: 60000
  });

  const getTypeColor = (type) => {
    const colors = {
      consultation_prenatale: 'bg-pink-100 text-pink-800',
      echographie: 'bg-blue-100 text-blue-800',
      pediatrie: 'bg-green-100 text-green-800',
      urgences: 'bg-red-100 text-red-800',
      planning_familial: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          {compact ? 'Prochains RDV' : 'Rendez-vous'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!appointments || appointments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucun rendez-vous</p>
        ) : (
          <div className={`space-y-2 ${!compact && 'max-h-96 overflow-y-auto'}`}>
            {appointments.map((rdv) => (
              <div key={rdv.id} className="p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-sm">{rdv.patient_nom}</p>
                  <Badge className={getTypeColor(rdv.type_consultation)}>
                    {rdv.type_consultation.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(rdv.date_rdv), 'HH:mm', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {rdv.patient_telephone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}