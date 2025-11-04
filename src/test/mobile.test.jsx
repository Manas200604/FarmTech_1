import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MobileWrapper from '../components/mobile/MobileWrapper'
import useCapacitor from '../hooks/useCapacitor'
import useNetwork from '../hooks/useNetwork'

// Mock the hooks
vi.mock('../hooks/useCapacitor')
vi.mock('../hooks/useNetwork')

const TestComponent = () => <div>Test Content</div>

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('MobileWrapper', () => {
  it('renders children correctly', () => {
    useCapacitor.mockReturnValue({
      isNative: false,
      isAndroid: false,
      platform: 'web'
    })
    
    useNetwork.mockReturnValue({
      connected: true,
      connectionType: 'wifi'
    })

    renderWithRouter(
      <MobileWrapper>
        <TestComponent />
      </MobileWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('shows offline banner when disconnected', () => {
    useCapacitor.mockReturnValue({
      isNative: false,
      isAndroid: false,
      platform: 'web'
    })
    
    useNetwork.mockReturnValue({
      connected: false,
      connectionType: 'none'
    })

    renderWithRouter(
      <MobileWrapper>
        <TestComponent />
      </MobileWrapper>
    )

    expect(screen.getByText('No internet connection')).toBeInTheDocument()
  })

  it('applies native-app class when on native platform', () => {
    useCapacitor.mockReturnValue({
      isNative: true,
      isAndroid: true,
      platform: 'android'
    })
    
    useNetwork.mockReturnValue({
      connected: true,
      connectionType: 'wifi'
    })

    const { container } = renderWithRouter(
      <MobileWrapper>
        <TestComponent />
      </MobileWrapper>
    )

    expect(container.firstChild).toHaveClass('native-app')
  })
})