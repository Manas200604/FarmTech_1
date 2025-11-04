// Plugin status constants for logging
const PluginLogLevel = {
  LOADING: 'loading',
  AVAILABLE: 'available',
  FALLBACK: 'fallback',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error'
};

// Safely detect Capacitor environment
let capacitorEnvironment = null;

const detectCapacitorEnvironment = async () => {
  if (capacitorEnvironment) return capacitorEnvironment;
  
  try {
    if (typeof window === 'undefined') {
      capacitorEnvironment = {
        isNativePlatform: () => false,
        getPlatform: () => 'web'
      };
      return capacitorEnvironment;
    }

    const capacitorCore = await import('@capacitor/core');
    capacitorEnvironment = capacitorCore.Capacitor;
    return capacitorEnvironment;
  } catch (error) {
    console.log('Capacitor not available, using web fallback');
    capacitorEnvironment = {
      isNativePlatform: () => false,
      getPlatform: () => 'web'
    };
    return capacitorEnvironment;
  }
};

class Logger {
  constructor() {
    this.isNative = false;
    this.platform = 'web';
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.initialized = false;
    this.pluginLogs = [];
    this.init();
  }

  async init() {
    try {
      const Capacitor = await detectCapacitorEnvironment();
      this.isNative = Capacitor.isNativePlatform();
      this.platform = Capacitor.getPlatform();
      this.initialized = true;
    } catch (error) {
      this.error('Logger initialization failed', error);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      platform: this.platform,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // Console logging
    if (this.isDevelopment || level === 'error') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    }

    // Store critical errors for later reporting
    if (level === 'error') {
      this.storeError(logEntry);
    }
  }

  /**
   * Log plugin-specific information
   */
  logPlugin(pluginName, status, message, data = null) {
    const pluginLogEntry = {
      timestamp: new Date().toISOString(),
      plugin: pluginName,
      status,
      message,
      data,
      platform: this.platform,
      isNative: this.isNative
    };

    // Store plugin log
    this.pluginLogs.push(pluginLogEntry);
    
    // Keep only last 100 plugin logs
    if (this.pluginLogs.length > 100) {
      this.pluginLogs.splice(0, this.pluginLogs.length - 100);
    }

    // Console logging based on status
    const logLevel = this.getLogLevelForPluginStatus(status);
    const logMessage = `Plugin ${pluginName}: ${message}`;
    
    this.log(logLevel, logMessage, data);
  }

  /**
   * Get appropriate log level for plugin status
   */
  getLogLevelForPluginStatus(status) {
    switch (status) {
      case PluginLogLevel.ERROR:
        return 'error';
      case PluginLogLevel.UNAVAILABLE:
        return 'warn';
      case PluginLogLevel.FALLBACK:
        return 'info';
      case PluginLogLevel.LOADING:
        return 'debug';
      case PluginLogLevel.AVAILABLE:
        return 'info';
      default:
        return 'debug';
    }
  }

  /**
   * Log plugin loading attempt
   */
  logPluginLoading(pluginName) {
    this.logPlugin(pluginName, PluginLogLevel.LOADING, 'Loading plugin...');
  }

  /**
   * Log successful plugin load
   */
  logPluginAvailable(pluginName, data = null) {
    this.logPlugin(pluginName, PluginLogLevel.AVAILABLE, 'Plugin loaded successfully', data);
  }

  /**
   * Log plugin fallback usage
   */
  logPluginFallback(pluginName, fallbackType, data = null) {
    this.logPlugin(pluginName, PluginLogLevel.FALLBACK, `Using ${fallbackType} fallback`, data);
  }

  /**
   * Log plugin unavailable
   */
  logPluginUnavailable(pluginName, reason = null) {
    this.logPlugin(pluginName, PluginLogLevel.UNAVAILABLE, 'Plugin not available', { reason });
  }

  /**
   * Log plugin error
   */
  logPluginError(pluginName, error, context = null) {
    this.logPlugin(pluginName, PluginLogLevel.ERROR, 'Plugin error occurred', { 
      error: error.message || error, 
      stack: error.stack,
      context 
    });
  }

  /**
   * Get plugin logs for debugging
   */
  getPluginLogs(pluginName = null) {
    if (pluginName) {
      return this.pluginLogs.filter(log => log.plugin === pluginName);
    }
    return this.pluginLogs;
  }

  /**
   * Clear plugin logs
   */
  clearPluginLogs() {
    this.pluginLogs = [];
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  storeError(logEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('farmtech-errors') || '[]');
      errors.push(logEntry);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('farmtech-errors', JSON.stringify(errors));
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('farmtech-errors') || '[]');
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  clearStoredErrors() {
    try {
      localStorage.removeItem('farmtech-errors');
      return true;
    } catch (error) {
      console.error('Failed to clear error logs:', error);
      return false;
    }
  }

  // Mobile-specific error reporting
  reportCrash(error, errorInfo) {
    const crashReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      platform: this.platform,
      appVersion: '1.0.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      pluginLogs: this.getPluginLogs() // Include plugin logs in crash reports
    };

    this.error('Application Crash', crashReport);
    
    // In production, you would send this to a crash reporting service
    if (!this.isDevelopment) {
      // Example: Send to crash reporting service
      // crashReportingService.report(crashReport);
    }
  }
}

export const logger = new Logger();

// Export plugin log level constants
export { PluginLogLevel };