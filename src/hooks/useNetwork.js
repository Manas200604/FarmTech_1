import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

const useNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState({
    connected: true,
    connectionType: 'unknown'
  });

  useEffect(() => {
    let networkListener;

    const initNetwork = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Get initial network status
          const status = await Network.getStatus();
          setNetworkStatus({
            connected: status.connected,
            connectionType: status.connectionType
          });

          // Listen for network changes
          networkListener = await Network.addListener('networkStatusChange', (status) => {
            setNetworkStatus({
              connected: status.connected,
              connectionType: status.connectionType
            });
          });
        } catch (error) {
          console.log('Network plugin not available:', error);
        }
      } else {
        // Web fallback
        const updateOnlineStatus = () => {
          setNetworkStatus({
            connected: navigator.onLine,
            connectionType: navigator.onLine ? 'wifi' : 'none'
          });
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        return () => {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
        };
      }
    };

    initNetwork();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return networkStatus;
};

export default useNetwork;