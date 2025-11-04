import { useEffect, useState, useCallback } from 'react';
import capacitorUtils, { PluginStatus } from '../utils/capacitorUtils';
import { logger } from '../utils/logger';

const useNetwork = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  // Web fallback functions
  const updateOnlineStatusWeb = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    
    const online = navigator.onLine;
    setIsConnected(online);
    setConnectionType(online ? 'wifi' : 'none');
    
    logger.debug('Network status updated (web)', { 
      isConnected: online, 
      connectionType: online ? 'wifi' : 'none' 
    });
  }, []);

  const detectConnectionTypeWeb = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.connection) {
      return 'wifi'; // Default fallback
    }

    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    // Map effective types to Capacitor-like connection types
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'cellular';
      case '3g':
      case '4g':
        return 'cellular';
      default:
        return 'wifi';
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let networkListener = null;
    let webListeners = [];

    const initNetwork = async () => {
      try {
        logger.logPluginLoading('network');

        // Initialize capacitor utilities first
        await capacitorUtils.initialize();
        
        if (!isMounted) return;

        // Try to load network plugin
        const networkResult = await capacitorUtils.loadPlugin('network');
        
        if (networkResult.status === PluginStatus.AVAILABLE && networkResult.plugin) {
          // Native platform - use Capacitor Network plugin
          const { Network } = networkResult.plugin;
          
          try {
            const status = await Network.getStatus();
            
            if (isMounted) {
              setIsConnected(status.connected);
              setConnectionType(status.connectionType);
              setIsSupported(true);
              
              logger.logPluginAvailable('network', {
                connected: status.connected,
                connectionType: status.connectionType
              });
            }

            // Listen for network changes
            networkListener = await Network.addListener('networkStatusChange', (status) => {
              if (isMounted) {
                setIsConnected(status.connected);
                setConnectionType(status.connectionType);
                
                logger.debug('Network status changed (native)', status);
              }
            });

          } catch (pluginError) {
            logger.logPluginError('network', pluginError, 'Failed to get network status');
            throw pluginError;
          }
        } else {
          // Web platform or plugin unavailable - use browser APIs
          if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            logger.logPluginUnavailable('network', 'No browser environment available');
            return;
          }

          logger.logPluginFallback('network', 'browser-api', 'Using navigator.onLine');
          
          // Initial status
          updateOnlineStatusWeb();
          
          // Enhanced connection type detection for web
          if (navigator.onLine) {
            const detectedType = detectConnectionTypeWeb();
            setConnectionType(detectedType);
          }
          
          setIsSupported(true);

          // Add event listeners for web
          const onlineHandler = () => {
            updateOnlineStatusWeb();
            const detectedType = detectConnectionTypeWeb();
            setConnectionType(detectedType);
          };
          
          const offlineHandler = () => {
            updateOnlineStatusWeb();
          };

          window.addEventListener('online', onlineHandler);
          window.addEventListener('offline', offlineHandler);
          
          webListeners = [
            { event: 'online', handler: onlineHandler },
            { event: 'offline', handler: offlineHandler }
          ];

          // Listen for connection changes if available
          if (navigator.connection) {
            const connectionChangeHandler = () => {
              if (navigator.onLine) {
                const detectedType = detectConnectionTypeWeb();
                setConnectionType(detectedType);
                logger.debug('Connection type changed (web)', { connectionType: detectedType });
              }
            };
            
            navigator.connection.addEventListener('change', connectionChangeHandler);
            webListeners.push({ 
              target: navigator.connection, 
              event: 'change', 
              handler: connectionChangeHandler 
            });
          }
        }
      } catch (error) {
        if (!isMounted) return;
        
        logger.logPluginError('network', error, 'Network initialization failed');
        setError(error.message);
        
        // Fallback to basic web API
        if (typeof navigator !== 'undefined') {
          updateOnlineStatusWeb();
          setIsSupported(true);
        }
      }
    };

    initNetwork();

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Remove native listener
      if (networkListener) {
        networkListener.remove();
      }
      
      // Remove web listeners
      webListeners.forEach(({ target = window, event, handler }) => {
        target.removeEventListener(event, handler);
      });
    };
  }, [updateOnlineStatusWeb, detectConnectionTypeWeb]);

  return {
    isConnected,
    connectionType,
    isOnline: isConnected,
    isSupported,
    error,
    // Additional utility methods
    refresh: useCallback(async () => {
      try {
        const networkResult = await capacitorUtils.loadPlugin('network');
        
        if (networkResult.status === PluginStatus.AVAILABLE && networkResult.plugin) {
          const { Network } = networkResult.plugin;
          const status = await Network.getStatus();
          setIsConnected(status.connected);
          setConnectionType(status.connectionType);
        } else {
          updateOnlineStatusWeb();
        }
      } catch (error) {
        logger.logPluginError('network', error, 'Failed to refresh network status');
      }
    }, [updateOnlineStatusWeb])
  };
};

export default useNetwork;