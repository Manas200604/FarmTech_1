/**
 * Capacitor Push Notifications Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/push-notifications
 */

export const PushNotifications = {
  register: () => {
    console.log('PushNotifications.register() called in web environment - not implemented');
    return Promise.resolve();
  },
  
  requestPermissions: () => {
    console.log('PushNotifications.requestPermissions() called in web environment');
    
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
    console.log('PushNotifications.checkPermissions() called in web environment');
    
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
    console.log(`PushNotifications.addListener('${eventName}') called in web environment - no action taken`);
    return {
      remove: () => {
        console.log(`PushNotifications listener for '${eventName}' removed in web environment`);
      }
    };
  },
  
  removeAllListeners: () => {
    console.log('PushNotifications.removeAllListeners() called in web environment - no action taken');
    return Promise.resolve();
  },
  
  getDeliveredNotifications: () => {
    console.log('PushNotifications.getDeliveredNotifications() called in web environment');
    return Promise.resolve({
      notifications: []
    });
  },
  
  removeDeliveredNotifications: () => {
    console.log('PushNotifications.removeDeliveredNotifications() called in web environment - no action taken');
    return Promise.resolve();
  }
};

export default { PushNotifications };