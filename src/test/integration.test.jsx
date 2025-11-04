import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import ErrorBoundary from '../components/ErrorBoundary'
import useCapacitor from '../hooks/useCapacitor'
import useNetwork from '../hooks/useNetwork'

// Mock Supabase
vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

// Mock hooks
vi.mock('../hooks/useCapacitor')
vi.mock('../hooks/useNetwork')

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: () => null
}))

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(useCapacitor).mockReturnValue({
      isNative: false,
      isAndroid: false,
      platform: 'web'
    })

    vi.mocked(useNetwork).mockReturnValue({
      connected: true,
      connectionType: 'wifi'
    })
  })

  it('renders without crashing', async () => {
    render(<App />)

    // Should render the app without errors
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows login page when not authenticated', async () => {
    render(<App />)

    await waitFor(() => {
      // Should show login form
      expect(screen.getByText('Login')).toBeInTheDocument()
    })
  })

  it('initializes mobile wrapper correctly', async () => {
    const { container } = render(<App />)

    await waitFor(() => {
      // Should have mobile wrapper
      const mobileWrapper = container.querySelector('.mobile-wrapper')
      expect(mobileWrapper).toBeInTheDocument()
    })
  })

  it('handles network status correctly', async () => {
    // Mock offline network
    vi.mocked(useNetwork).mockReturnValue({
      connected: false,
      connectionType: 'none'
    })

    render(<App />)

    await waitFor(() => {
      // Should not show offline banner (removed from UI)
      expect(screen.queryByText('No internet connection')).not.toBeInTheDocument()
    })
  })
})

describe('Capacitor Integration Tests', () => {
  it('detects platform correctly', () => {
    vi.mocked(useCapacitor).mockReturnValue({
      isNative: true,
      isAndroid: true,
      platform: 'android'
    })

    const { container } = render(<App />)

    // Should apply native-app class
    const mobileWrapper = container.querySelector('.mobile-wrapper')
    expect(mobileWrapper).toHaveClass('native-app')
  })

  it('handles web platform correctly', () => {
    vi.mocked(useCapacitor).mockReturnValue({
      isNative: false,
      isAndroid: false,
      platform: 'web'
    })

    const { container } = render(<App />)

    // Should apply web-app class
    const mobileWrapper = container.querySelector('.mobile-wrapper')
    expect(mobileWrapper).toHaveClass('web-app')
  })
})

describe('Error Handling Integration', () => {
  it('catches and handles errors gracefully', async () => {
    // Mock component that throws error
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    const AppWithError = () => (
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    render(<AppWithError />)

    await waitFor(() => {
      // Should show error boundary UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })
  })
})

describe('Offline Functionality Integration', () => {
  it('handles offline data caching', async () => {
    const { offlineStorage } = await import('../utils/offlineStorage')

    // Test cache functionality
    const testData = { id: 1, name: 'Test' }
    offlineStorage.setCache('test-key', testData, 60)

    const cachedData = offlineStorage.getCache('test-key')
    expect(cachedData).toEqual(testData)
  })

  it('handles offline queue operations', async () => {
    const { offlineStorage } = await import('../utils/offlineStorage')

    // Test queue functionality
    const operation = {
      action: 'create',
      table: 'test_table',
      data: { name: 'Test Item' }
    }

    const queueId = offlineStorage.addToQueue(operation)
    expect(queueId).toBeTruthy()

    const queue = offlineStorage.getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject(operation)
  })
})