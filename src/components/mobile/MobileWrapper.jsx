import React, { useEffect } from 'react';
import useCapacitor from '../../hooks/useCapacitor';
import useNetwork from '../../hooks/useNetwork';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const MobileWrapper = ({ children }) => {
  const { isNative, isAndroid } = useCapacitor();
  const { connected } = useNetwork();

  useEffect(() => {
    if (isNative) {
      // Handle Android back button
      const handleBackButton = () => {
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          App.exitApp();
        } else {
          window.history.back();
        }
      };

      if (isAndroid) {
        document.addEventListener('backbutton', handleBackButton);
        
        // Also handle using Capacitor App plugin
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      }

      return () => {
        if (isAndroid) {
          document.removeEventListener('backbutton', handleBackButton);
        }
      };
    }
  }, [isNative, isAndroid]);

  return (
    <div className={`mobile-wrapper ${isNative ? 'native-app' : 'web-app'}`}>
      {!connected && (
        <div className="offline-banner bg-red-500 text-white p-2 text-center text-sm">
          No internet connection
        </div>
      )}
      {children}
    </div>
  );
};

export default MobileWrapper;