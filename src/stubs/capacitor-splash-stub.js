/**
 * Capacitor Splash Screen Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/splash-screen
 */

export const SplashScreen = {
  show: (options) => {
    console.log('SplashScreen.show() called in web environment - no action taken', options);
    return Promise.resolve();
  },
  
  hide: (options) => {
    console.log('SplashScreen.hide() called in web environment - no action taken', options);
    return Promise.resolve();
  }
};

export default { SplashScreen };