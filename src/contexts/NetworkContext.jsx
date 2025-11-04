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

  // Network status monitoring removed - no UI notifications for connectivity

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