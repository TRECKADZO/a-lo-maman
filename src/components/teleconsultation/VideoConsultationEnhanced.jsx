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
  Users,
  X,
  Camera,
  Settings,
  Info,
  FileText,
  Upload,
  Volume2,
  VolumeX,
  Send,
  Download,
  File,
  Image as ImageIcon,
  Paperclip,
  CheckCircle,
  Stethoscope,
  Pill,
  ClipboardList,
  Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FeedbackConsultation from './FeedbackConsultation';

export default function VideoConsultationEnhanced({ 
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
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'notes', 'documents', 'summary'
  const [consultationNotes, setConsultationNotes] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Documents partagés
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Résumé post-consultation
  const [summaryData, setSummaryData] = useState({
    diagnostic: '',
    prescription: '',
    examens_prescrits: '',
    recommandations: '',
    prochain_rdv: '',
    duree_traitement: ''
  });
  
  // Références
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeCall = async () => {
    try {
      await enumerateDevices();
      await requestMediaAccess();
      
      // Simuler la connexion
      setTimeout(() => {
        setCallStatus('connected');
        const now = new Date();
        setStartTime(now);
        startTimer();
        
        // Message de bienvenue automatique
        addSystemMessage(`Consultation commencée à ${format(now, 'HH:mm', { locale: fr })}`);
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
        const videoTrack = stream.getVideoTracks()[0];
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          requestMediaAccess();
        };
        
        setIsScreenSharing(true);
        addSystemMessage('Partage d\'écran activé');
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsScreenSharing(false);
        requestMediaAccess();
        addSystemMessage('Partage d\'écran arrêté');
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
      alert('Impossible de partager l\'écran');
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

  const uploadDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const doc = {
        id: Date.now(),
        name: file.name,
        url: file_url,
        type: file.type,
        size: file.size,
        uploadedBy: isSpecialist ? 'Spécialiste' : 'Patient',
        timestamp: new Date()
      };
      
      setSharedDocuments(prev => [...prev, doc]);
      addSystemMessage(`Document partagé : ${file.name}`);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors du téléchargement du document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const endCall = async () => {
    try {
      setCallStatus('ending');
      
      // Préparer le résumé
      if (isSpecialist) {
        setActivePanel('summary');
        return; // Attendre que le spécialiste remplisse le résumé
      }
      
      finalizeCall();
    } catch (error) {
      console.error('Erreur fin d\'appel:', error);
      onClose();
    }
  };

  const finalizeCall = async () => {
    try {
      // Sauvegarder les données
      if (isSpecialist) {
        const summaryText = `
RÉSUMÉ DE CONSULTATION
Date : ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
Durée : ${formatDuration(callDuration)}
Patient : ${participantName}

DIAGNOSTIC :
${summaryData.diagnostic || 'Non renseigné'}

PRESCRIPTION :
${summaryData.prescription || 'Aucune'}

EXAMENS PRESCRITS :
${summaryData.examens_prescrits || 'Aucun'}

RECOMMANDATIONS :
${summaryData.recommandations || 'Aucune'}

PROCHAIN RDV :
${summaryData.prochain_rdv || 'À définir'}

DURÉE TRAITEMENT :
${summaryData.duree_traitement || 'Non applicable'}

NOTES COMPLÉMENTAIRES :
${consultationNotes}

DOCUMENTS PARTAGÉS : ${sharedDocuments.length}
        `.trim();

        await base44.entities.RendezVous.update(rendezVous.id, {
          statut: 'termine',
          notes_professionnel: summaryText
        });

        // Envoyer le résumé au patient
        await base44.entities.Notification.create({
          destinataire_email: participantEmail,
          type: 'rendez_vous_confirmation',
          titre: 'Résumé de consultation disponible',
          message: 'Votre médecin a partagé le résumé de votre consultation.',
          action_page: 'Teleconsultation',
          priorite: 'haute',
          icone: 'FileText'
        });
      } else {
        // Patient : proposer le feedback
        setShowFeedback(true);
        return; // Ne pas fermer tout de suite
      }
      
      cleanup();
      setCallStatus('ended');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erreur finalisation:', error);
      onClose();
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min ${secs}s`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const renderPanel = () => {
    if (!activePanel) return null;

    switch (activePanel) {
      case 'chat':
        return (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`
                  ${msg.type === 'system' ? 'text-center' : ''}
                  ${msg.type === 'sent' ? 'text-right' : 'text-left'}
                `}>
                  {msg.type === 'system' ? (
                    <p className="text-xs text-gray-400 italic">{msg.content}</p>
                  ) : (
                    <div className={`inline-block ${msg.type === 'sent' ? 'bg-teal-600' : 'bg-gray-700'} rounded-lg px-3 py-2 max-w-[80%]`}>
                      <p className="text-xs text-gray-300 mb-1">{msg.sender}</p>
                      <p className="text-sm text-white">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(msg.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Tapez un message..."
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Button onClick={sendChatMessage} className="bg-teal-600 hover:bg-teal-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes de consultation
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Prenez vos notes ici...&#10;&#10;Symptômes observés, diagnostic préliminaire, recommandations..."
                className="w-full h-full bg-gray-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[400px]"
              />
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Documents partagés
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {sharedDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-700 rounded-lg flex items-start gap-3 hover:bg-gray-650 transition-colors">
                    <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(doc.size)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Par {doc.uploadedBy} • {format(doc.timestamp, 'HH:mm')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="flex-shrink-0"
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ))}
                
                {sharedDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <File className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun document partagé</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <input
                type="file"
                id="doc-upload"
                onChange={uploadDocument}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="doc-upload">
                <Button
                  as="span"
                  disabled={uploadingDoc}
                  className="w-full bg-teal-600 hover:bg-teal-700 cursor-pointer"
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Partager un document
                    </>
                  )}
                </Button>
              </label>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Résumé de consultation
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Remplissez le résumé avant de terminer
              </p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  <Stethoscope className="w-3 h-3 inline mr-1" />
                  Diagnostic
                </label>
                <Textarea
                  value={summaryData.diagnostic}
                  onChange={(e) => setSummaryData({...summaryData, diagnostic: e.target.value})}
                  placeholder="Diagnostic posé..."
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  <Pill className="w-3 h-3 inline mr-1" />
                  Prescription médicamenteuse
                </label>
                <Textarea
                  value={summaryData.prescription}
                  onChange={(e) => setSummaryData({...summaryData, prescription: e.target.value})}
                  placeholder="Médicaments prescrits..."
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Examens complémentaires
                </label>
                <Textarea
                  value={summaryData.examens_prescrits}
                  onChange={(e) => setSummaryData({...summaryData, examens_prescrits: e.target.value})}
                  placeholder="Examens à réaliser..."
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Recommandations
                </label>
                <Textarea
                  value={summaryData.recommandations}
                  onChange={(e) => setSummaryData({...summaryData, recommandations: e.target.value})}
                  placeholder="Conseils et recommandations..."
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Prochain rendez-vous
                </label>
                <Input
                  type="text"
                  value={summaryData.prochain_rdv}
                  onChange={(e) => setSummaryData({...summaryData, prochain_rdv: e.target.value})}
                  placeholder="Ex: Dans 2 semaines"
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Durée du traitement
                </label>
                <Input
                  type="text"
                  value={summaryData.duree_traitement}
                  onChange={(e) => setSummaryData({...summaryData, duree_traitement: e.target.value})}
                  placeholder="Ex: 7 jours"
                  className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700 space-y-2">
              <Button
                onClick={finalizeCall}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Enregistrer et terminer
              </Button>
              <Button
                onClick={() => setActivePanel(null)}
                variant="outline"
                className="w-full"
              >
                Continuer la consultation
              </Button>
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{participantName || participantEmail}</h3>
              <div className="flex items-center gap-2">
                {callStatus === 'connected' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
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
        {/* Main Video */}
        <div className={`${activePanel ? 'w-2/3' : 'w-full'} h-full flex items-center justify-center bg-gray-800 relative transition-all`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <Users className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-white text-xl font-semibold mb-2">
                {callStatus === 'initializing' && 'Initialisation...'}
                {callStatus === 'connecting' && 'Connexion en cours...'}
                {callStatus === 'ending' && 'Finalisation...'}
                {callStatus === 'ended' && 'Consultation terminée'}
              </p>
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
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
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-lg rounded-xl px-4 py-3 border border-gray-700 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-white text-sm font-semibold">Téléconsultation sécurisée</p>
            </div>
            <p className="text-gray-300 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" />
              Chiffrement de bout en bout
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
                Partage d'écran
              </Badge>
            )}
          </div>
        </div>

        {/* Side Panel */}
        {renderPanel()}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Media controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`rounded-full w-14 h-14 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>

              <Button
                onClick={toggleVideo}
                size="lg"
                className={`rounded-full w-14 h-14 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>

              <Button
                onClick={toggleScreenShare}
                size="lg"
                className={`rounded-full w-14 h-14 ${isScreenSharing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              </Button>
            </div>

            {/* End Call */}
            <Button
              onClick={endCall}
              size="lg"
              className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </Button>

            {/* Feature controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
                size="lg"
                className={`rounded-full w-14 h-14 ${activePanel === 'chat' ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <MessageSquare className="w-6 h-6" />
              </Button>

              {isSpecialist && (
                <>
                  <Button
                    onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                    size="lg"
                    className={`rounded-full w-14 h-14 ${activePanel === 'notes' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <FileText className="w-6 h-6" />
                  </Button>
                  
                  <Button
                    onClick={() => setActivePanel(activePanel === 'summary' ? null : 'summary')}
                    size="lg"
                    className={`rounded-full w-14 h-14 ${activePanel === 'summary' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <ClipboardList className="w-6 h-6" />
                  </Button>
                </>
              )}

              <Button
                onClick={() => setActivePanel(activePanel === 'documents' ? null : 'documents')}
                size="lg"
                className={`rounded-full w-14 h-14 ${activePanel === 'documents' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Paperclip className="w-6 h-6" />
                {sharedDocuments.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {sharedDocuments.length}
                  </Badge>
                )}
              </Button>

              <Button
                onClick={() => setIsRemoteAudioEnabled(!isRemoteAudioEnabled)}
                size="lg"
                className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
              >
                {isRemoteAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Call ended overlay */}
      {callStatus === 'ended' && (
        <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Consultation terminée</h2>
            <p className="text-gray-400 mb-4">Durée : {formatDuration(callDuration)}</p>
            {isSpecialist && (
              <Badge className="bg-green-100 text-green-800">
                ✓ Résumé enregistré et envoyé
              </Badge>
            )}
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
          onSubmitSuccess={() => {
            // Feedback envoyé
          }}
        />
      )}
    </div>
  );
}