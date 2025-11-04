/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MobileWrapper from '../mobile/MobileWrapper';

// Mock hooks
const mockUseCapacitor = {
  isNative: false,
  isAndroid: false,
  isReady: true,
  error: null,
  availablePlugins: []
};

const mockUseNetwork = {
  isConnected: true,
  error: null
};

vi.mock('../../hooks/useCapacitor', () => ({
  default: () => mockUseCapacitor
}));

vi.mock('../../hooks/useNetwork', () => ({
  default: () => mockUseNetwork
}));

// Mock capacitor utils
vi.mock('../../utils/capacitorUtils', () => ({
  default: {
    loadPlugin: vi.fn()
  },
  PluginStatus: {
    AVAILABLE: 'available'
  }
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    logPluginAvailable: vi.fn(),
    logPluginUnavailable: vi.fn(),
    logPluginError: vi.fn()
  }
}));

describe('MobileWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock values
    Object.assign(mockUseCapacitor, {
      isNative: false,
      isAndroid: false,
      isReady: true,
      error: null,
      availablePlugins: []
    });
    Object.assign(mockUseNetwork, {
      isConnected: true,
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when ready', () => {
    render(
      <MobileWrapper>
        <div data-testid="child-content">Test Content</div>
      </MobileWrapper>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should show loading state when not ready', () => {
    mockUseCapacitor.isReady = false;

    render(
      <MobileWrapper>
        <div data-testid="child-content">Test Content</div>
      </MobileWrapper>
    );

    expect(screen.getByText('Initializing app...')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('should render without offline banner when disconnected', () => {
    mockUseNetwork.isConnected = false;

    render(
      <MobileWrapper>
        <div data-testid="child-content">Test Content</div>
      </MobileWrapper>
    );

    expect(screen.queryByText('No internet connection')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for web app', () => {
    const { container } = render(
      <MobileWrapper>
        <div>Test Content</div>
      </MobileWrapper>
    );

    const wrapper = container.querySelector('.mobile-wrapper');
    expect(wrapper).toHaveClass('web-app');
    expect(wrapper).not.toHaveClass('native-app');
  });

  it('should apply correct CSS classes for native app', () => {
    mockUseCapacitor.isNative = true;

    const { container } = render(
      <MobileWrapper>
        <div>Test Content</div>
      </MobileWrapper>
    );

    const wrapper = container.querySelector('.mobile-wrapper');
    expect(wrapper).toHaveClass('native-app');
    expect(wrapper).not.toHaveClass('web-app');
  });

  it('should show error banner in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    mockUseCapacitor.error = 'Capacitor error';
    mockUseNetwork.error = 'Network error';

    render(
      <MobileWrapper>
        <div>Test Content</div>
      </MobileWrapper>
    );

    expect(screen.getByText('Plugin errors detected (click to expand)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should show plugin status in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    mockUseCapacitor.availablePlugins = ['network', 'push-notifications'];

    render(
      <MobileWrapper>
        <div>Test Content</div>
      </MobileWrapper>
    );

    expect(screen.getByText('Platform: Web')).toBeInTheDocument();
    expect(screen.getByText('Plugins: 2')).toBeInTheDocument();
    expect(screen.getByText('network, push-notifications')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show development indicators in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    mockUseCapacitor.error = 'Some error';
    mockUseCapacitor.availablePlugins = ['network'];

    render(
      <MobileWrapper>
        <div>Test Content</div>
      </MobileWrapper>
    );

    expect(screen.queryByText('Plugin errors detected')).not.toBeInTheDocument();
    expect(screen.queryByText('Platform: Web')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});