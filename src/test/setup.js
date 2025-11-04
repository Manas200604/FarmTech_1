import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Capacitor for testing
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  }
}))

// Mock Capacitor plugins
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn(),
    setBackgroundColor: vi.fn()
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT'
  }
}))

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn()
  }
}))

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(() => Promise.resolve({ connected: true, connectionType: 'wifi' })),
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() }))
  }
}))

vi.mock('@capacitor/app', () => ({
  App: {
    exitApp: vi.fn(),
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() }))
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock URL.createObjectURL for file uploads
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock FileReader for image uploads
global.FileReader = class {
  constructor() {
    this.readAsDataURL = vi.fn()
    this.onload = null
    this.onerror = null
  }
}

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver for responsive components
global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key'
  }
})