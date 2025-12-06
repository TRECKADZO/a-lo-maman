import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MonitorOff,
  MessageSquare,
  X,
  Camera,
  FileText,
  Paperclip,
  Brain,
  Languages,
  Shield,
  Send,
  User,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SecureDocumentSharing from './SecureDocumentSharing';
import RealTimeTranslation from './RealTimeTranslation';
import EMRIntegration from './EMRIntegration';
import AIConsultationSummary from './AIConsultationSummary';
import FeedbackConsultation from './FeedbackConsultation';

export default function VideoConsultationPro({ 
  rendezVous, 
  participantEmail, 
  participantName,
  currentUserEmail,
  isSpecialist = false,
  onClose 
}) {
  // États de la consultation
  const [callStatus, setCallStatus] = useState('initializing');
  const [callDuration, setCallDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // États des médias
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  
  // États de l'interface
  const [activePanel, setActivePanel] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Documents
  const [sharedDocuments, setSharedDocuments] = useState([]);
  
  // Translation
  const [translationEnabled, setTranslationEnabled] = useState(false);
  
  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Références
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeCall();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setTimeout(() => {
        setCallStatus('connected');
        const now = new Date();
        setStartTime(now);
        startTimer();
        addSystemMessage(`Consultation commencée à ${format(now, 'HH:mm', { locale: fr })}`);
      }, 2000);
    } catch (error) {
      console.error('Erreur initialisation:', error);
      alert('Impossible d\'accéder à la caméra/micro');
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
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
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
        
        screenStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        
        setIsScreenSharing(true);
        addSystemMessage('Partage d\'écran activé');
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsScreenSharing(false);
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        addSystemMessage('Partage d\'écran arrêté');
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
    }
  };

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content,
      timestamp: new Date()
    }]);
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      type: 'sent',
      content: newMessage,
      sender: isSpecialist ? 'Spécialiste' : 'Patient',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const endCall = () => {
    if (isSpecialist) {
      setActivePanel('summary');
    } else {
      setShowFeedback(true);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const renderSidePanel = () => {
    switch (activePanel) {
      case 'chat':
        return (
          <div className="w-80 bg-white border-l flex flex-col shadow-lg">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
                {translationEnabled && (
                  <Badge variant="outline" className="text-xs">
                    <Languages className="w-3 h-3 mr-1" />
                    Traduction active
                  </Badge>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.type === 'system' ? 'text-center' : msg.type === 'sent' ? 'text-right' : 'text-left'}>
                  {msg.type === 'system' ? (
                    <p className="text-xs text-gray-500 italic">{msg.content}</p>
                  ) : (
                    <div className={`inline-block ${msg.type === 'sent' ? 'bg-teal-600' : 'bg-white border'} rounded-lg px-3 py-2 max-w-[85%] shadow-sm`}>
                      <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                      <p className={`text-sm ${msg.type === 'sent' ? 'text-white' : 'text-gray-900'}`}>{msg.content}</p>
                      <p className={`text-xs ${msg.type === 'sent' ? 'text-teal-100' : 'text-gray-400'} mt-1`}>
                        {format(msg.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Message..."
                  className="flex-1"
                />
                <Button onClick={sendChatMessage} className="bg-teal-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="w-80 bg-white border-l flex flex-col shadow-lg">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Symptômes, diagnostic, observations..."
                className="w-full h-full resize-none min-h-[400px]"
              />
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="w-96 bg-white border-l flex flex-col shadow-lg overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Documents ({sharedDocuments.length})
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <SecureDocumentSharing
                documents={sharedDocuments}
                onDocumentUploaded={(doc) => setSharedDocuments(prev => [...prev, doc])}
                onDocumentDeleted={(docId) => setSharedDocuments(prev => prev.filter(d => d.id !== docId))}
                isSpecialist={isSpecialist}
                rendezVousId={rendezVous?.id}
              />
            </div>
          </div>
        );

      case 'emr':
        return (
          <div className="w-96 bg-white border-l flex flex-col shadow-lg overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Dossier Patient
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <EMRIntegration
                patientEmail={participantEmail}
                rendezVousId={rendezVous?.id}
              />
            </div>
          </div>
        );

      case 'translation':
        return (
          <div className="w-80 bg-white border-l flex flex-col shadow-lg">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Traduction
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <RealTimeTranslation
                sourceLanguage="fr"
                onTranslationChange={setTranslationEnabled}
                messages={messages}
              />
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="w-96 bg-white border-l flex flex-col shadow-lg overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Résumé IA
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <AIConsultationSummary
                rendezVous={rendezVous}
                consultationNotes={consultationNotes}
                chatMessages={messages}
                sharedDocuments={sharedDocuments}
                onSummarySaved={() => {
                  cleanup();
                  setCallStatus('ended');
                  setTimeout(() => onClose(), 2000);
                }}
              />
            </div>
          </div>
        );

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
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{participantName || participantEmail}</h3>
              <div className="flex items-center gap-2">
                {callStatus === 'connected' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm">{formatDuration(callDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {rendezVous && (
            <Badge variant="outline" className="text-white border-gray-600">
              {rendezVous.motif || 'Consultation'}
            </Badge>
          )}

          {translationEnabled && (
            <Badge className="bg-purple-600 text-white">
              <Languages className="w-3 h-3 mr-1" />
              Traduction active
            </Badge>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={endCall} className="text-gray-400 hover:text-red-500">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Video */}
        <div className={`${activePanel ? 'flex-1' : 'w-full'} h-full flex items-center justify-center bg-black relative transition-all`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Loader2 className="w-16 h-16 text-teal-500 mb-4 animate-spin" />
              <p className="text-white text-xl font-semibold">
                {callStatus === 'initializing' && 'Initialisation...'}
                {callStatus === 'connecting' && 'Connexion...'}
                {callStatus === 'ending' && 'Finalisation...'}
                {callStatus === 'ended' && 'Terminée'}
              </p>
            </div>
          )}

          {/* Local Video PiP */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-teal-500 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <Badge className="absolute bottom-2 left-2 bg-gray-900/80 text-white text-xs">Vous</Badge>
          </div>

          {/* Status badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {!isAudioEnabled && (
              <Badge className="bg-red-500/90 backdrop-blur">
                <MicOff className="w-3 h-3 mr-1" />
                Micro coupé
              </Badge>
            )}
            {isScreenSharing && (
              <Badge className="bg-teal-500/90 backdrop-blur">
                <Monitor className="w-3 h-3 mr-1" />
                Partage écran
              </Badge>
            )}
          </div>
        </div>

        {/* Side Panel */}
        {renderSidePanel()}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Media Controls */}
          <div className="flex gap-2">
            <Button
              onClick={toggleAudio}
              size="lg"
              className={`rounded-full w-12 h-12 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              onClick={toggleVideo}
              size="lg"
              className={`rounded-full w-12 h-12 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              onClick={toggleScreenShare}
              size="lg"
              className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>
          </div>

          {/* End Call */}
          <Button
            onClick={endCall}
            size="lg"
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <Phone className="w-7 h-7 rotate-[135deg]" />
          </Button>

          {/* Feature Controls */}
          <div className="flex gap-2">
            <Button
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              size="lg"
              className={`rounded-full w-12 h-12 relative ${activePanel === 'chat' ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <MessageSquare className="w-5 h-5" />
              {messages.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {messages.length}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setActivePanel(activePanel === 'translation' ? null : 'translation')}
              size="lg"
              className={`rounded-full w-12 h-12 ${activePanel === 'translation' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <Languages className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => setActivePanel(activePanel === 'documents' ? null : 'documents')}
              size="lg"
              className={`rounded-full w-12 h-12 relative ${activePanel === 'documents' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <Paperclip className="w-5 h-5" />
              {sharedDocuments.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {sharedDocuments.length}
                </Badge>
              )}
            </Button>

            {isSpecialist && (
              <>
                <Button
                  onClick={() => setActivePanel(activePanel === 'emr' ? null : 'emr')}
                  size="lg"
                  className={`rounded-full w-12 h-12 ${activePanel === 'emr' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <Shield className="w-5 h-5" />
                </Button>

                <Button
                  onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                  size="lg"
                  className={`rounded-full w-12 h-12 ${activePanel === 'notes' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <FileText className="w-5 h-5" />
                </Button>

                <Button
                  onClick={() => setActivePanel(activePanel === 'summary' ? null : 'summary')}
                  size="lg"
                  className={`rounded-full w-12 h-12 ${activePanel === 'summary' ? 'bg-violet-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <Brain className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Call ended */}
      {callStatus === 'ended' && (
        <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Consultation terminée</h2>
            <p className="text-gray-400">Durée : {formatDuration(callDuration)}</p>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {showFeedback && !isSpecialist && (
        <FeedbackConsultation
          rendezVous={rendezVous}
          onClose={() => {
            setShowFeedback(false);
            cleanup();
            setCallStatus('ended');
            setTimeout(() => onClose(), 1000);
          }}
          onSubmitSuccess={() => {}}
        />
      )}
    </div>
  );
}