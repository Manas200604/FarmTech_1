/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import capacitorUtils, { PluginStatus } from '../capacitorUtils';

// Mock Capacitor core
const mockCapacitor = {
  isNativePlatform: vi.fn(),
  getPlatform: vi.fn()
};

// Mock dynamic imports
vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(),
    addListener: vi.fn()
  }
}));

describe('CapacitorUtils', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset capacitor utils state
    capacitorUtils.isInitialized = false;
    capacitorUtils.environment = null;
    capacitorUtils.pluginCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect web environment when Capacitor is not available', async () => {
      // Mock import failure
      vi.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });

      const environment = await capacitorUtils.initialize();

      expect(environment.platform).toBe('web');
      expect(environment.isNative).toBe(false);
      expect(environment.isReady).toBe(true);
    });

    it('should detect native environment when Capacitor is available', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('android');

      const environment = await capacitorUtils.initialize();

      expect(environment.platform).toBe('android');
      expect(environment.isNative).toBe(true);
      expect(environment.isReady).toBe(true);
    });

    it('should detect web platform when Capacitor is available but not native', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false);
      mockCapacitor.getPlatform.mockReturnValue('web');

      const environment = await capacitorUtils.initialize();

      expect(environment.platform).toBe('web');
      expect(environment.isNative).toBe(false);
      expect(environment.isReady).toBe(true);
    });
  });

  describe('Plugin Loading', () => {
    beforeEach(async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false);
      mockCapacitor.getPlatform.mockReturnValue('web');
      await capacitorUtils.initialize();
    });

    it('should return fallback status for web environment', async () => {
      const result = await capacitorUtils.loadPlugin('network');

      expect(result.status).toBe(PluginStatus.FALLBACK);
      expect(result.isNative).toBe(false);
      expect(result.fallbackAvailable).toBe(true);
    });

    it('should cache plugin loading results', async () => {
      const result1 = await capacitorUtils.loadPlugin('network');
      const result2 = await capacitorUtils.loadPlugin('network');

      expect(result1).toBe(result2); // Same object reference
    });

    it('should detect fallback support correctly', () => {
      expect(capacitorUtils.hasFallbackSupport('network')).toBe(true);
      expect(capacitorUtils.hasFallbackSupport('push-notifications')).toBe(true);
      expect(capacitorUtils.hasFallbackSupport('status-bar')).toBe(false);
    });
  });

  describe('Native Environment', () => {
    beforeEach(async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('android');
      await capacitorUtils.initialize();
    });

    it('should attempt to load native plugins', async () => {
      const result = await capacitorUtils.loadPlugin('network');

      expect(result.isNative).toBe(true);
      // Result status depends on whether the mock plugin loads successfully
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false);
      mockCapacitor.getPlatform.mockReturnValue('web');
      await capacitorUtils.initialize();
    });

    it('should return correct environment info', () => {
      const info = capacitorUtils.getEnvironmentInfo();

      expect(info.platform).toBe('web');
      expect(info.isNative).toBe(false);
      expect(info.isReady).toBe(true);
    });

    it('should return correct native environment status', () => {
      expect(capacitorUtils.isNativeEnvironment()).toBe(false);
    });

    it('should check plugin availability correctly', async () => {
      await capacitorUtils.loadPlugin('network');
      
      expect(capacitorUtils.isPluginAvailable('network')).toBe(true);
      expect(capacitorUtils.isPluginAvailable('nonexistent')).toBe(false);
    });
  });
});