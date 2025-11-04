import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // Allow external connections for mobile dev
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'clsx'],
          // Separate Capacitor plugins to avoid web bundle issues
          capacitor: ['@capacitor/core']
        }
      },
      // External Capacitor plugins for web builds to prevent WebPlugin errors
      external: (id) => {
        // Only externalize Capacitor plugins in web builds, not in native builds
        if (process.env.CAPACITOR_PLATFORM === 'web') {
          return [
            '@capacitor/app',
            '@capacitor/network', 
            '@capacitor/push-notifications',
            '@capacitor/status-bar',
            '@capacitor/splash-screen'
          ].some(plugin => id.includes(plugin));
        }
        return false;
      }
    },
    target: 'es2015', // Better compatibility with WebView
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : []
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    global: 'globalThis', // Fix for some mobile WebView issues
    // Define build-time constants for conditional compilation
    __CAPACITOR_WEB__: process.env.CAPACITOR_PLATFORM === 'web',
    __CAPACITOR_NATIVE__: process.env.CAPACITOR_PLATFORM !== 'web'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    // Exclude Capacitor plugins from pre-bundling to allow dynamic imports
    exclude: [
      '@capacitor/app',
      '@capacitor/network', 
      '@capacitor/push-notifications',
      '@capacitor/status-bar',
      '@capacitor/splash-screen'
    ]
  },
  // Resolve configuration to handle Capacitor imports properly
  resolve: {
    alias: {
      // Provide web-compatible stubs for Capacitor plugins when building for web
      ...(process.env.CAPACITOR_PLATFORM === 'web' ? {
        '@capacitor/app': new URL('./src/stubs/capacitor-app-stub.js', import.meta.url).pathname,
        '@capacitor/network': new URL('./src/stubs/capacitor-network-stub.js', import.meta.url).pathname,
        '@capacitor/push-notifications': new URL('./src/stubs/capacitor-push-stub.js', import.meta.url).pathname,
        '@capacitor/status-bar': new URL('./src/stubs/capacitor-status-bar-stub.js', import.meta.url).pathname,
        '@capacitor/splash-screen': new URL('./src/stubs/capacitor-splash-stub.js', import.meta.url).pathname
      } : {})
    }
  }
})