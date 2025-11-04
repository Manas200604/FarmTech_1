import { useEffect, useState } from 'react';
import { useNetworkContext } from '../contexts/NetworkContext';
import { offlineStorage } from '../utils/offlineStorage';
import { supabase } from '../supabase/client';
import { toast } from 'react-hot-toast';

const useOfflineSync = () => {
  const { isOnline } = useNetworkContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      processOfflineQueue();
    }
  }, [isOnline, isSyncing]);

  const processOfflineQueue = async () => {
    const queue = offlineStorage.getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    
    let successCount = 0;
    let errorCount = 0;

    for (const item of queue) {
      try {
        await processQueueItem(item);
        offlineStorage.removeFromQueue(item.id);
        successCount++;
      } catch (error) {
        console.error('Error processing queue item:', error);
        offlineStorage.updateRetryCount(item.id);
        errorCount++;
        
        // Remove items that have failed too many times
        if (item.retryCount >= 3) {
          offlineStorage.removeFromQueue(item.id);
        }
      }
    }

    setIsSyncing(false);
    
    if (successCount > 0) {
      setSyncStatus('success');
      toast.success(`Synced ${successCount} offline changes`, {
        icon: '🔄'
      });
    }
    
    if (errorCount > 0) {
      setSyncStatus('error');
      toast.error(`Failed to sync ${errorCount} changes`, {
        icon: '⚠️'
      });
    }

    // Reset status after a delay
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const processQueueItem = async (item) => {
    const { action, table, data } = item;
    
    switch (action) {
      case 'create':
        await supabase.from(table).insert(data);
        break;
      case 'update':
        await supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from(table).delete().eq('id', data.id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  const addOfflineOperation = (action, table, data) => {
    if (isOnline) {
      // If online, execute immediately
      return processQueueItem({ action, table, data });
    } else {
      // If offline, add to queue
      const id = offlineStorage.addToQueue({ action, table, data });
      toast.info('Saved offline - will sync when connected', {
        icon: '💾'
      });
      return Promise.resolve(id);
    }
  };

  return {
    isSyncing,
    syncStatus,
    addOfflineOperation,
    processOfflineQueue
  };
};

export default useOfflineSync;