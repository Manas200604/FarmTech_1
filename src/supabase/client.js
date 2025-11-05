import { createClient } from '@supabase/supabase-js'
import { validateEnvironmentVariables, getSupabaseConfig } from '../utils/environmentValidation'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
const validation = validateEnvironmentVariables()
const supabaseConfig = getSupabaseConfig()

// Store validation results for use by other components
export const environmentStatus = {
  isValid: validation.isValid,
  hasSupabase: !!supabaseConfig,
  validation,
  canCreateClient: !!supabaseConfig
}

// Only throw error in development mode for better debugging
if (!supabaseConfig && import.meta.env.MODE === 'development') {
  console.error('Supabase configuration missing or invalid:', validation.errors)
}

// Create a safe client that handles missing configuration gracefully
let supabaseClient = null

if (supabaseConfig) {
  try {
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
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
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    supabaseClient = null
  }
}

// Create a proxy object that provides helpful error messages when Supabase is not configured
const createSupabaseProxy = () => {
  const handler = {
    get(target, prop) {
      if (prop === 'auth' || prop === 'from' || prop === 'storage' || prop === 'realtime') {
        throw new Error(
          `Supabase is not properly configured. Cannot access '${prop}'. ` +
          'Please check your environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
        )
      }
      return target[prop]
    }
  }
  return new Proxy({}, handler)
}

// Export the Supabase client or a proxy with helpful error messages
export const supabase = supabaseClient || createSupabaseProxy()

// Export configuration for debugging and validation
export const supabaseDebugConfig = {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasValidConfig: !!supabaseConfig,
  environment: import.meta.env.MODE || 'development',
  clientCreated: !!supabaseClient
}

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => !!supabaseClient

// Helper function to get Supabase client safely
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Supabase client is not available. Please check your environment configuration.')
  }
  return supabaseClient
}