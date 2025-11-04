import { useEffect, useCallback } from 'react';
import { useImageOptimization } from '../../hooks/useImageOptimization.jsx';
import { useMaterialsCache } from '../../hooks/useMaterialsCache';
import { performanceMonitor, memoryManager, storageOptimizer } from '../../utils/performanceOptimization';

export const StorePerformanceOptimizer = ({ children }) => {
  const { preloadImages, clearImageCache } = useImageOptimization();
  const { materials } = useMaterialsCache();

  // Preload critical images when materials are loaded
  useEffect(() => {
    if (materials.length > 0) {
      const criticalImages = materials
        .slice(0, 10) // First 10 materials
        .map(material => material.imageUrl)
        .filter(Boolean);
      
      if (criticalImages.length > 0) {
        preloadImages(criticalImages).catch(console.error);
      }
    }
  }, [materials, preloadImages]);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.mark('store-mount');
    
    return () => {
      performanceMonitor.mark('store-unmount');
      performanceMonitor.measure('store-lifetime', 'store-mount', 'store-unmount');
    };
  }, []);

  // Memory management
  useEffect(() => {
    const interval = setInterval(() => {
      const memoryInfo = memoryManager.getMemoryInfo();
      if (memoryInfo && memoryInfo.percentage > 80) {
        // Clear image cache if memory usage is high
        clearImageCache();
        // Clean old storage data
        storageOptimizer.cleanOldData();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [clearImageCache]);

  // Storage optimization
  useEffect(() => {
    const storageUsage = storageOptimizer.getStorageUsage();
    if (storageUsage.percentage > 80) {
      storageOptimizer.cleanOldData();
    }
  }, []);

  return children;
};

export default StorePerformanceOptimizer;