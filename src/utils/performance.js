import { logger } from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
  }

  // Start timing a operation
  startTiming(name) {
    if (!this.isSupported) return;
    
    const startTime = performance.now();
    this.metrics.set(name, { startTime, endTime: null });
    
    logger.debug(`Performance: Started timing ${name}`);
  }

  // End timing and log result
  endTiming(name) {
    if (!this.isSupported) return;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance: No start time found for ${name}`);
      return;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    logger.info(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Performance: Slow operation detected - ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Measure a function execution
  measure(name, fn) {
    this.startTiming(name);
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => this.endTiming(name));
    } else {
      this.endTiming(name);
      return result;
    }
  }

  // Monitor Core Web Vitals
  initWebVitals() {
    if (!this.isSupported) return;

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      logger.info(`Performance: LCP = ${lastEntry.startTime.toFixed(2)}ms`);
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0];
      const fid = firstEntry.processingStart - firstEntry.startTime;
      logger.info(`Performance: FID = ${fid.toFixed(2)}ms`);
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      logger.info(`Performance: CLS = ${clsValue.toFixed(4)}`);
    });
  }

  // Generic performance observer
  observeMetric(type, callback) {
    if (!this.isSupported || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      logger.warn(`Performance: Could not observe ${type}`, error);
    }
  }

  // Monitor memory usage (if available)
  getMemoryInfo() {
    if (!this.isSupported || !performance.memory) return null;

    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }

  // Log memory usage
  logMemoryUsage() {
    const memory = this.getMemoryInfo();
    if (memory) {
      logger.info(`Memory: ${memory.used}MB used / ${memory.total}MB total (limit: ${memory.limit}MB)`);
      
      // Warn if memory usage is high
      if (memory.used / memory.limit > 0.8) {
        logger.warn('High memory usage detected');
      }
    }
  }

  // Get all collected metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize web vitals monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.initWebVitals();
  
  // Log memory usage periodically in development
  if (import.meta.env.MODE === 'development') {
    setInterval(() => {
      performanceMonitor.logMemoryUsage();
    }, 30000); // Every 30 seconds
  }
}