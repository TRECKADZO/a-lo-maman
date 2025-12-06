import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addDays,
  setHours,
  setMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import RendezVousDraggable from './RendezVousDraggable';

export default function CalendrierDragDrop({ rendezVous, isSpecialist, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dragInfo, setDragInfo] = useState(null);

  const joursSemaine = eachDayOfInterval({
    start: startOfWeek(selectedWeek, { locale: fr, weekStartsOn: 1 }),
    end: endOfWeek(selectedWeek, { locale: fr, weekStartsOn: 1 })
  });

  const deplacerRdvMutation = useMutation({
    mutationFn: async ({ rdvId, nouveauJour, nouvelleHeure }) => {
      const rdv = rendezVous.find(r => r.id === rdvId);
      if (!rdv) return;

      const ancienneDate = new Date(rdv.date_rdv);
      const [heures, minutes] = nouvelleHeure.split(':');
      
      const nouvelleDate = setMinutes(
        setHours(nouveauJour, parseInt(heures)),
        parseInt(minutes)
      );

      await base44.entities.RendezVous.update(rdvId, {
        ancien_date_rdv: rdv.date_rdv,
        date_rdv: nouvelleDate.toISOString(),
        reprogramme: true
      });

      await base44.entities.Notification.create({
        destinataire_email: rdv.created_by,
        type: 'rendez_vous_confirmation',
        titre: 'Rendez-vous déplacé',
        message: `Votre rendez-vous a été déplacé au ${format(nouvelleDate, 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}.`,
        action_page: 'Teleconsultation',
        priorite: 'haute',
        icone: 'Calendar',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setDragInfo(null);
    },
  });

  const onDragStart = (result) => {
    const rdv = rendezVous.find(r => r.id === result.draggableId);
    if (rdv) {
      setDragInfo({
        rdv,
        originalDate: new Date(rdv.date_rdv)
      });
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      setDragInfo(null);
      return;
    }

    const sourceJour = joursSemaine[parseInt(result.source.droppableId.split('-')[1])];
    const destJour = joursSemaine[parseInt(result.destination.droppableId.split('-')[1])];

    const rdv = rendezVous.find(r => r.id === result.draggableId);
    if (!rdv) return;

    const ancienneHeure = format(new Date(rdv.date_rdv), 'HH:mm');

    if (!isSameDay(sourceJour, destJour)) {
      deplacerRdvMutation.mutate({
        rdvId: result.draggableId,
        nouveauJour: destJour,
        nouvelleHeure: ancienneHeure
      });
    }

    setDragInfo(null);
  };

  const rdvParJour = (jour) => {
    return rendezVous.filter(rdv => 
      isSameDay(new Date(rdv.date_rdv), jour) && rdv.statut !== 'annule'
    ).sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv));
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-lg border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Semaine du {format(joursSemaine[0], 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              >
                ← Semaine précédente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              >
                Semaine suivante →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>💡 Astuce :</strong> Glissez-déposez les rendez-vous entre les jours pour les déplacer rapidement. 
          Cliquez sur les boutons "Confirmer" ou "Mettre en attente" pour changer le statut instantanément.
        </AlertDescription>
      </Alert>

      {dragInfo && (
        <Alert className="bg-teal-50 border-teal-200">
          <AlertCircle className="h-4 w-4 text-teal-600" />
          <AlertDescription className="text-teal-900">
            Déplacement du RDV de {format(dragInfo.originalDate, 'HH:mm', { locale: fr })} - 
            Déposez sur un autre jour pour le déplacer
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {joursSemaine.map((jour, index) => {
            const rdvsJour = rdvParJour(jour);
            const estAujourdhui = isSameDay(jour, new Date());

            return (
              <Droppable key={index} droppableId={`jour-${index}`}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      border-2 transition-all
                      ${estAujourdhui ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200'}
                      ${snapshot.isDraggingOver ? 'bg-teal-100 border-teal-400 shadow-lg' : ''}
                    `}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          {format(jour, 'EEEE', { locale: fr }).substring(0, 3)}
                        </p>
                        <p className={`text-2xl font-bold ${estAujourdhui ? 'text-teal-600' : 'text-gray-900'}`}>
                          {format(jour, 'd')}
                        </p>
                        {rdvsJour.length > 0 && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {rdvsJour.length} RDV
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-2 min-h-[200px]">
                      {rdvsJour.length > 0 ? (
                        rdvsJour.map((rdv, rdvIndex) => (
                          <RendezVousDraggable
                            key={rdv.id}
                            rdv={rdv}
                            index={rdvIndex}
                            isSpecialist={isSpecialist}
                            currentUserEmail={currentUserEmail}
                          />
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-xs text-gray-400">
                            Aucun RDV
                          </p>
                        </div>
                      )}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-sm">Légende des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm">Terminé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {deplacerRdvMutation.isPending && (
        <Alert className="bg-purple-50 border-purple-200">
          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
          <AlertDescription className="text-purple-900">
            Déplacement du rendez-vous en cours...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}