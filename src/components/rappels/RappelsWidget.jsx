import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Pill, Activity } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RappelsWidget({ userEmail }) {
  const { data: rappels = [] } = useQuery({
    queryKey: ['rappels_sante_widget', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      return await base44.entities.RappelSante.filter(
        { 
          created_by: userEmail, 
          actif: true,
          termine: false
        },
        '-date_heure_rappel',
        5
      );
    },
    enabled: !!userEmail,
    refetchInterval: 60000, // Refresh every minute
  });

  const rappelsProches = rappels.filter(r => {
    const dateRappel = new Date(r.date_heure_rappel);
    const minutesRestantes = differenceInMinutes(dateRappel, new Date());
    return minutesRestantes > 0 && minutesRestantes <= 1440; // 24 heures
  });

  const typeIcons = {
    'rendez_vous': Calendar,
    'metrique_sante': Activity,
    'medicament': Pill,
    'vaccination': Calendar,
    'renouvellement_prescription': Pill
  };

  if (rappelsProches.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm md:text-base text-orange-900 mb-2 break-words">
              Rappels à venir ({rappelsProches.length})
            </h3>
            
            <div className="space-y-2">
              {rappelsProches.slice(0, 3).map((rappel) => {
                const TypeIcon = typeIcons[rappel.type_rappel] || Bell;
                const dateRappel = new Date(rappel.date_heure_rappel);
                const minutesRestantes = differenceInMinutes(dateRappel, new Date());
                
                return (
                  <div key={rappel.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                    <TypeIcon className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                        {rappel.titre}
                      </p>
                      <p className="text-xs text-gray-600">
                        {isToday(dateRappel) && `Aujourd'hui à ${format(dateRappel, 'HH:mm')}`}
                        {isTomorrow(dateRappel) && `Demain à ${format(dateRappel, 'HH:mm')}`}
                        {!isToday(dateRappel) && !isTomorrow(dateRappel) && format(dateRappel, 'dd MMM à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    {minutesRestantes < 60 && (
                      <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                        {minutesRestantes}min
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <Button asChild variant="outline" className="w-full mt-3 active:scale-95 transition-transform" size="sm">
              <Link to={createPageUrl('MesRappels')}>
                <Bell className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Voir tous les rappels</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}