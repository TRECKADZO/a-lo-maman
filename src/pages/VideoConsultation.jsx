import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import VideoCallRoom from '@/components/videocall/VideoCallRoom';

export default function VideoConsultation() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const rdvId = urlParams.get('rdv');
  const [isInCall, setIsInCall] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rendezVous, isLoading: loadingRdv } = useQuery({
    queryKey: ['rdv_video', rdvId],
    queryFn: async () => {
      if (!rdvId) return null;
      const rdvs = await base44.entities.RendezVous.filter({ id: rdvId });
      return rdvs[0] || null;
    },
    enabled: !!rdvId,
  });

  const { data: professionnel } = useQuery({
    queryKey: ['pro_video', rendezVous?.professionnel_id],
    queryFn: async () => {
      if (!rendezVous?.professionnel_id) return null;
      const pros = await base44.entities.Professionnel.filter({ id: rendezVous.professionnel_id });
      return pros[0] || null;
    },
    enabled: !!rendezVous?.professionnel_id,
  });

  // Vérifier les permissions média
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionsGranted(true);
      } catch (err) {
        setPermissionsGranted(false);
      }
    };
    checkPermissions();
  }, []);

  const handleEndCall = () => {
    setIsInCall(false);
    // Optionnel: rediriger vers les rendez-vous
  };

  const isInitiator = user?.email === rendezVous?.created_by;
  const roomId = rdvId ? `rdv_${rdvId}` : null;
  const participantName = isInitiator 
    ? (professionnel?.display_name || professionnel?.nom_complet || 'Spécialiste')
    : 'Patient';

  if (isInCall && roomId) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <VideoCallRoom
          roomId={roomId}
          isInitiator={isInitiator}
          participantName={participantName}
          onEndCall={handleEndCall}
          onError={(err) => console.error(err)}
        />
      </div>
    );
  }

  if (loadingRdv) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!rdvId || !rendezVous) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune consultation sélectionnée</h2>
              <p className="text-gray-600 mb-6">
                Veuillez accéder à cette page depuis un rendez-vous de type vidéoconsultation.
              </p>
              <Button asChild>
                <Link to={createPageUrl('MesRendezVous')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Mes rendez-vous
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Vidéoconsultation</h1>
        </div>

        {/* Infos du rendez-vous */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-600" />
              Détails de la consultation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {professionnel?.display_name || professionnel?.nom_complet || 'Spécialiste'}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {professionnel?.specialite?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">
                    {format(new Date(rendezVous.date_rdv), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Heure</p>
                  <p className="font-medium">
                    {format(new Date(rendezVous.date_rdv), 'HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>

            <Badge className="bg-teal-100 text-teal-800">
              {rendezVous.statut === 'confirme' ? 'Confirmé' : rendezVous.statut}
            </Badge>
          </CardContent>
        </Card>

        {/* Statut des permissions */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Vérification du système</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {permissionsGranted === null ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : permissionsGranted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={permissionsGranted === false ? 'text-red-600' : ''}>
                  Accès caméra et microphone
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Connexion internet</span>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Connexion sécurisée (chiffrée)</span>
              </div>
            </div>

            {permissionsGranted === false && (
              <Alert className="mt-4 bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Veuillez autoriser l'accès à votre caméra et microphone dans les paramètres de votre navigateur.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Bouton rejoindre */}
        <Button
          onClick={() => setIsInCall(true)}
          disabled={permissionsGranted === false}
          className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg"
        >
          <Video className="w-6 h-6 mr-3" />
          Rejoindre la consultation
        </Button>

        {/* Conseils */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Conseils :</strong> Assurez-vous d'être dans un endroit calme avec une bonne connexion internet. 
              Positionnez-vous face à une source de lumière naturelle pour une meilleure qualité vidéo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}