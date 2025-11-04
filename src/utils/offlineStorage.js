// Offline storage utilities for caching data
class OfflineStorage {
  constructor() {
    this.storageKey = 'farmtech-offline-data';
    this.queueKey = 'farmtech-offline-queue';
  }

  // Cache data with timestamp and TTL
  setCache(key, data, ttlMinutes = 60) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
        version: '1.0'
      };
      
      const existingCache = this.getCache() || {};
      existingCache[key] = cacheData;
      
      localStorage.setItem(this.storageKey, JSON.stringify(existingCache));
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Get cached data if not expired
  getCache(key = null) {
    try {
      const cacheString = localStorage.getItem(this.storageKey);
      if (!cacheString) return null;
      
      const cache = JSON.parse(cacheString);
      
      if (key) {
        const item = cache[key];
        if (!item) return null;
        
        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
          this.removeCache(key);
          return null;
        }
        
        return item.data;
      }
      
      return cache;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Remove specific cache item
  removeCache(key) {
    try {
      const cache = this.getCache() || {};
      delete cache[key];
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('Error removing cache:', error);
      return false;
    }
  }

  // Clear all cache
  clearCache() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Add operation to offline queue
  addToQueue(operation) {
    try {
      const queue = this.getQueue();
      const queueItem = {
        id: Date.now().toString(),
        ...operation,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      queue.push(queueItem);
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
      return queueItem.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return null;
    }
  }

  // Get offline queue
  getQueue() {
    try {
      const queueString = localStorage.getItem(this.queueKey);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  // Remove item from queue
  removeFromQueue(id) {
    try {
      const queue = this.getQueue();
      const filteredQueue = queue.filter(item => item.id !== id);
      localStorage.setItem(this.queueKey, JSON.stringify(filteredQueue));
      return true;
    } catch (error) {
      console.error('Error removing from queue:', error);
      return false;
    }
  }

  // Clear offline queue
  clearQueue() {
    try {
      localStorage.removeItem(this.queueKey);
      return true;
    } catch (error) {
      console.error('Error clearing queue:', error);
      return false;
    }
  }

  // Update retry count for queue item
  updateRetryCount(id) {
    try {
      const queue = this.getQueue();
      const item = queue.find(item => item.id === id);
      if (item) {
        item.retryCount += 1;
        localStorage.setItem(this.queueKey, JSON.stringify(queue));
      }
      return true;
    } catch (error) {
      console.error('Error updating retry count:', error);
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorage();