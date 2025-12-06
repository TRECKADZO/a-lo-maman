// Service WebRTC pour la signalisation et la connexion peer-to-peer
import { base44 } from '@/api/base44Client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCService {
  constructor(roomId, userEmail, onRemoteStream, onConnectionStateChange) {
    this.roomId = roomId;
    this.userEmail = userEmail;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.peerConnection = null;
    this.localStream = null;
    this.pollingInterval = null;
    this.lastProcessedSignalId = null;
    this.isInitiator = false;
    this.iceCandidatesQueue = [];
  }

  async initialize(isInitiator = false) {
    this.isInitiator = isInitiator;
    
    // Créer la connexion peer
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Gérer les ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('ice-candidate', JSON.stringify(event.candidate));
      }
    };

    // Gérer le stream distant
    this.peerConnection.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Gérer les changements d'état
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE state:', this.peerConnection.iceConnectionState);
    };

    // Démarrer le polling pour les signaux
    this.startPolling();

    // Signaler la présence
    await this.sendSignal('join', JSON.stringify({ timestamp: Date.now() }));

    return this.peerConnection;
  }

  async getLocalStream(videoEnabled = true, audioEnabled = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      // Ajouter les tracks au peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      return this.localStream;
    } catch (error) {
      console.error('Erreur accès média:', error);
      throw error;
    }
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    await this.sendSignal('offer', JSON.stringify(offer));
    return offer;
  }

  async handleOffer(offer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Traiter les ICE candidates en attente
    await this.processQueuedCandidates();
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await this.sendSignal('answer', JSON.stringify(answer));
    return answer;
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    // Traiter les ICE candidates en attente
    await this.processQueuedCandidates();
  }

  async handleIceCandidate(candidate) {
    if (this.peerConnection.remoteDescription) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      // Mettre en file d'attente si pas encore de description distante
      this.iceCandidatesQueue.push(candidate);
    }
  }

  async processQueuedCandidates() {
    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async sendSignal(type, payload) {
    try {
      await base44.entities.SignalWebRTC.create({
        room_id: this.roomId,
        sender_email: this.userEmail,
        type: type,
        payload: payload,
        processed: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Expire dans 5 min
      });
    } catch (error) {
      console.error('Erreur envoi signal:', error);
    }
  }

  startPolling() {
    this.pollingInterval = setInterval(() => this.pollSignals(), 1000);
  }

  async pollSignals() {
    try {
      const signals = await base44.entities.SignalWebRTC.filter({
        room_id: this.roomId,
        processed: false
      }, '-created_date', 20);

      for (const signal of signals) {
        // Ignorer ses propres signaux
        if (signal.sender_email === this.userEmail) continue;
        
        // Ignorer les signaux déjà traités
        if (this.lastProcessedSignalId && signal.id <= this.lastProcessedSignalId) continue;

        await this.processSignal(signal);
        
        // Marquer comme traité
        await base44.entities.SignalWebRTC.update(signal.id, { processed: true });
        this.lastProcessedSignalId = signal.id;
      }
    } catch (error) {
      console.error('Erreur polling:', error);
    }
  }

  async processSignal(signal) {
    const payload = signal.payload ? JSON.parse(signal.payload) : null;

    switch (signal.type) {
      case 'join':
        // Un participant a rejoint - si on est initiateur, créer l'offre
        if (this.isInitiator && this.localStream) {
          await this.createOffer();
        }
        break;

      case 'offer':
        await this.handleOffer(payload);
        break;

      case 'answer':
        await this.handleAnswer(payload);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(payload);
        break;

      case 'leave':
      case 'call-ended':
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange('disconnected');
        }
        break;
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async endCall() {
    await this.sendSignal('call-ended', JSON.stringify({ timestamp: Date.now() }));
    this.cleanup();
  }

  cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export default WebRTCService;