import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import VideoConsultationPro from './VideoConsultationPro';
import VirtualWaitingRoom from './VirtualWaitingRoom';

export default function IntegrationVideoCall({ rendezVous, currentUserEmail, isSpecialist }) {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);

  const isVideoType = rendezVous?.type_consultation === 'teleconsultation' || 
                      rendezVous?.type_consultation === 'visio';

  const canStartCall = () => {
    if (!rendezVous) return false;
    if (!isVideoType) return false;
    
    // Vérifier si c'est l'heure du RDV (dans les 30 min avant ou pendant)
    const now = new Date();
    const rdvDate = new Date(rendezVous.date_rdv);
    const diffMinutes = (rdvDate - now) / (1000 * 60);
    
    // Permettre de démarrer 30 min avant jusqu'à 2h après
    return diffMinutes <= 30 && diffMinutes >= -120;
  };

  const getParticipantInfo = () => {
    if (isSpecialist) {
      return {
        email: rendezVous.created_by,
        name: rendezVous.created_by
      };
    } else {
      return {
        email: rendezVous.professionnel_email || 'professionnel@example.com',
        name: rendezVous.professionnel_nom || 'Votre spécialiste'
      };
    }
  };

  if (!rendezVous) return null;

  const participant = getParticipantInfo();
  const videoPageUrl = `${createPageUrl('VideoConsultation')}?rdv=${rendezVous.id}`;

  // Bouton pour rejoindre la vidéoconsultation WebRTC
  if (isVideoType && canStartCall()) {
    return (
      <div className="space-y-2">
        {/* Bouton principal - Nouvelle page WebRTC */}
        <Button
          asChild
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 w-full shadow-lg"
          size="lg"
        >
          <Link to={videoPageUrl}>
            <Video className="w-5 h-5 mr-2" />
            {isSpecialist ? 'Démarrer la vidéoconsultation' : 'Rejoindre la vidéoconsultation'}
          </Link>
        </Button>

        {/* Option alternative - salle d'attente */}
        {!isSpecialist && !showWaitingRoom && (
          <Button
            onClick={() => setShowWaitingRoom(true)}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Salle d'attente virtuelle
          </Button>
        )}

        {showWaitingRoom && !isSpecialist && (
          <VirtualWaitingRoom
            rendezVous={rendezVous}
            onCallReady={() => {
              setShowWaitingRoom(false);
              setShowVideoCall(true);
            }}
          />
        )}

        {showVideoCall && (
          <VideoConsultationPro
            rendezVous={rendezVous}
            participantEmail={participant.email}
            participantName={participant.name}
            currentUserEmail={currentUserEmail}
            isSpecialist={isSpecialist}
            onClose={() => {
              setShowVideoCall(false);
              setShowWaitingRoom(false);
            }}
          />
        )}
      </div>
    );
  }

  return null;
}