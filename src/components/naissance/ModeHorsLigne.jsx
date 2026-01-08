import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ModeHorsLigne() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedDeclarations, setQueuedDeclarations] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
      syncQueuedDeclarations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Vous êtes hors-ligne. Les données seront sauvegardées localement.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Charger les déclarations en attente au démarrage
    const stored = localStorage.getItem('declarations_offline_queue');
    if (stored) {
      setQueuedDeclarations(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncMutation = useMutation({
    mutationFn: async (declaration) => {
      const result = await base44.entities.DeclarationNaissance.create(declaration);
      return result;
    },
    onSuccess: (result, variables) => {
      // Retirer de la queue
      const updatedQueue = queuedDeclarations.filter(d => d.tempId !== variables.tempId);
      setQueuedDeclarations(updatedQueue);
      localStorage.setItem('declarations_offline_queue', JSON.stringify(updatedQueue));
      
      queryClient.invalidateQueries(['declarations_naissance']);
      toast.success('Déclaration synchronisée avec succès');
    },
    onError: () => {
      toast.error('Erreur de synchronisation. Réessayez plus tard.');
    },
  });

  const syncQueuedDeclarations = async () => {
    if (queuedDeclarations.length === 0) return;

    for (const declaration of queuedDeclarations) {
      await syncMutation.mutateAsync(declaration);
    }
  };

  // Fonction pour sauvegarder une déclaration hors-ligne
  const saveOfflineDeclaration = (declarationData) => {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const declaration = {
      ...declarationData,
      tempId,
      savedAt: new Date().toISOString(),
      status: 'offline'
    };

    const updated = [...queuedDeclarations, declaration];
    setQueuedDeclarations(updated);
    localStorage.setItem('declarations_offline_queue', JSON.stringify(updated));
    
    toast.success('Déclaration sauvegardée hors-ligne. Elle sera envoyée dès la reconnexion.');
    
    return declaration;
  };

  // Expose la fonction globalement pour utilisation dans le formulaire
  React.useEffect(() => {
    window.saveOfflineDeclaration = saveOfflineDeclaration;
  }, [queuedDeclarations]);

  if (!isOnline || queuedDeclarations.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        {!isOnline && (
          <Badge className="bg-orange-500 text-white flex items-center gap-2 px-3 py-2">
            <WifiOff className="w-4 h-4" />
            Hors-ligne
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-2xl border-2 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {queuedDeclarations.length} déclaration(s) en attente
              </h4>
              <p className="text-xs text-gray-600">
                Synchronisation disponible
              </p>
            </div>
          </div>

          <Button
            onClick={syncQueuedDeclarations}
            disabled={syncMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {syncMutation.isPending ? (
              'Synchronisation...'
            ) : (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Synchroniser maintenant
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Export de la fonction utilitaire
export const useOfflineDeclaration = () => {
  const isOnline = navigator.onLine;
  
  const saveDeclaration = (data) => {
    if (typeof window.saveOfflineDeclaration === 'function') {
      return window.saveOfflineDeclaration(data);
    }
    throw new Error('Mode hors-ligne non initialisé');
  };

  return { isOnline, saveDeclaration };
};