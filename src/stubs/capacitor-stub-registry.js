/**
 * Capacitor Stub Registry
 * Central registry for all Capacitor plugin stubs in web environment
 * Provides validation and error handling for stub functionality
 */

import { App } from './capacitor-app-stub.js';
import { Network, ConnectionType } from './capacitor-network-stub.js';
import { PushNotifications } from './capacitor-push-stub.js';
import { StatusBar, Style } from './capacitor-status-bar-stub.js';
import { SplashScreen } from './capacitor-splash-stub.js';

// Registry of all available stubs
export const CAPACITOR_STUBS = {
  '@capacitor/app': { App },
  '@capacitor/network': { Network, ConnectionType },
  '@capacitor/push-notifications': { PushNotifications },
  '@capacitor/status-bar': { StatusBar, Style },
  '@capacitor/splash-screen': { SplashScreen }
};

// Validation function to ensure all stubs are properly loaded
export function validateCapacitorStubs() {
  const errors = [];
  
  Object.entries(CAPACITOR_STUBS).forEach(([pluginName, exports]) => {
    try {
      if (!exports || typeof exports !== 'object') {
        errors.push(`${pluginName}: Invalid exports object`);
        return;
      }
      
      // Validate each export has required methods
      Object.entries(exports).forEach(([exportName, exportValue]) => {
        if (!exportValue || typeof exportValue !== 'object') {
          errors.push(`${pluginName}.${exportName}: Invalid export`);
        }
      });
    } catch (error) {
      errors.push(`${pluginName}: ${error.message}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get stub for a specific plugin
export function getCapacitorStub(pluginName) {
  const stub = CAPACITOR_STUBS[pluginName];
  if (!stub) {
    console.warn(`Capacitor stub not found for plugin: ${pluginName}`);
    return null;
  }
  return stub;
}

// Initialize all stubs and validate they're working
export function initializeCapacitorStubs() {
  if (typeof window === 'undefined') {
    console.warn('Capacitor stubs: Not in browser environment');
    return false;
  }
  
  const validation = validateCapacitorStubs();
  
  if (!validation.isValid) {
    console.error('Capacitor stub validation failed:', validation.errors);
    return false;
  }
  
  console.log('Capacitor stubs initialized successfully for web environment');
  return true;
}

// Export all stubs for direct import
export {
  App,
  Network,
  ConnectionType,
  PushNotifications,
  StatusBar,
  Style,
  SplashScreen
};