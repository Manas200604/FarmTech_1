/**
 * Capacitor Status Bar Plugin Web Stub
 * Provides web-compatible fallbacks for @capacitor/status-bar
 */

export const StatusBar = {
  setStyle: (options) => {
    console.log('StatusBar.setStyle() called in web environment - no action taken', options);
    return Promise.resolve();
  },
  
  setBackgroundColor: (options) => {
    console.log('StatusBar.setBackgroundColor() called in web environment - no action taken', options);
    return Promise.resolve();
  },
  
  setOverlaysWebView: (options) => {
    console.log('StatusBar.setOverlaysWebView() called in web environment - no action taken', options);
    return Promise.resolve();
  },
  
  getInfo: () => {
    console.log('StatusBar.getInfo() called in web environment');
    return Promise.resolve({
      visible: true,
      style: 'LIGHT_CONTENT',
      color: '#000000'
    });
  },
  
  show: () => {
    console.log('StatusBar.show() called in web environment - no action taken');
    return Promise.resolve();
  },
  
  hide: () => {
    console.log('StatusBar.hide() called in web environment - no action taken');
    return Promise.resolve();
  }
};

export const Style = {
  Dark: 'DARK_CONTENT',
  Light: 'LIGHT_CONTENT',
  Default: 'DEFAULT'
};

export default { StatusBar, Style };