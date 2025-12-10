import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Gestionnaire de mode offline avec synchronisation automatique
 */
export default function OfflineManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: pendingOperations = [] } = useQuery({
    queryKey: ['offline_queue', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.OfflineQueue.filter({
        user_email: user.email,
        status: 'pending'
      });
    },
    enabled: !!user,
    refetchInterval: isOnline ? 10000 : false,
  });

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Vous êtes hors ligne. Les modifications seront synchronisées plus tard.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      syncPendingOperations();
    }
  }, [isOnline, pendingOperations]);

  const syncMutation = useMutation({
    mutationFn: async (operation) => {
      const { entity_name, operation_type, entity_id, data } = operation;

      if (operation_type === 'create') {
        return await base44.entities[entity_name].create(data);
      } else if (operation_type === 'update') {
        return await base44.entities[entity_name].update(entity_id, data);
      } else if (operation_type === 'delete') {
        return await base44.entities[entity_name].delete(entity_id);
      }
    },
    onSuccess: async (result, operation) => {
      // Marquer comme synchronisé
      await base44.entities.OfflineQueue.update(operation.id, {
        status: 'synced',
        synced_at: new Date().toISOString()
      });

      // Invalider les queries concernées
      queryClient.invalidateQueries({ queryKey: [operation.entity_name] });
    },
    onError: async (error, operation) => {
      const newRetryCount = (operation.retry_count || 0) + 1;

      if (newRetryCount >= operation.max_retries) {
        await base44.entities.OfflineQueue.update(operation.id, {
          status: 'error',
          retry_count: newRetryCount,
          error_message: error.message
        });
        toast.error(`Échec synchronisation: ${operation.entity_name}`);
      } else {
        await base44.entities.OfflineQueue.update(operation.id, {
          retry_count: newRetryCount,
          error_message: error.message
        });
      }
    }
  });

  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    setSyncing(true);

    try {
      for (const operation of pendingOperations) {
        await syncMutation.mutateAsync(operation);
      }
      toast.success(`${pendingOperations.length} opération(s) synchronisée(s)`);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Helper pour sauvegarder en mode offline
  const saveOffline = async (entityName, operationType, data, entityId = null) => {
    if (!user) return;

    try {
      await base44.entities.OfflineQueue.create({
        user_email: user.email,
        operation_type: operationType,
        entity_name: entityName,
        entity_id: entityId,
        data: data,
        status: 'pending',
        created_offline_at: new Date().toISOString()
      });

      toast.success('Enregistré localement. Sera synchronisé à la reconnexion.');
    } catch (error) {
      console.error('Failed to save offline:', error);
      toast.error('Erreur lors de la sauvegarde locale');
    }
  };

  // Expose helper via window pour utilisation globale
  useEffect(() => {
    window.saveOffline = saveOffline;
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Hors ligne
          {pendingOperations.length > 0 && (
            <span>({pendingOperations.length} en attente)</span>
          )}
        </Badge>
      )}

      {isOnline && syncing && (
        <Badge className="flex items-center gap-2 bg-blue-600">
          <Upload className="w-4 h-4 animate-bounce" />
          Synchronisation...
        </Badge>
      )}

      {isOnline && pendingOperations.length > 0 && !syncing && (
        <Badge className="flex items-center gap-2 bg-orange-600">
          <Wifi className="w-4 h-4" />
          {pendingOperations.length} en attente de sync
        </Badge>
      )}
    </div>
  );
}