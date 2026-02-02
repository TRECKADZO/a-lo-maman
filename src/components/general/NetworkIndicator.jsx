import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Détection du type de connexion
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        const updateConnection = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        connection.addEventListener('change', updateConnection);
        return () => {
          connection.removeEventListener('change', updateConnection);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:w-auto">
        <Alert className="bg-red-50 border-red-300 shadow-lg">
          <WifiOff className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-900 font-medium">
            Hors ligne - Certaines fonctionnalités sont limitées
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (connectionType === 'slow-2g' || connectionType === '2g') {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:w-auto">
        <Alert className="bg-orange-50 border-orange-300 shadow-lg">
          <Signal className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-900 text-sm">
            Connexion lente - Mode optimisé activé
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}