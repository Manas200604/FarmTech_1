import React, { createContext, useContext, useEffect, useState } from 'react';
import useNetwork from '../hooks/useNetwork';
import { toast } from 'react-hot-toast';

const NetworkContext = createContext();

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const networkStatus = useNetwork();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!networkStatus.connected && !wasOffline) {
      setWasOffline(true);
      toast.error('No internet connection', {
        id: 'offline-toast',
        duration: Infinity,
        icon: '📡'
      });
    } else if (networkStatus.connected && wasOffline) {
      setWasOffline(false);
      toast.dismiss('offline-toast');
      toast.success('Connection restored', {
        icon: '✅',
        duration: 3000
      });
    }
  }, [networkStatus.connected, wasOffline]);

  const value = {
    ...networkStatus,
    isOffline: !networkStatus.connected,
    isOnline: networkStatus.connected
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};