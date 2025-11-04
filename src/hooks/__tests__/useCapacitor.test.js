/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useCapacitor from '../useCapacitor';

// Mock capacitor utils
const mockCapacitorUtils = {
  initialize: vi.fn(),
  loadPlugin: vi.fn(),
  getEnvironmentInfo: vi.fn()
};

vi.mock('../utils/capacitorUtils', () => ({
  default: mockCapacitorUtils,
  PluginStatus: {
    LOADING: 'loading',
    AVAILABLE: 'available',
    FALLBACK: 'fallback',
    UNAVAILABLE: 'unavailable',
    ERROR: 'error'
  }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    logPluginAvailable: vi.fn(),
    logPluginError: vi.fn()
  }
}));

describe('useCapacitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    mockCapacitorUtils.initialize.mockResolvedValue({
      platform: 'web',
      isNative: false,
      isReady: true,
      availablePlugins: []
    });

    const { result } = renderHook(() => useCapacitor());

    expect(result.current.isNative).toBe(false);
    expect(result.current.platform).toBe('web');
    expect(result.current.isReady).toBe(false);
    expect(result.current.isWeb).toBe(true);
  });

  it('should update state after initialization', async () => {
    mockCapacitorUtils.initialize.mockResolvedValue({
      platform: 'android',
      isNative: true,
      isReady: true,
      availablePlugins: ['network', 'push-notifications']
    });

    const { result } = renderHook(() => useCapacitor());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.isNative).toBe(true);
    expect(result.current.platform).toBe('android');
    expect(result.current.isAndroid).toBe(true);
    expect(result.current.availablePlugins).toEqual(['network', 'push-notifications']);
  });

  it('should handle initialization errors gracefully', async () => {
    const error = new Error('Initialization failed');
    mockCapacitorUtils.initialize.mockRejectedValue(error);

    const { result } = renderHook(() => useCapacitor());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.error).toBe('Initialization failed');
    expect(result.current.isNative).toBe(false);
    expect(result.current.platform).toBe('web');
  });

  it('should provide utility functions', async () => {
    mockCapacitorUtils.initialize.mockResolvedValue({
      platform: 'web',
      isNative: false,
      isReady: true,
      availablePlugins: ['network']
    });

    mockCapacitorUtils.getEnvironmentInfo.mockReturnValue({
      platform: 'web',
      isNative: false
    });

    const { result } = renderHook(() => useCapacitor());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.isPluginAvailable('network')).toBe(true);
    expect(result.current.isPluginAvailable('nonexistent')).toBe(false);
    expect(result.current.getEnvironmentInfo()).toEqual({
      platform: 'web',
      isNative: false
    });
  });
});