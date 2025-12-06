import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  X,
  Camera,
  Settings,
  Info,
  FileText,
  Maximize2,
  Volume2,
  VolumeX,
  AlertCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoConsultation({ 
  rendezVous, 
  participantEmail, 
  participantName,
  currentUserEmail,
  isSpecialist = false,
  onClose 
}) {
  // États de la consultation
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  
  // États des médias
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  
  // États de l'interface
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  
  // Références
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Récupérer les périphériques disponibles
      await enumerateDevices();
      
      // Demander l'accès aux médias
      await requestMediaAccess();
      
      // Simuler la connexion (en production, utiliser WebRTC)
      setTimeout(() => {
        setCallStatus('connected');
        startTimer();
      }, 2000);
    } catch (error) {
      console.error('Erreur initialisation:', error);
      alert('Impossible d\'initialiser la consultation. Vérifiez vos permissions.');
    }
  };

  const enumerateDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const microphones = deviceList.filter(device => device.kind === 'audioinput');
      
      setDevices({ cameras, microphones });
      
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (error) {
      console.error('Erreur énumération périphériques:', error);
    }
  };

  const requestMediaAccess = async () => {
    try {
      const constraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setCallStatus('connecting');
    } catch (error) {
      console.error('Erreur accès média:', error);
      throw error;
    }
  };

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' },
          audio: false
        });
        
        // Remplacer la vidéo locale par le partage d'écran
        const videoTrack = stream.getVideoTracks()[0];
        
        if (localStreamRef.current) {
          const sender = localStreamRef.current.getVideoTracks()[0];
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
        
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          requestMediaAccess(); // Revenir à la caméra
        };
        
        setIsScreenSharing(true);
      } else {
        setIsScreenSharing(false);
        requestMediaAccess();
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
      alert('Impossible de partager l\'écran');
    }
  };

  const endCall = async () => {
    try {
      // Sauvegarder les notes de consultation si spécialiste
      if (isSpecialist && consultationNotes) {
        await base44.entities.RendezVous.update(rendezVous.id, {
          statut: 'termine',
          notes_professionnel: consultationNotes
        });
      }
      
      cleanup();
      setCallStatus('ended');
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur fin d\'appel:', error);
      onClose();
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (callStatus) {
      case 'initializing':
        return <Badge className="bg-gray-500 text-white">Initialisation...</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500 text-white">Connexion...</Badge>;
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
          </div>
        );
      case 'ended':
        return <Badge className="bg-red-500 text-white">Terminé</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{participantName || participantEmail}</h3>
              {getStatusBadge()}
            </div>
          </div>
          
          {rendezVous && (
            <Badge variant="outline" className="text-white border-gray-600">
              {rendezVous.motif || 'Consultation'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={endCall}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900 flex">
        {/* Main Video (Remote) */}
        <div className={`${showChat || showNotes ? 'w-2/3' : 'w-full'} h-full flex items-center justify-center bg-gray-800 relative transition-all`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Placeholder si pas de vidéo distante */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <Users className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-white text-xl font-semibold mb-2">
                {callStatus === 'initializing' && 'Initialisation...'}
                {callStatus === 'connecting' && 'Connexion en cours...'}
                {callStatus === 'ended' && 'Consultation terminée'}
              </p>
              {callStatus !== 'ended' && (
                <div className="flex gap-2 mt-4">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          )}

          {/* Local Video (Picture in Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl group hover:scale-105 transition-transform">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-gray-900/80 text-white text-xs">Vous</Badge>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/50"
              onClick={() => {
                if (localVideoRef.current.requestFullscreen) {
                  localVideoRef.current.requestFullscreen();
                }
              }}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Info overlay */}
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-lg rounded-xl px-4 py-3 border border-gray-700 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-white text-sm font-semibold">Téléconsultation sécurisée</p>
            </div>
            <p className="text-gray-300 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" />
              Chiffrement de bout en bout activé
            </p>
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {!isAudioEnabled && (
              <Badge className="bg-red-500/90 text-white backdrop-blur">
                <MicOff className="w-3 h-3 mr-1" />
                Micro coupé
              </Badge>
            )}
            {isScreenSharing && (
              <Badge className="bg-teal-500/90 text-white backdrop-blur">
                <Monitor className="w-3 h-3 mr-1" />
                Partage d'écran actif
              </Badge>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-gray-400 text-sm text-center">
                Le chat sera disponible bientôt
              </p>
            </div>
          </div>
        )}

        {/* Notes Panel (Specialists only) */}
        {showNotes && isSpecialist && (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes de consultation
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNotes(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Prenez vos notes ici..."
                className="w-full h-full bg-gray-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Toggle Micro */}
              <Button
                onClick={toggleAudio}
                size="lg"
                variant={isAudioEnabled ? "default" : "destructive"}
                className={`rounded-full w-14 h-14 transition-all ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>

              {/* Toggle Video */}
              <Button
                onClick={toggleVideo}
                size="lg"
                variant={isVideoEnabled ? "default" : "destructive"}
                className={`rounded-full w-14 h-14 transition-all ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                title={isVideoEnabled ? 'Couper la vidéo' : 'Activer la vidéo'}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>

              {/* Partage écran */}
              <Button
                onClick={toggleScreenShare}
                size="lg"
                variant={isScreenSharing ? "default" : "outline"}
                className={`rounded-full w-14 h-14 transition-all ${isScreenSharing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
              >
                {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              </Button>
            </div>

            {/* End Call (Center) */}
            <Button
              onClick={endCall}
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 shadow-lg"
              title="Terminer l'appel"
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </Button>

            <div className="flex items-center gap-3">
              {/* Chat */}
              <Button
                onClick={() => setShowChat(!showChat)}
                size="lg"
                variant={showChat ? "default" : "outline"}
                className={`rounded-full w-14 h-14 transition-all ${showChat ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                title="Ouvrir le chat"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>

              {/* Notes (Specialists only) */}
              {isSpecialist && (
                <Button
                  onClick={() => setShowNotes(!showNotes)}
                  size="lg"
                  variant={showNotes ? "default" : "outline"}
                  className={`rounded-full w-14 h-14 transition-all ${showNotes ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                  title="Notes de consultation"
                >
                  <FileText className="w-6 h-6" />
                </Button>
              )}

              {/* Audio distant */}
              <Button
                onClick={() => setIsRemoteAudioEnabled(!isRemoteAudioEnabled)}
                size="lg"
                variant="outline"
                className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600 border-gray-600"
                title={isRemoteAudioEnabled ? 'Couper le son' : 'Activer le son'}
              >
                {isRemoteAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Info footer */}
          <div className="text-center">
            <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Les consultations vidéo sont chiffrées de bout en bout pour votre sécurité
            </p>
          </div>
        </div>
      </div>

      {/* Call ended overlay */}
      {callStatus === 'ended' && (
        <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Consultation terminée</h2>
            <p className="text-gray-400 mb-4">Durée : {formatDuration(callDuration)}</p>
            {isSpecialist && consultationNotes && (
              <Badge className="bg-green-100 text-green-800">
                ✓ Notes sauvegardées
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}