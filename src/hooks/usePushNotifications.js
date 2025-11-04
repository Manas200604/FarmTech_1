import { useEffect, useState, useCallback } from 'react';
import capacitorUtils, { PluginStatus } from '../utils/capacitorUtils';
import { logger } from '../utils/logger';
import { toast } from 'react-hot-toast';

const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isNative, setIsNative] = useState(false);

  // Web push notification support detection
  const checkWebPushSupport = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }, []);

  // Web push permission request
  const requestWebPermission = useCallback(async () => {
    try {
      if (!checkWebPushSupport()) {
        logger.logPluginUnavailable('push-notifications', 'Web push not supported');
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      logger.logPluginAvailable('push-notifications', `Web permission: ${permission}`);
      return permission;
    } catch (error) {
      logger.logPluginError('push-notifications', error, 'Web permission request failed');
      return 'denied';
    }
  }, [checkWebPushSupport]);

  useEffect(() => {
    let isMounted = true;
    let pushListeners = [];

    const initPushNotifications = async () => {
      try {
        logger.logPluginLoading('push-notifications');

        // Initialize capacitor utilities
        await capacitorUtils.initialize();
        const environment = capacitorUtils.getEnvironmentInfo();
        
        if (!isMounted) return;
        
        setIsNative(environment.isNative);

        // Try to load push notifications plugin
        const pushResult = await capacitorUtils.loadPlugin('push-notifications');
        
        if (pushResult.status === PluginStatus.AVAILABLE && pushResult.plugin) {
          // Native platform - use Capacitor Push Notifications
          const { PushNotifications } = pushResult.plugin;
          
          setIsSupported(true);
          logger.logPluginAvailable('push-notifications', 'Native plugin loaded');

          try {
            // Check current permission status
            const permResult = await PushNotifications.checkPermissions();
            setPermission(permResult.receive);

            // If permission is granted, register
            if (permResult.receive === 'granted') {
              await PushNotifications.register();
            }

            // Listen for registration success
            const registrationListener = await PushNotifications.addListener('registration', (token) => {
              if (isMounted) {
                logger.info('Push registration success, token: ' + token.value);
                setToken(token.value);
              }
            });
            pushListeners.push(registrationListener);

            // Listen for registration errors
            const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
              if (isMounted) {
                logger.logPluginError('push-notifications', error, 'Registration failed');
                setError(error.error || 'Registration failed');
              }
            });
            pushListeners.push(registrationErrorListener);

            // Listen for push notifications
            const pushReceivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              if (isMounted) {
                logger.info('Push received: ' + JSON.stringify(notification));
                toast.success(notification.title || 'New notification');
              }
            });
            pushListeners.push(pushReceivedListener);

            // Listen for notification actions
            const pushActionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
              if (isMounted) {
                logger.info('Push action performed: ' + JSON.stringify(notification));
                // Handle notification tap/action
              }
            });
            pushListeners.push(pushActionListener);

          } catch (pluginError) {
            logger.logPluginError('push-notifications', pluginError, 'Native plugin setup failed');
            setError(pluginError.message);
          }
        } else {
          // Web platform or plugin unavailable
          const webSupported = checkWebPushSupport();
          setIsSupported(webSupported);
          
          if (webSupported) {
            logger.logPluginFallback('push-notifications', 'service-worker', 'Web push available but not implemented');
            
            // Check current web permission
            if (Notification.permission !== 'default') {
              setPermission(Notification.permission);
            }
          } else {
            logger.logPluginUnavailable('push-notifications', 'No web push support in this browser');
          }
        }
      } catch (error) {
        if (!isMounted) return;
        
        logger.logPluginError('push-notifications', error, 'Initialization failed');
        setError(error.message);
        setIsSupported(false);
      }
    };

    initPushNotifications();

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Remove all listeners
      pushListeners.forEach(listener => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      });
    };
  }, [checkWebPushSupport]);

  const requestPermission = useCallback(async () => {
    try {
      if (isNative) {
        // Native permission request
        const pushResult = await capacitorUtils.loadPlugin('push-notifications');
        
        if (pushResult.status === PluginStatus.AVAILABLE && pushResult.plugin) {
          const { PushNotifications } = pushResult.plugin;
          const result = await PushNotifications.requestPermissions();
          setPermission(result.receive);
          
          if (result.receive === 'granted') {
            await PushNotifications.register();
          }
          
          return result.receive === 'granted';
        }
      } else {
        // Web permission request
        const webPermission = await requestWebPermission();
        setPermission(webPermission);
        return webPermission === 'granted';
      }
    } catch (error) {
      logger.logPluginError('push-notifications', error, 'Permission request failed');
      setError(error.message);
    }
    return false;
  }, [isNative, requestWebPermission]);

  const registerForPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      if (isNative) {
        const pushResult = await capacitorUtils.loadPlugin('push-notifications');
        
        if (pushResult.status === PluginStatus.AVAILABLE && pushResult.plugin) {
          const { PushNotifications } = pushResult.plugin;
          await PushNotifications.register();
          return true;
        }
      } else {
        // Web push registration would go here
        logger.info('Web push registration not implemented');
        return false;
      }
    } catch (error) {
      logger.logPluginError('push-notifications', error, 'Registration failed');
      setError(error.message);
    }
    return false;
  }, [isSupported, permission, isNative]);

  return {
    isSupported,
    permission,
    token,
    error,
    isNative,
    requestPermission,
    registerForPush,
    // Utility methods
    canRequestPermission: permission === 'default',
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied'
  };
};

export default usePushNotifications;