import { Capacitor } from '@capacitor/core';

class Logger {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.isDevelopment = import.meta.env.MODE === 'development';
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent
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
      platform: Capacitor.getPlatform(),
      appVersion: '1.0.0',
      userAgent: navigator.userAgent
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