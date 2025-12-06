import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  User
} from 'lucide-react';
import WebRTCService from './WebRTCService';

export default function VideoCallRoom({ 
  roomId, 
  isInitiator = false,
  participantName = 'Participant',
  onEndCall,
  onError 
}) {
  const [connectionState, setConnectionState] = useState('new');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcServiceRef = useRef(null);
  const containerRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const handleRemoteStream = useCallback((stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const handleConnectionStateChange = useCallback((state) => {
    setConnectionState(state);
    
    if (state === 'connected') {
      // Démarrer le chrono
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (state === 'disconnected' || state === 'failed') {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  }, []);

  useEffect(() => {
    if (!user || !roomId) return;

    const initCall = async () => {
      try {
        setError(null);
        
        // Créer le service WebRTC
        webrtcServiceRef.current = new WebRTCService(
          roomId,
          user.email,
          handleRemoteStream,
          handleConnectionStateChange
        );

        // Initialiser
        await webrtcServiceRef.current.initialize(isInitiator);

        // Obtenir le stream local
        const localStream = await webrtcServiceRef.current.getLocalStream(true, true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Si initiateur, créer l'offre après un délai
        if (isInitiator) {
          setTimeout(async () => {
            await webrtcServiceRef.current.createOffer();
          }, 2000);
        }

      } catch (err) {
        console.error('Erreur initialisation appel:', err);
        setError(err.message || 'Erreur lors de l\'initialisation de l\'appel');
        if (onError) onError(err);
      }
    };

    initCall();

    return () => {
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.cleanup();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [user, roomId, isInitiator, handleRemoteStream, handleConnectionStateChange, onError]);

  const toggleVideo = () => {
    if (webrtcServiceRef.current) {
      const newState = !isVideoEnabled;
      webrtcServiceRef.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (webrtcServiceRef.current) {
      const newState = !isAudioEnabled;
      webrtcServiceRef.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
    }
  };

  const handleEndCall = async () => {
    if (webrtcServiceRef.current) {
      await webrtcServiceRef.current.endCall();
    }
    if (onEndCall) onEndCall();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'new': return 'Initialisation...';
      case 'connecting': return 'Connexion en cours...';
      case 'connected': return 'Connecté';
      case 'disconnected': return 'Déconnecté';
      case 'failed': return 'Échec de connexion';
      default: return connectionState;
    }
  };

  if (error) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erreur de connexion</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertDescription className="text-yellow-800 text-sm">
              Assurez-vous d'avoir autorisé l'accès à la caméra et au microphone.
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl overflow-hidden'}`}
      style={{ minHeight: isFullscreen ? '100vh' : '500px' }}
    >
      {/* Vidéo distante (plein écran) */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Placeholder si pas de vidéo distante */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium">{participantName}</p>
            <div className="flex items-center gap-2 mt-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-gray-400">{getConnectionStatusText()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vidéo locale (picture-in-picture) */}
      <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
        />
        {!isVideoEnabled && (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <VideoOff className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded">Vous</span>
        </div>
      </div>

      {/* Barre de statut en haut */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <Badge className={`${getConnectionStatusColor()} text-white`}>
          <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
          {getConnectionStatusText()}
        </Badge>
        
        {connectionState === 'connected' && (
          <Badge variant="outline" className="bg-black/50 text-white border-white/20">
            {formatDuration(callDuration)}
          </Badge>
        )}
      </div>

      {/* Contrôles en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Toggle Micro */}
          <button
            onClick={toggleAudio}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            `}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Toggle Vidéo */}
          <button
            onClick={toggleVideo}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${isVideoEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            `}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Raccrocher */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all shadow-lg"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Plein écran */}
          <button
            onClick={toggleFullscreen}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Indicateurs audio/vidéo */}
        <div className="flex justify-center gap-4 mt-4">
          {!isAudioEnabled && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <MicOff className="w-3 h-3" /> Micro désactivé
            </span>
          )}
          {!isVideoEnabled && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <VideoOff className="w-3 h-3" /> Caméra désactivée
            </span>
          )}
        </div>
      </div>
    </div>
  );
}