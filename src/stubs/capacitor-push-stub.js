/**
 * Capacitor Push Notifications Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/push-notifications
 */

export const PushNotifications = {
  register: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.register() called in web environment - using web push API');
    }
    
    // Try to register service worker for web push if available
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      return navigator.serviceWorker.ready
        .then(() => {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('Service worker ready for push notifications');
          }
          return Promise.resolve();
        })
        .catch(error => {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('Service worker registration failed:', error);
          }
          return Promise.resolve();
        });
    }
    
    return Promise.resolve();
  },
  
  requestPermissions: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.requestPermissions() called in web environment');
    }
    
    // Try to use web Notification API if available
    if ('Notification' in window) {
      return Notification.requestPermission().then(permission => ({
        receive: permission
      }));
    }
    
    return Promise.resolve({
      receive: 'denied'
    });
  },
  
  checkPermissions: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.checkPermissions() called in web environment');
    }
    
    if ('Notification' in window) {
      return Promise.resolve({
        receive: Notification.permission
      });
    }
    
    return Promise.resolve({
      receive: 'denied'
    });
  },
  
  addListener: (eventName, callback) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`PushNotifications.addListener('${eventName}') called in web environment`);
    }
    
    // Handle registration events
    if (eventName === 'registration') {
      // Simulate successful registration in web environment
      setTimeout(() => {
        callback({
          value: 'web-push-token-placeholder'
        });
      }, 100);
    }
    
    return {
      remove: () => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`PushNotifications listener for '${eventName}' removed in web environment`);
        }
      }
    };
  },
  
  removeAllListeners: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.removeAllListeners() called in web environment - no action taken');
    }
    return Promise.resolve();
  },
  
  getDeliveredNotifications: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.getDeliveredNotifications() called in web environment');
    }
    return Promise.resolve({
      notifications: []
    });
  },
  
  removeDeliveredNotifications: () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('PushNotifications.removeDeliveredNotifications() called in web environment - no action taken');
    }
    return Promise.resolve();
  }
};

export default { PushNotifications };