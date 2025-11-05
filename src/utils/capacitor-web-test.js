/**
 * Capacitor Web Environment Test Utility
 * Tests all Capacitor stubs to ensure they work correctly in web environment
 */

import { 
  validateCapacitorStubs, 
  initializeCapacitorStubs,
  App,
  Network,
  PushNotifications,
  StatusBar,
  SplashScreen
} from '../stubs/capacitor-stub-registry.js';

export async function testCapacitorStubs() {
  const results = {
    validation: null,
    initialization: false,
    tests: {}
  };

  try {
    // 1. Validate stub registry
    results.validation = validateCapacitorStubs();
    
    // 2. Initialize stubs
    results.initialization = initializeCapacitorStubs();
    
    // 3. Test App plugin
    results.tests.app = await testAppPlugin();
    
    // 4. Test Network plugin
    results.tests.network = await testNetworkPlugin();
    
    // 5. Test Push Notifications plugin
    results.tests.pushNotifications = await testPushNotificationsPlugin();
    
    // 6. Test Status Bar plugin
    results.tests.statusBar = await testStatusBarPlugin();
    
    // 7. Test Splash Screen plugin
    results.tests.splashScreen = await testSplashScreenPlugin();
    
  } catch (error) {
    console.error('Capacitor stub testing failed:', error);
    results.error = error.message;
  }

  return results;
}

async function testAppPlugin() {
  try {
    const info = await App.getInfo();
    const state = await App.getState();
    const launchUrl = await App.getLaunchUrl();
    
    // Test listeners
    const listener = App.addListener('appStateChange', () => {});
    listener.remove();
    
    await App.removeAllListeners();
    await App.exitApp();
    
    return {
      success: true,
      info,
      state,
      launchUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testNetworkPlugin() {
  try {
    const status = await Network.getStatus();
    
    // Test listeners
    const listener = Network.addListener('networkStatusChange', () => {});
    listener.remove();
    
    await Network.removeAllListeners();
    
    return {
      success: true,
      status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testPushNotificationsPlugin() {
  try {
    await PushNotifications.register();
    const permissions = await PushNotifications.checkPermissions();
    const delivered = await PushNotifications.getDeliveredNotifications();
    
    // Test listeners
    const listener = PushNotifications.addListener('registration', () => {});
    listener.remove();
    
    await PushNotifications.removeAllListeners();
    await PushNotifications.removeDeliveredNotifications();
    
    return {
      success: true,
      permissions,
      delivered
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testStatusBarPlugin() {
  try {
    await StatusBar.setStyle({ style: 'LIGHT_CONTENT' });
    await StatusBar.setBackgroundColor({ color: '#000000' });
    await StatusBar.setOverlaysWebView({ overlay: true });
    
    const info = await StatusBar.getInfo();
    
    await StatusBar.show();
    await StatusBar.hide();
    
    return {
      success: true,
      info
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testSplashScreenPlugin() {
  try {
    await SplashScreen.show();
    await SplashScreen.hide();
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in development/testing
export { testCapacitorStubs as default };