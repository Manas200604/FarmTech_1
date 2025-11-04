/**
 * Performance Optimization Utilities
 * Provides various performance enhancement functions
 */

// Import React for lazy loading (commented out to avoid import issues)
// import React from 'react';

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading utility for components
export const createLazyComponent = (importFunc, fallback = null) => {
  // Note: This function requires React to be imported in the consuming component
  return {
    importFunc,
    fallback: fallback || 'Loading...'
  };
};

// Virtual scrolling for large lists
export class VirtualScroller {
  constructor(containerHeight, itemHeight, buffer = 5) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
  }

  getVisibleRange(scrollTop, totalItems) {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + this.buffer * 2);
    
    return { startIndex, endIndex, visibleCount };
  }

  getItemStyle(index) {
    return {
      position: 'absolute',
      top: index * this.itemHeight,
      height: this.itemHeight,
      width: '100%'
    };
  }

  getContainerStyle(totalItems) {
    return {
      height: totalItems * this.itemHeight,
      position: 'relative'
    };
  }
}

// Memory management utilities
export const memoryManager = {
  // Clear unused caches
  clearCaches() {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }
  },

  // Monitor memory usage
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  },

  // Force garbage collection (if available)
  forceGC() {
    if (window.gc) {
      window.gc();
    }
  }
};

// Image optimization utilities
export const imageOptimizer = {
  // Compress image before upload
  compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Generate responsive image URLs
  getResponsiveImageUrl(baseUrl, width, height, quality = 80) {
    if (baseUrl.includes('unsplash.com')) {
      return `${baseUrl}?w=${width}&h=${height}&q=${quality}&fit=crop&auto=format`;
    }
    return baseUrl;
  },

  // Preload critical images
  preloadImages(urls) {
    return Promise.all(
      urls.map(url => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load ${url}`));
        img.src = url;
      }))
    );
  }
};

// Network optimization
export const networkOptimizer = {
  // Check connection quality
  getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  },

  // Adaptive loading based on connection
  shouldLoadHighQuality() {
    const connection = this.getConnectionInfo();
    if (!connection) return true;
    
    return connection.effectiveType === '4g' && 
           connection.downlink > 1.5 && 
           !connection.saveData;
  },

  // Batch API requests
  batchRequests(requests, batchSize = 5) {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    return batches.reduce(async (previousBatch, currentBatch) => {
      await previousBatch;
      return Promise.all(currentBatch);
    }, Promise.resolve());
  }
};

// Local storage optimization
export const storageOptimizer = {
  // Compress data before storing
  setCompressed(key, data) {
    try {
      const compressed = JSON.stringify(data);
      localStorage.setItem(key, compressed);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  // Get and decompress data
  getCompressed(key) {
    try {
      const compressed = localStorage.getItem(key);
      return compressed ? JSON.parse(compressed) : null;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  },

  // Clean old data
  cleanOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('farmtech_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.timestamp && (now - data.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return keysToRemove.length;
  },

  // Get storage usage
  getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return {
      used: total,
      available: 5 * 1024 * 1024 - total, // Assuming 5MB limit
      percentage: (total / (5 * 1024 * 1024)) * 100
    };
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Mark performance points
  mark(name) {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure performance between marks
  measure(name, startMark, endMark) {
    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        return measure ? measure.duration : null;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return null;
      }
    }
    return null;
  },

  // Get all performance entries
  getEntries() {
    if ('performance' in window) {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource'),
        measures: performance.getEntriesByType('measure'),
        marks: performance.getEntriesByType('mark')
      };
    }
    return null;
  },

  // Clear performance entries
  clearEntries() {
    if ('performance' in window && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
};

// Bundle size optimization helpers
export const bundleOptimizer = {
  // Dynamic imports for code splitting
  loadComponent(componentPath) {
    return () => import(componentPath);
  },

  // Preload critical chunks
  preloadChunk(chunkName) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = `/chunks/${chunkName}.js`;
    document.head.appendChild(link);
  },

  // Check if feature should be loaded
  shouldLoadFeature(featureName) {
    const features = JSON.parse(localStorage.getItem('enabled_features') || '{}');
    return features[featureName] !== false;
  }
};

export default {
  debounce,
  throttle,
  createLazyComponent,
  VirtualScroller,
  memoryManager,
  imageOptimizer,
  networkOptimizer,
  storageOptimizer,
  performanceMonitor,
  bundleOptimizer
};