import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Monitor, 
  Smartphone, 
  CheckCircle, 
  X,
  Chrome,
  Globe
} from 'lucide-react';

export default function InstallPWADesktop() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [browserType, setBrowserType] = useState('chrome');

  useEffect(() => {
    // Détecter le type d'appareil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Détecter le navigateur
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;
    
    if (isEdge) setBrowserType('edge');
    else if (isChrome) setBrowserType('chrome');
    else if (isSafari) setBrowserType('safari');
    else setBrowserType('other');

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Écouter l'événement d'installation
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const instructions = {
    chrome: {
      desktop: [
        'Cliquez sur l\'icône "Installer" dans la barre d\'adresse (à droite)',
        'Ou Menu (⋮) → "Installer A\'lo Maman..."',
        'L\'application sera ajoutée à votre bureau et menu démarrer'
      ],
      mobile: [
        'Appuyez sur Menu (⋮) en haut à droite',
        'Sélectionnez "Installer l\'application"',
        'L\'icône sera ajoutée à votre écran d\'accueil'
      ]
    },
    edge: {
      desktop: [
        'Cliquez sur l\'icône "Installer" dans la barre d\'adresse',
        'Ou Menu (⋯) → "Applications" → "Installer ce site en tant qu\'application"',
        'L\'application sera épinglée à votre barre des tâches'
      ],
      mobile: [
        'Appuyez sur Menu (⋯) en bas',
        'Sélectionnez "Ajouter à l\'écran d\'accueil"'
      ]
    },
    safari: {
      mobile: [
        'Appuyez sur le bouton Partager (□↑) en bas',
        'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
        'Appuyez sur "Ajouter"'
      ]
    }
  };

  const currentInstructions = instructions[browserType]?.[deviceType] || [];

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Bannière d'installation pour desktop */}
      {deviceType === 'desktop' && !isInstalled && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <Card className="shadow-2xl border-2 border-teal-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Installer A'lo Maman</h3>
                    <p className="text-xs text-gray-600">Accès rapide depuis votre bureau</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsInstalled(true)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Lancement rapide
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Fonctionne hors ligne
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Notifications en temps réel
                </div>
              </div>

              <Button 
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Installer maintenant
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal d'instructions */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deviceType === 'desktop' ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              Installer A'lo Maman
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {browserType === 'chrome' && <Chrome className="w-8 h-8 text-blue-600" />}
                {browserType === 'edge' && <Globe className="w-8 h-8 text-blue-600" />}
                <div>
                  <p className="font-semibold">
                    {browserType === 'chrome' && 'Google Chrome'}
                    {browserType === 'edge' && 'Microsoft Edge'}
                    {browserType === 'safari' && 'Safari'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {deviceType === 'desktop' ? 'Ordinateur' : 'Mobile'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-900">Instructions :</p>
              {currentInstructions.length > 0 ? (
                <ol className="space-y-2">
                  {currentInstructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-gray-700">
                      <span className="font-bold text-teal-600">{idx + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-600">
                  Votre navigateur ne supporte pas l'installation PWA. Utilisez Chrome, Edge ou Safari.
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 Une fois installée, l'application fonctionnera comme une application native avec accès hors ligne et notifications.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}