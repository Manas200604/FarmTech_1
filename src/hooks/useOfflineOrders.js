import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import orderStorage from '../utils/orderStorage';

const OFFLINE_ORDERS_KEY = 'farmtech_offline_orders';
const OFFLINE_DRAFTS_KEY = 'farmtech_order_drafts';

export const useOfflineOrders = () => {
  const { userProfile } = useAuth();
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [orderDrafts, setOrderDrafts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && offlineOrders.length > 0) {
      syncOfflineOrders();
    }
  }, [isOnline]);

  const loadOfflineData = useCallback(() => {
    try {
      const savedOfflineOrders = localStorage.getItem(OFFLINE_ORDERS_KEY);
      const savedDrafts = localStorage.getItem(OFFLINE_DRAFTS_KEY);

      if (savedOfflineOrders) {
        setOfflineOrders(JSON.parse(savedOfflineOrders));
      }

      if (savedDrafts) {
        setOrderDrafts(JSON.parse(savedDrafts));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  const saveOfflineOrder = useCallback((orderData) => {
    const offlineOrder = {
      ...orderData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isOffline: true,
      createdAt: new Date().toISOString(),
      farmerId: userProfile?.id
    };

    const updatedOfflineOrders = [...offlineOrders, offlineOrder];
    setOfflineOrders(updatedOfflineOrders);
    
    try {
      localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updatedOfflineOrders));
      return offlineOrder;
    } catch (error) {
      console.error('Error saving offline order:', error);
      throw error;
    }
  }, [offlineOrders, userProfile]);

  const saveDraft = useCallback((draftData) => {
    const draft = {
      ...draftData,
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isDraft: true,
      savedAt: new Date().toISOString(),
      farmerId: userProfile?.id
    };

    const updatedDrafts = [...orderDrafts, draft];
    setOrderDrafts(updatedDrafts);
    
    try {
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      return draft;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }, [orderDrafts, userProfile]);

  const updateDraft = useCallback((draftId, updatedData) => {
    const updatedDrafts = orderDrafts.map(draft =>
      draft.id === draftId
        ? { ...draft, ...updatedData, savedAt: new Date().toISOString() }
        : draft
    );

    setOrderDrafts(updatedDrafts);
    
    try {
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }, [orderDrafts]);

  const deleteDraft = useCallback((draftId) => {
    const updatedDrafts = orderDrafts.filter(draft => draft.id !== draftId);
    setOrderDrafts(updatedDrafts);
    
    try {
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [orderDrafts]);

  const syncOfflineOrders = useCallback(async () => {
    if (!isOnline || offlineOrders.length === 0 || syncInProgress) {
      return { success: false, message: 'No sync needed or already in progress' };
    }

    setSyncInProgress(true);
    const results = {
      successful: [],
      failed: []
    };

    try {
      for (const offlineOrder of offlineOrders) {
        try {
          // Remove offline-specific fields
          const { isOffline, ...orderData } = offlineOrder;
          
          // Create the order online
          const onlineOrder = await orderStorage.createOrder(orderData);
          results.successful.push({
            offlineId: offlineOrder.id,
            onlineId: onlineOrder.id
          });
        } catch (error) {
          console.error(`Failed to sync order ${offlineOrder.id}:`, error);
          results.failed.push({
            offlineId: offlineOrder.id,
            error: error.message
          });
        }
      }

      // Remove successfully synced orders
      if (results.successful.length > 0) {
        const syncedIds = results.successful.map(r => r.offlineId);
        const remainingOrders = offlineOrders.filter(order => !syncedIds.includes(order.id));
        
        setOfflineOrders(remainingOrders);
        localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remainingOrders));
      }

      return {
        success: true,
        synced: results.successful.length,
        failed: results.failed.length,
        results
      };
    } catch (error) {
      console.error('Error during sync:', error);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, offlineOrders, syncInProgress]);

  const clearOfflineData = useCallback(() => {
    setOfflineOrders([]);
    setOrderDrafts([]);
    localStorage.removeItem(OFFLINE_ORDERS_KEY);
    localStorage.removeItem(OFFLINE_DRAFTS_KEY);
  }, []);

  const getOfflineOrdersCount = useCallback(() => {
    return offlineOrders.length;
  }, [offlineOrders]);

  const getDraftsCount = useCallback(() => {
    return orderDrafts.length;
  }, [orderDrafts]);

  const createOrder = useCallback(async (orderData) => {
    if (isOnline) {
      try {
        return await orderStorage.createOrder(orderData);
      } catch (error) {
        // If online creation fails, save offline
        console.warn('Online order creation failed, saving offline:', error);
        return saveOfflineOrder(orderData);
      }
    } else {
      // Save offline when not connected
      return saveOfflineOrder(orderData);
    }
  }, [isOnline, saveOfflineOrder]);

  return {
    // State
    isOnline,
    offlineOrders,
    orderDrafts,
    syncInProgress,
    
    // Counts
    offlineOrdersCount: getOfflineOrdersCount(),
    draftsCount: getDraftsCount(),
    
    // Order operations
    createOrder,
    saveOfflineOrder,
    
    // Draft operations
    saveDraft,
    updateDraft,
    deleteDraft,
    
    // Sync operations
    syncOfflineOrders,
    clearOfflineData,
    
    // Utilities
    loadOfflineData
  };
};