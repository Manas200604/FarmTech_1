/**
 * Capacitor Network Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/network
 */

export const Network = {
  getStatus: () => {
    // Use Navigator Connection API if available for more accurate connection info
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    let connectionType = 'wifi';
    if (connection) {
      if (connection.type === 'cellular') {
        connectionType = 'cellular';
      } else if (connection.type === 'none' || !navigator.onLine) {
        connectionType = 'none';
      }
    } else if (!navigator.onLine) {
      connectionType = 'none';
    }
    
    return Promise.resolve({
      connected: navigator.onLine,
      connectionType
    });
  },
  
  addListener: (eventName, callback) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`Network.addListener('${eventName}') called in web environment`);
    }
    
    if (eventName === 'networkStatusChange') {
      const handleOnline = () => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        callback({
          connected: true,
          connectionType: connection?.type === 'cellular' ? 'cellular' : 'wifi'
        });
      };
      
      const handleOffline = () => {
        callback({
          connected: false,
          connectionType: 'none'
        });
      };
      
      // Listen to connection changes
      const handleConnectionChange = () => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          callback({
            connected: navigator.onLine,
            connectionType: connection.type || (navigator.onLine ? 'wifi' : 'none')
          });
        }
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Listen to connection API changes if available
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
      
      return {
        remove: () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          if (connection) {
            connection.removeEventListener('change', handleConnectionChange);
          }
        }
      };
    }
    
    return {
      remove: () => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`Network listener for '${eventName}' removed in web environment`);
        }
      }
    };
  },
  
  removeAllListeners: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Network.removeAllListeners() called in web environment - no action taken');
    }
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