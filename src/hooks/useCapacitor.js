import { useEffect, useState } from 'react';
import capacitorUtils, { PluginStatus } from '../utils/capacitorUtils';
import { logger } from '../utils/logger';

const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('web');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [availablePlugins, setAvailablePlugins] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const initCapacitor = async () => {
      try {
        logger.debug('Initializing Capacitor environment...');
        
        // Initialize capacitor utilities
        const environment = await capacitorUtils.initialize();
        
        if (!isMounted) return;

        setIsNative(environment.isNative);
        setPlatform(environment.platform);
        setAvailablePlugins(environment.availablePlugins || []);
        
        if (environment.error) {
          setError(environment.error);
          logger.warn('Capacitor initialization completed with warnings', environment.error);
        } else {
          logger.info('Capacitor environment initialized', {
            platform: environment.platform,
            isNative: environment.isNative,
            availablePlugins: environment.availablePlugins
          });
        }

        // Configure mobile-specific plugins if native
        if (environment.isNative) {
          await configureMobilePlugins();
        }
        
        setIsReady(true);
      } catch (error) {
        if (!isMounted) return;
        
        logger.error('Capacitor initialization failed', error);
        setError(error.message);
        setIsNative(false);
        setPlatform('web');
        setIsReady(true);
      }
    };

    const configureMobilePlugins = async () => {
      try {
        // Load and configure status bar
        const statusBarResult = await capacitorUtils.loadPlugin('status-bar');
        if (statusBarResult.status === PluginStatus.AVAILABLE && statusBarResult.plugin) {
          const { StatusBar, Style } = statusBarResult.plugin;
          
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#16a34a' });
          
          logger.logPluginAvailable('status-bar', 'Configured with dark style and green background');
        }

        // Load and configure splash screen
        const splashResult = await capacitorUtils.loadPlugin('splash-screen');
        if (splashResult.status === PluginStatus.AVAILABLE && splashResult.plugin) {
          const { SplashScreen } = splashResult.plugin;
          
          await SplashScreen.hide();
          
          logger.logPluginAvailable('splash-screen', 'Hidden after app initialization');
        }
      } catch (error) {
        logger.logPluginError('mobile-config', error, 'Failed to configure mobile plugins');
      }
    };

    initCapacitor();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isNative,
    platform,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web',
    isReady,
    error,
    availablePlugins,
    // Utility functions
    isPluginAvailable: (pluginName) => availablePlugins.includes(pluginName),
    getEnvironmentInfo: () => capacitorUtils.getEnvironmentInfo()
  };
};

export default useCapacitor;