import { useEffect, useState } from 'react';
import useCapacitor from '../../hooks/useCapacitor';
import capacitorUtils, { PluginStatus } from '../../utils/capacitorUtils';
import { logger } from '../../utils/logger';

const MobileWrapper = ({ children }) => {
  const { isNative, isAndroid, isReady, error: capacitorError, availablePlugins } = useCapacitor();
  const [appPlugin, setAppPlugin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);

  // Load App plugin for native platforms
  useEffect(() => {
    let isMounted = true;

    const loadAppPlugin = async () => {
      if (!isNative) {
        setIsLoading(false);
        return;
      }

      try {
        const appResult = await capacitorUtils.loadPlugin('app');
        
        if (!isMounted) return;

        if (appResult.status === PluginStatus.AVAILABLE && appResult.plugin) {
          setAppPlugin(appResult.plugin.App);
          logger.logPluginAvailable('app', 'App plugin loaded for back button handling');
        } else {
          logger.logPluginUnavailable('app', 'App plugin not available');
        }
      } catch (error) {
        if (isMounted) {
          logger.logPluginError('app', error, 'Failed to load App plugin');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isReady) {
      loadAppPlugin();
    }

    return () => {
      isMounted = false;
    };
  }, [isNative, isReady]);

  // Handle Android back button
  useEffect(() => {
    if (!isNative || !isAndroid || !appPlugin) {
      return;
    }

    let backButtonListener = null;

    const setupBackButtonHandling = async () => {
      try {
        // Handle hardware back button
        const handleBackButton = () => {
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath === '/login') {
            appPlugin.exitApp();
          } else {
            window.history.back();
          }
        };

        // Add document event listener for older Android versions
        document.addEventListener('backbutton', handleBackButton);

        // Add Capacitor App plugin listener
        backButtonListener = await appPlugin.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            appPlugin.exitApp();
          } else {
            window.history.back();
          }
        });

        logger.debug('Android back button handling configured');

        return () => {
          document.removeEventListener('backbutton', handleBackButton);
          if (backButtonListener) {
            backButtonListener.remove();
          }
        };
      } catch (error) {
        logger.logPluginError('app', error, 'Failed to setup back button handling');
      }
    };

    const cleanup = setupBackButtonHandling();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [isNative, isAndroid, appPlugin]);

  // Monitor for errors
  useEffect(() => {
    const hasAnyErrors = !!capacitorError;
    setHasErrors(hasAnyErrors);
    
    if (hasAnyErrors) {
      logger.warn('MobileWrapper detected errors', {
        capacitorError
      });
    }
  }, [capacitorError]);

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="mobile-wrapper loading">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Initializing app...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-wrapper ${isNative ? 'native-app' : 'web-app'}`}>


      {/* Error banner for development */}
      {hasErrors && process.env.NODE_ENV === 'development' && (
        <div className="error-banner bg-yellow-500 text-black p-2 text-center text-xs">
          <details>
            <summary className="cursor-pointer">Plugin errors detected (click to expand)</summary>
            <div className="mt-1 text-left">
              {capacitorError && <div>Capacitor: {capacitorError}</div>}
            </div>
          </details>
        </div>
      )}

      {/* Plugin status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="plugin-status fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div>Platform: {isNative ? 'Native' : 'Web'}</div>
          <div>Plugins: {availablePlugins.length}</div>
          {availablePlugins.length > 0 && (
            <div className="text-green-400">
              {availablePlugins.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="mobile-content">
        {children}
      </div>
    </div>
  );
};

export default MobileWrapper;