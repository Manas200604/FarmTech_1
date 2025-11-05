import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine if this is a Netlify build or web deployment
const isNetlifyBuild = process.env.NETLIFY === 'true' || process.env.CONTEXT === 'production' || process.env.CONTEXT === 'deploy-preview'
const isWebBuild = process.env.CAPACITOR_PLATFORM === 'web' || isNetlifyBuild

// Set CAPACITOR_PLATFORM=web for Netlify builds
if (isNetlifyBuild && !process.env.CAPACITOR_PLATFORM) {
  process.env.CAPACITOR_PLATFORM = 'web'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure proper base path for Netlify deployment
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // Allow external connections for mobile dev
    cors: true,
    // Enable SPA fallback for development
    historyApiFallback: {
      index: '/index.html',
      rewrites: [
        { from: /^\/admin/, to: '/index.html' },
        { from: /^\/dashboard/, to: '/index.html' },
        { from: /^\/login/, to: '/index.html' },
        { from: /^\/register/, to: '/index.html' }
      ]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: !isNetlifyBuild, // Disable sourcemaps for production Netlify builds
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        // Optimized chunk splitting for Netlify deployment
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }
          // Supabase and authentication
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'supabase'
          }
          // Routing
          if (id.includes('react-router')) {
            return 'router'
          }
          // UI libraries
          if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind')) {
            return 'ui'
          }
          // Capacitor core (only include if not web build)
          if (id.includes('@capacitor/core') && !isWebBuild) {
            return 'capacitor'
          }
          // Large third-party libraries
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // Optimized asset file naming for CDN caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `fonts/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Optimized chunk file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: `js/[name]-[hash].js`
      },
      // External Capacitor plugins for web builds to prevent WebPlugin errors
      external: (id) => {
        // Only externalize Capacitor plugins in web builds, not in native builds
        if (isWebBuild) {
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
    target: isWebBuild ? 'es2020' : 'es2015', // Modern target for web, compatible for mobile
    minify: isNetlifyBuild ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: isNetlifyBuild,
        drop_debugger: isNetlifyBuild,
        pure_funcs: isNetlifyBuild ? ['console.log', 'console.info'] : []
      },
      mangle: {
        safari10: true // Fix Safari 10 issues
      }
    },
    chunkSizeWarningLimit: 1000,
    // Optimize for Netlify CDN
    assetsInlineLimit: 4096, // Inline small assets
    cssCodeSplit: true, // Split CSS for better caching
    reportCompressedSize: false // Disable for faster builds
  },
  define: {
    global: 'globalThis', // Fix for some mobile WebView issues
    // Define build-time constants for conditional compilation
    __CAPACITOR_WEB__: isWebBuild,
    __CAPACITOR_NATIVE__: !isWebBuild,
    __NETLIFY_BUILD__: isNetlifyBuild,
    // Environment-specific constants
    __DEV__: !isNetlifyBuild && process.env.NODE_ENV !== 'production'
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'react-router-dom', 'lucide-react'],
    // Exclude Capacitor plugins from pre-bundling for web builds
    exclude: isWebBuild ? [
      '@capacitor/app',
      '@capacitor/network', 
      '@capacitor/push-notifications',
      '@capacitor/status-bar',
      '@capacitor/splash-screen',
      '@capacitor/core'
    ] : []
  },
  // Resolve configuration to handle Capacitor imports properly
  resolve: {
    alias: {
      // Provide web-compatible stubs for Capacitor plugins when building for web
      ...(isWebBuild ? {
        '@capacitor/app': new URL('./src/stubs/capacitor-app-stub.js', import.meta.url).pathname,
        '@capacitor/network': new URL('./src/stubs/capacitor-network-stub.js', import.meta.url).pathname,
        '@capacitor/push-notifications': new URL('./src/stubs/capacitor-push-stub.js', import.meta.url).pathname,
        '@capacitor/status-bar': new URL('./src/stubs/capacitor-status-bar-stub.js', import.meta.url).pathname,
        '@capacitor/splash-screen': new URL('./src/stubs/capacitor-splash-stub.js', import.meta.url).pathname
      } : {})
    }
  },
  
  // Additional configuration for Netlify deployment
  ...(isNetlifyBuild && {
    esbuild: {
      // Optimize for production builds
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  })
})