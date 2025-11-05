/**
 * Capacitor App Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/app
 */

export const App = {
  exitApp: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('App.exitApp() called in web environment - no action taken');
    }
    return Promise.resolve();
  },
  
  addListener: (eventName, callback) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`App.addListener('${eventName}') called in web environment`);
    }
    
    // Handle app state changes using web APIs
    if (eventName === 'appStateChange') {
      const handleVisibilityChange = () => {
        callback({
          isActive: document.visibilityState === 'visible'
        });
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return {
        remove: () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
    }
    
    // Handle URL open events
    if (eventName === 'appUrlOpen') {
      const handleHashChange = () => {
        callback({
          url: window.location.href
        });
      };
      
      window.addEventListener('hashchange', handleHashChange);
      window.addEventListener('popstate', handleHashChange);
      
      return {
        remove: () => {
          window.removeEventListener('hashchange', handleHashChange);
          window.removeEventListener('popstate', handleHashChange);
        }
      };
    }
    
    return {
      remove: () => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`App listener for '${eventName}' removed in web environment`);
        }
      }
    };
  },
  
  removeAllListeners: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('App.removeAllListeners() called in web environment - no action taken');
    }
    return Promise.resolve();
  },
  
  getInfo: () => {
    const env = (typeof import !== 'undefined' && import.meta && import.meta.env) || {};
    return Promise.resolve({
      name: env.VITE_APP_NAME || 'FarmTech',
      id: 'com.farmtech.app',
      build: env.VITE_APP_VERSION || '1.0.0',
      version: env.VITE_APP_VERSION || '1.0.0'
    });
  },
  
  getLaunchUrl: () => {
    return Promise.resolve({
      url: window.location.href
    });
  },
  
  getState: () => {
    return Promise.resolve({
      isActive: document.visibilityState === 'visible'
    });
  }
};

export default { App };