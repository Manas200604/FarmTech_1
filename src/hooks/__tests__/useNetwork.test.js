/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useNetwork from '../useNetwork';

// Mock capacitor utils
const mockCapacitorUtils = {
  initialize: vi.fn(),
  loadPlugin: vi.fn()
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
    logPluginLoading: vi.fn(),
    logPluginAvailable: vi.fn(),
    logPluginFallback: vi.fn(),
    logPluginError: vi.fn()
  }
}));

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

describe('useNetwork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'fallback',
      fallbackAvailable: true
    });

    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionType).toBe('wifi');
    expect(result.current.isOnline).toBe(true);
  });

  it('should use web fallback when plugin unavailable', async () => {
    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'fallback',
      fallbackAvailable: true
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionType).toBe('wifi');
  });

  it('should handle offline state', async () => {
    navigator.onLine = false;
    
    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'fallback',
      fallbackAvailable: true
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionType).toBe('none');
  });

  it('should respond to online/offline events', async () => {
    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'fallback',
      fallbackAvailable: true
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    // Simulate going offline
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Simulate going online
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle native plugin when available', async () => {
    const mockNetwork = {
      getStatus: vi.fn().mockResolvedValue({
        connected: true,
        connectionType: 'cellular'
      }),
      addListener: vi.fn().mockResolvedValue({
        remove: vi.fn()
      })
    };

    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'available',
      plugin: { Network: mockNetwork }
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    expect(mockNetwork.getStatus).toHaveBeenCalled();
    expect(result.current.connectionType).toBe('cellular');
  });

  it('should provide refresh functionality', async () => {
    mockCapacitorUtils.initialize.mockResolvedValue({});
    mockCapacitorUtils.loadPlugin.mockResolvedValue({
      status: 'fallback',
      fallbackAvailable: true
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    expect(typeof result.current.refresh).toBe('function');
    
    // Test refresh function
    await act(async () => {
      await result.current.refresh();
    });
  });
});