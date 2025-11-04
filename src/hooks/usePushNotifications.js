import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';
import { toast } from 'react-hot-toast';

const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    }
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        logger.info('Push notification permission granted');
        
        // Register for push notifications
        await PushNotifications.register();
        
        // Listen for registration
        PushNotifications.addListener('registration', (token) => {
          logger.info('Push registration success', { token: token.value });
          setPushToken(token.value);
          setIsRegistered(true);
          
          // Send token to your backend
          sendTokenToBackend(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          logger.error('Push registration error', error);
          toast.error('Failed to register for notifications');
        });

        // Listen for incoming notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          logger.info('Push notification received', notification);
          
          setNotifications(prev => [...prev, {
            id: Date.now(),
            ...notification,
            timestamp: new Date().toISOString()
          }]);
          
          // Show toast for foreground notifications
          toast.success(notification.title || 'New notification', {
            description: notification.body,
            duration: 5000
          });
        });

        // Listen for notification actions
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          logger.info('Push notification action performed', action);
          
          const notification = action.notification;
          
          // Handle notification tap
          if (action.actionId === 'tap') {
            handleNotificationTap(notification);
          }
        });

      } else {
        logger.warn('Push notification permission denied');
        toast.error('Notification permission denied');
      }
    } catch (error) {
      logger.error('Failed to initialize push notifications', error);
    }
  };

  const sendTokenToBackend = async (token) => {
    try {
      // Replace with your backend endpoint
      // await fetch('/api/push-tokens', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, platform: 'android' })
      // });
      
      logger.info('Push token would be sent to backend', { token });
    } catch (error) {
      logger.error('Failed to send push token to backend', error);
    }
  };

  const handleNotificationTap = (notification) => {
    // Handle notification tap - navigate to relevant screen
    logger.info('Notification tapped', notification);
    
    // Example: Navigate based on notification data
    if (notification.data?.screen) {
      // Use your navigation system here
      // navigate(notification.data.screen);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  return {
    isRegistered,
    pushToken,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    clearNotifications,
    markAsRead
  };
};

export default usePushNotifications;