import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Video,
  Phone,
  Building2,
  Briefcase,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import GestionRendezVous from './GestionRendezVous';

export default function RendezVousDraggable({ rdv, index, isSpecialist, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  const changerStatutMutation = useMutation({
    mutationFn: async (nouveauStatut) => {
      await base44.entities.RendezVous.update(rdv.id, {
        statut: nouveauStatut
      });
      
      // Notification au patient
      await base44.entities.Notification.create({
        destinataire_email: rdv.created_by,
        type: 'rendez_vous_confirmation',
        titre: nouveauStatut === 'confirme' ? 'Rendez-vous confirmé' : 'Statut mis à jour',
        message: `Votre rendez-vous du ${format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })} est maintenant ${nouveauStatut}.`,
        action_page: 'Teleconsultation',
        priorite: 'normale',
        icone: 'CheckCircle',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
    },
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-4 h-4" />;
      case 'clinique': return <Building2 className="w-4 h-4" />;
      case 'hopital': return <Building2 className="w-4 h-4" />;
      case 'telephone': return <Phone className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'cabinet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clinique': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hopital': return 'bg-red-100 text-red-800 border-red-200';
      case 'telephone': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'confirme': return 'bg-green-500';
      case 'planifie': return 'bg-orange-500';
      case 'termine': return 'bg-gray-500';
      case 'en_cours': return 'bg-purple-500';
      case 'annule': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (statut) => {
    switch(statut) {
      case 'confirme': return 'Confirmé';
      case 'planifie': return 'En attente';
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  return (
    <Draggable draggableId={rdv.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-3 ${snapshot.isDragging ? 'opacity-70' : ''}`}
        >
          <Card className={`
            hover:shadow-lg transition-all cursor-move
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-teal-400 scale-105' : ''}
          `}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div
                  {...provided.dragHandleProps}
                  className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                {/* Contenu principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">
                        {format(new Date(rdv.date_rdv), 'HH:mm')}
                      </span>
                      <Badge className={getTypeColor(rdv.type_consultation)}>
                        {getTypeIcon(rdv.type_consultation)}
                        <span className="ml-1 text-xs">{rdv.type_consultation}</span>
                      </Badge>
                    </div>

                    {/* Indicateur de statut */}
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(rdv.statut)}`} />
                  </div>

                  {rdv.motif && (
                    <p className="text-sm text-gray-700 mb-2 truncate">{rdv.motif}</p>
                  )}

                  {/* Boutons de changement de statut rapide */}
                  {isSpecialist && rdv.statut !== 'annule' && rdv.statut !== 'termine' && (
                    <div className="flex gap-2 mt-3">
                      {rdv.statut === 'planifie' && (
                        <Button
                          size="sm"
                          onClick={() => changerStatutMutation.mutate('confirme')}
                          disabled={changerStatutMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-xs py-1 px-2"
                        >
                          {changerStatutMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirmer
                            </>
                          )}
                        </Button>
                      )}

                      {rdv.statut === 'confirme' && (
                        <Button
                          size="sm"
                          onClick={() => changerStatutMutation.mutate('planifie')}
                          disabled={changerStatutMutation.isPending}
                          variant="outline"
                          className="text-xs py-1 px-2"
                        >
                          {changerStatutMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Mettre en attente
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        variant="ghost"
                        className="text-xs py-1 px-2"
                      >
                        {showDetails ? 'Masquer' : 'Détails'}
                      </Button>
                    </div>
                  )}

                  {/* Détails complets */}
                  {showDetails && (
                    <div className="mt-3 pt-3 border-t">
                      <GestionRendezVous
                        rdv={rdv}
                        currentUserEmail={currentUserEmail}
                        isSpecialist={isSpecialist}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}