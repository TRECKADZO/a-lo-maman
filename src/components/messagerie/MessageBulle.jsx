import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image as ImageIcon, File, Pill, AlertCircle, Loader2, Play, Pause, Volume2, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const typesFichiers = {
  'resultat_labo': { label: 'Résultat de laboratoire', icon: FileText, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'rapport_medical': { label: 'Rapport médical', icon: FileText, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'ordonnance': { label: 'Ordonnance', icon: Pill, color: 'bg-green-100 text-green-800 border-green-200' },
  'radio': { label: 'Radiographie', icon: ImageIcon, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'echographie': { label: 'Échographie', icon: ImageIcon, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  'vocal': { label: 'Message vocal', icon: Volume2, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'photo': { label: 'Photo', icon: ImageIcon, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  'document': { label: 'Document', icon: File, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  'autre': { label: 'Document', icon: File, color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function MessageBulle({ message, isCurrentUser, isSpecialist }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const audioRef = useRef(null);

  const hasAttachment = !!message.attachment_uri;
  const category = message.file_category || 'autre';
  const fileInfo = typesFichiers[category] || typesFichiers.autre;
  const FileIcon = fileInfo.icon;

  const isImage = message.attachment_type?.startsWith('image/');
  const isVocal = category === 'vocal' || message.attachment_type?.startsWith('audio/');
  const isVideo = message.attachment_type?.startsWith('video/');

  // Charger le média
  useEffect(() => {
    async function loadMedia() {
      if (!hasAttachment || (!isImage && !isVocal && !isVideo)) return;
      
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: message.attachment_uri,
          expires_in: 3600
        });
        setMediaUrl(signed_url);
      } catch (error) {
        console.error('Erreur lors du chargement du média:', error);
      }
    }

    loadMedia();
  }, [message.id, hasAttachment, isImage, isVocal, isVideo, message.attachment_uri]);

  // Gestion du lecteur audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [mediaUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: message.attachment_uri,
        expires_in: 300
      });
      
      const link = document.createElement('a');
      link.href = signed_url;
      link.download = message.attachment_name || 'fichier';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.error
              ? 'bg-red-100 border border-red-300 text-red-800'
              : isCurrentUser
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
        >
          {hasAttachment && (
            <div className={`mb-3 rounded-lg ${isCurrentUser ? 'bg-white/10' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
              {/* Images */}
              {isImage && mediaUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative group cursor-pointer overflow-hidden rounded-lg">
                      <img
                        src={mediaUrl}
                        alt={message.attachment_name}
                        className="w-full h-auto max-h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <img
                      src={mediaUrl}
                      alt={message.attachment_name}
                      className="w-full h-auto"
                    />
                  </DialogContent>
                </Dialog>
              )}

              {/* Vidéos */}
              {isVideo && mediaUrl && (
                <video
                  controls
                  className="w-full h-auto max-h-64 rounded-lg"
                  src={mediaUrl}
                >
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              )}

              {/* Lecteur audio amélioré */}
              {isVocal && mediaUrl && (
                <div className="p-4">
                  <audio ref={audioRef} src={mediaUrl} className="hidden" />
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handlePlayPause}
                      size="icon"
                      variant="ghost"
                      className={`flex-shrink-0 ${isCurrentUser ? 'text-white hover:bg-white/20' : 'text-purple-600 hover:bg-purple-50'}`}
                    >
                      {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className={`w-4 h-4 ${isCurrentUser ? 'text-white' : 'text-purple-600'}`} />
                        <span className={`text-xs font-medium ${isCurrentUser ? 'text-white' : 'text-purple-800'}`}>
                          Message vocal
                        </span>
                        <span className={`text-xs ml-auto ${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                        </span>
                      </div>
                      
                      {/* Barre de progression */}
                      <div className={`h-2 rounded-full ${isCurrentUser ? 'bg-white/30' : 'bg-purple-200'} overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full transition-all ${isCurrentUser ? 'bg-white' : 'bg-purple-600'}`} 
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      size="icon"
                      variant="ghost"
                      className={`flex-shrink-0 ${isCurrentUser ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Documents et autres fichiers */}
              {!isImage && !isVocal && !isVideo && (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCurrentUser ? 'bg-white/20' : 'bg-white dark:bg-gray-700'
                    }`}>
                      <FileIcon className={`w-5 h-5 ${isCurrentUser ? 'text-white' : fileInfo.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${isCurrentUser ? 'bg-white/20 text-white border-white/30' : fileInfo.color}`}>
                          {fileInfo.label}
                        </Badge>
                      </div>
                      <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {message.attachment_name}
                      </p>
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        size="sm"
                        variant="ghost"
                        className={`mt-2 h-8 ${isCurrentUser ? 'text-white hover:bg-white/20' : 'text-teal-600 hover:bg-teal-50'}`}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loader pendant le chargement */}
              {hasAttachment && !mediaUrl && (isImage || isVocal || isVideo) && (
                <div className="p-8 flex flex-col items-center justify-center">
                  <Loader2 className={`w-8 h-8 animate-spin mb-2 ${isCurrentUser ? 'text-white' : 'text-teal-600'}`} />
                  <p className={`text-sm ${isCurrentUser ? 'text-white/80' : 'text-gray-600'}`}>
                    Chargement en cours...
                  </p>
                </div>
              )}
            </div>
          )}

          {message.content && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          
          {message.error && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-700">
              <AlertCircle className="w-3 h-3" />
              <span>Échec d'envoi</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 px-2 ${
          isCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          <p className="text-xs text-gray-500">
            {message.created_date ? format(new Date(message.created_date), 'HH:mm', { locale: fr }) : 'Envoi...'}
          </p>
          {isCurrentUser && (
            <div className="flex items-center">
              {message.optimisticId ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : message.is_read ? (
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <div className="w-3 h-3 rounded-full bg-teal-500 -ml-1" />
                </div>
              ) : (
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <div className="w-3 h-3 rounded-full bg-gray-400 -ml-1" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}