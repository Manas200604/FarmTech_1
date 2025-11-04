/**
 * Capacitor Network Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/network
 */

export const Network = {
  getStatus: () => {
    return Promise.resolve({
      connected: navigator.onLine,
      connectionType: navigator.onLine ? 'wifi' : 'none'
    });
  },
  
  addListener: (eventName, callback) => {
    console.log(`Network.addListener('${eventName}') called in web environment`);
    
    if (eventName === 'networkStatusChange') {
      const handleOnline = () => {
        callback({
          connected: true,
          connectionType: 'wifi'
        });
      };
      
      const handleOffline = () => {
        callback({
          connected: false,
          connectionType: 'none'
        });
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return {
        remove: () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    }
    
    return {
      remove: () => {
        console.log(`Network listener for '${eventName}' removed in web environment`);
      }
    };
  },
  
  removeAllListeners: () => {
    console.log('Network.removeAllListeners() called in web environment - no action taken');
    return Promise.resolve();
  }
};

export const ConnectionType = {
  Wifi: 'wifi',
  Cellular: 'cellular',
  None: 'none',
  Unknown: 'unknown'
};

export default { Network, ConnectionType };