import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, MoreVertical, PlusSquare, Smartphone, Download, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWA = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [os, setOs] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstallNatively, setCanInstallNatively] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true;
    const hasBeenDismissed = localStorage.getItem('pwa_install_dismissed');
    const lastDismissed = localStorage.getItem('pwa_install_dismissed_date');
    
    // Réafficher après 7 jours si l'utilisateur a cliqué "Plus tard"
    const shouldShowAgain = lastDismissed && 
      (Date.now() - parseInt(lastDismissed)) > 7 * 24 * 60 * 60 * 1000;

    if (isStandalone) return;
    if (hasBeenDismissed === 'permanent') return;
    if (hasBeenDismissed && !shouldShowAgain) return;

    // Écouter l'événement beforeinstallprompt (Chrome/Edge Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallNatively(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détecter l'OS et afficher après un délai
    const timer = setTimeout(() => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android/i.test(userAgent)) {
        setOs('android');
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setOs('ios');
      }
      setIsOpen(true);
    }, 8000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallNative = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_install_dismissed', 'permanent');
    }
    setDeferredPrompt(null);
    setIsOpen(false);
  };

  const handleDismissLater = () => {
    localStorage.setItem('pwa_install_dismissed', 'later');
    localStorage.setItem('pwa_install_dismissed_date', Date.now().toString());
    setIsOpen(false);
  };

  const handleDismissPermanent = () => {
    localStorage.setItem('pwa_install_dismissed', 'permanent');
    setIsOpen(false);
  };

  if (!os) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-[100] p-3 pb-safe"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-pink-100 overflow-hidden max-w-md mx-auto">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white relative">
              <button
                onClick={handleDismissLater}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Installer A'lo Maman</h3>
                  <p className="text-sm text-white/90">Accès rapide depuis votre écran</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              {/* Installation native disponible (Chrome Android) */}
              {canInstallNatively && os === 'android' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Installez l'application pour un accès plus rapide et des notifications en temps réel.
                  </p>
                  <Button
                    onClick={handleInstallNative}
                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Installer maintenant
                  </Button>
                </div>
              )}

              {/* Instructions iOS */}
              {os === 'ios' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Share className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Étape 1</p>
                      <p className="text-gray-600">Appuyez sur <strong>Partager</strong> en bas de Safari</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlusSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Étape 2</p>
                      <p className="text-gray-600">Choisissez <strong>"Sur l'écran d'accueil"</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions Android (sans prompt natif) */}
              {os === 'android' && !canInstallNatively && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MoreVertical className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Étape 1</p>
                      <p className="text-gray-600">Appuyez sur le menu <strong>⋮</strong> en haut</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Étape 2</p>
                      <p className="text-gray-600">Choisissez <strong>"Installer l'application"</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissLater}
                  className="flex-1 text-gray-500 hover:text-gray-700"
                >
                  Plus tard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissPermanent}
                  className="flex-1 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Ne plus afficher
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;