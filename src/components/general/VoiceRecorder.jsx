import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, X, Send, Loader2 } from 'lucide-react';

export default function VoiceRecorder({ onSend, onCancel, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleSend = async () => {
    if (!audioBlob || isSending) return;
    
    setIsSending(true);
    try {
      // Créer un fichier à partir du blob
      const fileName = `vocal_${Date.now()}.webm`;
      const file = new File([audioBlob], fileName, { type: audioBlob.type });
      
      await onSend(file);
      
      // Reset après envoi réussi
      deleteRecording();
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Erreur lors de l\'envoi du message vocal');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
      <div className="flex flex-col gap-3">
        {/* Timer et statut */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecording && !isPaused && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
            <span className="font-mono text-lg font-semibold text-gray-700 dark:text-gray-300">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          {(isRecording || audioURL) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={audioURL ? deleteRecording : onCancel}
              className="text-gray-500 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Contrôles d'enregistrement */}
        {!audioURL && (
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 px-8 rounded-full shadow-lg"
              >
                <Mic className="w-6 h-6 mr-2" />
                Commencer l'enregistrement
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    variant="outline"
                    onClick={pauseRecording}
                    className="h-12 px-6 rounded-full"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={resumeRecording}
                    className="bg-purple-600 hover:bg-purple-700 h-12 px-6 rounded-full"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Reprendre
                  </Button>
                )}
                
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="h-12 w-12 rounded-full"
                >
                  <Square className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Lecteur audio et contrôles d'envoi */}
        {audioURL && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayback}
                className="rounded-full"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <audio
                ref={audioRef}
                src={audioURL}
                onEnded={() => setIsPlaying(false)}
                className="flex-1"
                controls
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={deleteRecording}
                className="flex-1"
                disabled={isSending}
              >
                <X className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={isSending || disabled}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Aide */}
        {!isRecording && !audioURL && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            💡 Appuyez sur le bouton pour commencer à enregistrer votre message vocal
          </p>
        )}
      </div>
    </div>
  );
}