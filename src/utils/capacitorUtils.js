/**
 * Capacitor Plugin Utilities
 * Centralized plugin loading with environment detection and fallback handling
 */

// Plugin status constants
export const PluginStatus = {
  LOADING: 'loading',
  AVAILABLE: 'available',
  FALLBACK: 'fallback',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error'
};

// Environment configuration
const EnvironmentConfig = {
  web: {
    plugins: {
      network: 'browser-api',
      pushNotifications: 'service-worker',
      statusBar: 'none',
      splashScreen: 'none'
    }
  },
  native: {
    plugins: {
      network: '@capacitor/network',
      pushNotifications: '@capacitor/push-notifications',
      statusBar: '@capacitor/status-bar',
      splashScreen: '@capacitor/splash-screen'
    }
  }
};

class CapacitorUtils {
  constructor() {
    this.isInitialized = false;
    this.environment = null;
    this.availablePlugins = new Map();
    this.pluginCache = new Map();
  }

  /**
   * Initialize Capacitor utilities and detect environment
   */
  async initialize() {
    if (this.isInitialized) {
      return this.environment;
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        this.environment = {
          platform: 'web',
          isNative: false,
          isReady: true,
          availablePlugins: []
        };
        this.isInitialized = true;
        return this.environment;
      }

      // Try to load Capacitor core
      const capacitorCore = await this.safeImport('@capacitor/core');
      
      if (capacitorCore && capacitorCore.Capacitor) {
        const { Capacitor } = capacitorCore;
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform();

        this.environment = {
          platform,
          isNative,
          isReady: true,
          availablePlugins: []
        };

        // Detect available plugins
        await this.detectAvailablePlugins();
      } else {
        // Fallback to web environment
        this.environment = {
          platform: 'web',
          isNative: false,
          isReady: true,
          availablePlugins: []
        };
      }

      this.isInitialized = true;
      return this.environment;
    } catch (error) {
      console.log('Capacitor not available, using web environment');
      this.environment = {
        platform: 'web',
        isNative: false,
        isReady: true,
        availablePlugins: [],
        error: error.message
      };
      this.isInitialized = true;
      return this.environment;
    }
  }

  /**
   * Safely import a module with error handling
   */
  async safeImport(moduleName) {
    try {
      const module = await import(moduleName);
      return module;
    } catch (error) {
      console.log(`Failed to import ${moduleName}:`, error.message);
      return null;
    }
  }

  /**
   * Load a specific Capacitor plugin with fallback handling
   */
  async loadPlugin(pluginName) {
    // Check cache first
    if (this.pluginCache.has(pluginName)) {
      return this.pluginCache.get(pluginName);
    }

    // Ensure environment is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result = {
      plugin: null,
      status: PluginStatus.LOADING,
      isNative: this.environment.isNative,
      fallbackAvailable: false
    };

    try {
      if (this.environment.isNative) {
        // Try to load native plugin
        const pluginModule = await this.safeImport(`@capacitor/${pluginName}`);
        if (pluginModule) {
          result.plugin = pluginModule;
          result.status = PluginStatus.AVAILABLE;
        } else {
          result.status = PluginStatus.UNAVAILABLE;
        }
      } else {
        // Web environment - check for fallback
        result.status = PluginStatus.FALLBACK;
        result.fallbackAvailable = this.hasFallbackSupport(pluginName);
      }
    } catch (error) {
      result.status = PluginStatus.ERROR;
      result.error = error.message;
    }

    // Cache the result
    this.pluginCache.set(pluginName, result);
    return result;
  }

  /**
   * Check if a plugin has fallback support in web environment
   */
  hasFallbackSupport(pluginName) {
    const webConfig = EnvironmentConfig.web.plugins[pluginName];
    
    switch (webConfig) {
      case 'browser-api':
        return typeof navigator !== 'undefined';
      case 'service-worker':
        return 'serviceWorker' in navigator && 'PushManager' in window;
      case 'none':
        return false;
      default:
        return false;
    }
  }

  /**
   * Detect which plugins are available in the current environment
   */
  async detectAvailablePlugins() {
    const pluginsToCheck = ['network', 'push-notifications', 'status-bar', 'splash-screen'];
    
    for (const pluginName of pluginsToCheck) {
      const result = await this.loadPlugin(pluginName);
      if (result.status === PluginStatus.AVAILABLE || result.fallbackAvailable) {
        this.environment.availablePlugins.push(pluginName);
      }
    }
  }

  /**
   * Get current environment information
   */
  getEnvironmentInfo() {
    return this.environment;
  }

  /**
   * Check if running in native environment
   */
  isNativeEnvironment() {
    return this.environment?.isNative || false;
  }

  /**
   * Check if a specific plugin is available
   */
  isPluginAvailable(pluginName) {
    return this.environment?.availablePlugins?.includes(pluginName) || false;
  }

  /**
   * Get plugin loading result from cache
   */
  getPluginResult(pluginName) {
    return this.pluginCache.get(pluginName) || null;
  }
}

// Create singleton instance
const capacitorUtils = new CapacitorUtils();

export default capacitorUtils;

// Export convenience functions
export const loadPlugin = (pluginName) => capacitorUtils.loadPlugin(pluginName);
export const isNativeEnvironment = () => capacitorUtils.isNativeEnvironment();
export const getEnvironmentInfo = () => capacitorUtils.getEnvironmentInfo();
export const initializeCapacitor = () => capacitorUtils.initialize();