import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file contains:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  )
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error('Invalid VITE_SUPABASE_URL format. Please check your environment variables.')
}

// Create Supabase client with mobile-optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile apps
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'farmtech-auth-token'
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // Optimize for mobile bandwidth
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'farmtech-mobile-app'
    }
  }
})

// Export configuration for debugging
export const supabaseConfig = {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  environment: import.meta.env.MODE || 'development'
}