import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  Mic,
  Volume2,
  Wifi,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Camera,
  RefreshCw
} from 'lucide-react';

export default function VideoQualityTest({ onTestComplete, onClose }) {
  const [testStatus, setTestStatus] = useState('init');
  const [results, setResults] = useState({
    camera: null,
    microphone: null,
    speakers: null,
    bandwidth: null,
    overall: null
  });
  const [testing, setTesting] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setResults(prev => ({ ...prev, camera: 'success' }));
      return true;
    } catch (error) {
      console.error('Camera test failed:', error);
      setResults(prev => ({ ...prev, camera: 'error' }));
      return false;
    }
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      return new Promise((resolve) => {
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          if (average > 10) {
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            setResults(prev => ({ ...prev, microphone: 'success' }));
            resolve(true);
          } else {
            setTimeout(checkAudio, 100);
          }
        };
        
        checkAudio();
        
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setResults(prev => ({ ...prev, microphone: 'warning' }));
          resolve(true);
        }, 3000);
      });
    } catch (error) {
      console.error('Microphone test failed:', error);
      setResults(prev => ({ ...prev, microphone: 'error' }));
      return false;
    }
  };

  const testBandwidth = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
        cache: 'no-store'
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration < 1000) {
        setResults(prev => ({ ...prev, bandwidth: 'success' }));
      } else if (duration < 3000) {
        setResults(prev => ({ ...prev, bandwidth: 'warning' }));
      } else {
        setResults(prev => ({ ...prev, bandwidth: 'error' }));
      }
      
      return true;
    } catch (error) {
      console.error('Bandwidth test failed:', error);
      setResults(prev => ({ ...prev, bandwidth: 'error' }));
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestStatus('testing');
    
    await testCamera();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testMicrophone();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testBandwidth();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setResults(prev => ({ ...prev, speakers: 'success' }));
    
    const overallStatus = Object.values(results).every(r => r === 'success') ? 'success' :
                         Object.values(results).some(r => r === 'error') ? 'warning' : 'success';
    
    setResults(prev => ({ ...prev, overall: overallStatus }));
    setTestStatus('complete');
    setTesting(false);
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (status === 'error') return <X className="w-5 h-5 text-red-600" />;
    return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
  };

  const getStatusColor = (status) => {
    if (status === 'success') return 'bg-green-50 border-green-200';
    if (status === 'warning') return 'bg-yellow-50 border-yellow-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-600" />
              Test de qualité vidéo
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Aperçu vidéo */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Tests */}
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(results.camera)}`}>
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5" />
                <span className="font-medium">Caméra</span>
              </div>
              {getStatusIcon(results.camera)}
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(results.microphone)}`}>
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5" />
                <span className="font-medium">Microphone</span>
              </div>
              {getStatusIcon(results.microphone)}
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(results.speakers)}`}>
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5" />
                <span className="font-medium">Haut-parleurs</span>
              </div>
              {getStatusIcon(results.speakers)}
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(results.bandwidth)}`}>
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5" />
                <span className="font-medium">Connexion Internet</span>
              </div>
              {getStatusIcon(results.bandwidth)}
            </div>
          </div>

          {/* Messages */}
          {testStatus === 'complete' && (
            <Alert className={results.overall === 'success' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
              <AlertDescription className={results.overall === 'success' ? 'text-green-800' : 'text-yellow-800'}>
                {results.overall === 'success' ? (
                  <>
                    <strong>✅ Tout est prêt !</strong> Votre équipement fonctionne correctement pour la vidéoconsultation.
                  </>
                ) : (
                  <>
                    <strong>⚠️ Attention :</strong> Certains éléments nécessitent votre attention. Vous pouvez continuer mais la qualité peut être affectée.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {testStatus === 'init' && (
              <Button 
                onClick={runAllTests}
                disabled={testing}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Lancer le test
                  </>
                )}
              </Button>
            )}

            {testStatus === 'complete' && (
              <>
                <Button 
                  onClick={runAllTests}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retester
                </Button>
                <Button 
                  onClick={() => onTestComplete(results)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continuer
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}