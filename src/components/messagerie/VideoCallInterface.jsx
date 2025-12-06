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
  Settings,
  MessageSquare,
  Users,
  X,
  Camera
} from 'lucide-react';

export default function VideoCallInterface({ conversationId, participantEmail, currentUserEmail, onClose }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Simulation de connexion
    const timer = setTimeout(() => {
      setCallStatus('connected');
      startCallTimer();
    }, 2000);

    // Demander accès à la caméra et micro
    initializeMedia();

    return () => {
      clearTimeout(timer);
      stopMedia();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erreur accès média:', error);
      alert('Impossible d\'accéder à la caméra ou au microphone. Veuillez vérifier les permissions.');
    }
  };

  const stopMedia = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
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
          video: true 
        });
        // Logique de partage d'écran à implémenter
        setIsScreenSharing(true);
      } else {
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
    }
  };

  const endCall = () => {
    stopMedia();
    setCallStatus('ended');
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{participantEmail}</h3>
              <div className="flex items-center gap-2">
                {callStatus === 'connecting' && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    Connexion en cours...
                  </Badge>
                )}
                {callStatus === 'connected' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">{formatDuration(callDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        {/* Remote Video (Participant) */}
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Placeholder si pas de vidéo */}
          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-white text-lg mb-2">Connexion en cours...</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture in Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
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
        </div>

        {/* Info overlay */}
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur rounded-lg px-4 py-2">
          <p className="text-white text-sm font-medium">Téléconsultation sécurisée</p>
          <p className="text-gray-400 text-xs">Chiffrement de bout en bout activé 🔒</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          {/* Toggle Micro */}
          <Button
            onClick={toggleAudio}
            size="lg"
            variant={isAudioEnabled ? "default" : "destructive"}
            className={`rounded-full w-14 h-14 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Toggle Video */}
          <Button
            onClick={toggleVideo}
            size="lg"
            variant={isVideoEnabled ? "default" : "destructive"}
            className={`rounded-full w-14 h-14 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* End Call */}
          <Button
            onClick={endCall}
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <Phone className="w-7 h-7 rotate-135" />
          </Button>

          {/* Partage écran */}
          <Button
            onClick={toggleScreenShare}
            size="lg"
            variant={isScreenSharing ? "default" : "outline"}
            className={`rounded-full w-14 h-14 ${isScreenSharing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
          >
            <Monitor className="w-6 h-6" />
          </Button>

          {/* Settings */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600 border-gray-600"
          >
            <Settings className="w-6 h-6" />
          </Button>

          {/* Chat */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600 border-gray-600"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-xs">
            💡 Astuce : Vous pouvez partager votre écran pour montrer des documents
          </p>
        </div>
      </div>
    </div>
  );
}