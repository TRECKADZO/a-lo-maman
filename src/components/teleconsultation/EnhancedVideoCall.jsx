import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Send,
  FileText,
  Camera,
  Volume2,
  VolumeX,
  X,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import EnvoyerDocumentConsultation from './EnvoyerDocumentConsultation';

export default function EnhancedVideoCall({ 
  conversationId, 
  participantEmail, 
  currentUserEmail,
  isSpecialist,
  onClose 
}) {
  const queryClient = useQueryClient();
  const [localStream, setLocalStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSendDocument, setShowSendDocument] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const callStartTimeRef = useRef(Date.now());

  useEffect(() => {
    initializeMedia();
    
    const durationInterval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(durationInterval);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Impossible d\'accéder à la caméra ou au microphone');
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (error) {
        console.error('Screen share error:', error);
      }
    } else {
      if (screenShareRef.current && screenShareRef.current.srcObject) {
        screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
        screenShareRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: currentUserEmail,
      content: chatMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenShareRef.current?.srcObject) {
      screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-red-500 text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            En appel
          </Badge>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span className="text-sm">{participantEmail}</span>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative bg-black">
        {/* Remote video (main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Screen share overlay */}
        {isScreenSharing && (
          <div className="absolute inset-0 bg-black">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <Badge className="absolute top-4 left-4 bg-blue-500 text-white">
              <Monitor className="w-4 h-4 mr-2" />
              Partage d'écran
            </Badge>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat sécurisé
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === currentUserEmail ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs p-3 rounded-lg ${
                    msg.sender === currentUserEmail
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage} size="icon" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            onClick={toggleCamera}
            size="lg"
            className={`rounded-full ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={toggleMic}
            size="lg"
            className={`rounded-full ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={toggleSpeaker}
            size="lg"
            className="rounded-full bg-gray-700 hover:bg-gray-600"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <Button
            onClick={toggleScreenShare}
            size="lg"
            className={`rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          <Button
            onClick={() => setShowChat(!showChat)}
            size="lg"
            className="rounded-full bg-gray-700 hover:bg-gray-600 relative"
          >
            <MessageSquare className="w-5 h-5" />
            {chatMessages.filter(m => m.sender !== currentUserEmail).length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">
                  {chatMessages.filter(m => m.sender !== currentUserEmail).length}
                </span>
              </div>
            )}
          </Button>

          {isSpecialist && (
            <Button
              onClick={() => setShowSendDocument(true)}
              size="lg"
              className="rounded-full bg-green-700 hover:bg-green-600"
            >
              <FileText className="w-5 h-5" />
            </Button>
          )}

          <Button
            onClick={endCall}
            size="lg"
            className="rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Modal envoi de document */}
      {showSendDocument && (
        <EnvoyerDocumentConsultation
          patientEmail={participantEmail}
          conversationId={conversationId}
          onClose={() => setShowSendDocument(false)}
        />
      )}

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}