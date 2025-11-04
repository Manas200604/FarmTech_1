/**
 * Capacitor App Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/app
 */

export const App = {
  exitApp: () => {
    console.log('App.exitApp() called in web environment - no action taken');
    return Promise.resolve();
  },
  
  addListener: (eventName, callback) => {
    console.log(`App.addListener('${eventName}') called in web environment - no action taken`);
    return {
      remove: () => {
        console.log(`App listener for '${eventName}' removed in web environment`);
      }
    };
  },
  
  removeAllListeners: () => {
    console.log('App.removeAllListeners() called in web environment - no action taken');
    return Promise.resolve();
  },
  
  getInfo: () => {
    return Promise.resolve({
      name: 'FarmTech',
      id: 'com.farmtech.app',
      build: '1.0.0',
      version: '1.0.0'
    });
  },
  
  getLaunchUrl: () => {
    return Promise.resolve({
      url: window.location.href
    });
  },
  
  getState: () => {
    return Promise.resolve({
      isActive: document.visibilityState === 'visible'
    });
  }
};

export default { App };