/**
 * Analytics Storage Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsStorage } from '../analyticsStorage.js';
import { AnalyticsData } from '../../models/AnalyticsData.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AnalyticsStorage', () => {
  let analyticsStorage;

  beforeEach(() => {
    analyticsStorage = new AnalyticsStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    analyticsStorage.clearCache();
  });

  describe('data persistence', () => {
    it('should save analytics data to localStorage', async () => {
      const analyticsData = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
          value: 10,
          date: new Date('2023-01-01')
        })
      ];

      const result = await analyticsStorage.saveAnalytics(analyticsData);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'farmtech_analytics',
        expect.stringContaining('USER_REGISTRATIONS')
      );
    });

    it('should load analytics data from localStorage', async () => {
      const mockData = {
        data: [
          {
            id: 'test-id',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 10,
            date: '2023-01-01T00:00:00.000Z',
            aggregationType: 'daily',
            category: 'users'
          }
        ],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = await analyticsStorage.getAllAnalytics();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AnalyticsData);
      expect(result[0].metricType).toBe(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS);
    });

    it('should return empty array when no data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await analyticsStorage.getAllAnalytics();

      expect(result).toEqual([]);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await analyticsStorage.getAllAnalytics();

      expect(result).toEqual([]);
    });
  });

  describe('data operations', () => {
    it('should add new analytics data', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: [] }));
      localStorageMock.setItem.mockImplementation(() => {});

      const analyticsData = {
        metricType: AnalyticsData.METRIC_TYPES.REVENUE,
        value: 1000,
        date: new Date('2023-01-01')
      };

      const result = await analyticsStorage.addAnalyticsData(analyticsData);

      expect(result).toBeInstanceOf(AnalyticsData);
      expect(result.metricType).toBe(AnalyticsData.METRIC_TYPES.REVENUE);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should validate analytics data before adding', async () => {
      const invalidData = {
        metricType: '', // Invalid - empty metric type
        value: 'invalid', // Invalid - not a number
        date: new Date('2023-01-01')
      };

      await expect(analyticsStorage.addAnalyticsData(invalidData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('data filtering', () => {
    beforeEach(() => {
      const mockData = {
        data: [
          {
            id: '1',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 10,
            date: '2023-01-01T00:00:00.000Z',
            category: 'users'
          },
          {
            id: '2',
            metricType: AnalyticsData.METRIC_TYPES.REVENUE,
            value: 1000,
            date: '2023-01-02T00:00:00.000Z',
            category: 'financial'
          },
          {
            id: '3',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 5,
            date: '2023-01-03T00:00:00.000Z',
            category: 'users'
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('should filter analytics by metric type', async () => {
      const result = await analyticsStorage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS
      );

      expect(result).toHaveLength(2);
      expect(result.every(item => item.metricType === AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS)).toBe(true);
    });

    it('should filter analytics by date range', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-02')
      };

      const result = await analyticsStorage.getAnalyticsByDateRange(
        dateRange.start,
        dateRange.end
      );

      expect(result).toHaveLength(2);
    });

    it('should filter analytics by category', async () => {
      const result = await analyticsStorage.getAnalyticsByCategory('users');

      expect(result).toHaveLength(2);
      expect(result.every(item => item.category === 'users')).toBe(true);
    });

    it('should filter by metric type and date range', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-01')
      };

      const result = await analyticsStorage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        dateRange
      );

      expect(result).toHaveLength(1);
      expect(result[0].metricType).toBe(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS);
    });
  });

  describe('aggregation', () => {
    beforeEach(() => {
      const mockData = {
        data: [
          {
            id: '1',
            metricType: AnalyticsData.METRIC_TYPES.REVENUE,
            value: 1000,
            date: '2023-01-01T00:00:00.000Z'
          },
          {
            id: '2',
            metricType: AnalyticsData.METRIC_TYPES.REVENUE,
            value: 1500,
            date: '2023-01-01T12:00:00.000Z'
          },
          {
            id: '3',
            metricType: AnalyticsData.METRIC_TYPES.REVENUE,
            value: 2000,
            date: '2023-01-02T00:00:00.000Z'
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('should aggregate metrics by day', async () => {
      const result = await analyticsStorage.getAggregatedMetrics(
        AnalyticsData.METRIC_TYPES.REVENUE,
        'daily'
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(2500); // 1000 + 1500
      expect(result[1].value).toBe(2000);
    });

    it('should aggregate metrics by week', async () => {
      const result = await analyticsStorage.getAggregatedMetrics(
        AnalyticsData.METRIC_TYPES.REVENUE,
        'weekly'
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(4500); // All values in same week
    });

    it('should aggregate metrics by month', async () => {
      const result = await analyticsStorage.getAggregatedMetrics(
        AnalyticsData.METRIC_TYPES.REVENUE,
        'monthly'
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(4500); // All values in same month
    });
  });

  describe('dashboard summary', () => {
    beforeEach(() => {
      const mockData = {
        data: [
          {
            id: '1',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 10,
            date: '2023-01-01T00:00:00.000Z'
          },
          {
            id: '2',
            metricType: AnalyticsData.METRIC_TYPES.ACTIVE_USERS,
            value: 100,
            date: '2023-01-01T00:00:00.000Z'
          },
          {
            id: '3',
            metricType: AnalyticsData.METRIC_TYPES.REVENUE,
            value: 5000,
            date: '2023-01-01T00:00:00.000Z'
          },
          {
            id: '4',
            metricType: AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
            value: 25,
            date: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('should generate dashboard summary', async () => {
      const result = await analyticsStorage.getDashboardSummary();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('newRegistrations');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('averageOrderValue');

      expect(result.newRegistrations).toBe(10);
      expect(result.totalRevenue).toBe(5000);
      expect(result.totalOrders).toBe(25);
      expect(result.averageOrderValue).toBe(200); // 5000 / 25
    });
  });

  describe('growth metrics', () => {
    beforeEach(() => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const mockData = {
        data: [
          {
            id: '1',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 10,
            date: twoWeeksAgo.toISOString()
          },
          {
            id: '2',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 15,
            date: weekAgo.toISOString()
          },
          {
            id: '3',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 20,
            date: now.toISOString()
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('should calculate growth metrics', async () => {
      const result = await analyticsStorage.getGrowthMetrics(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        'week'
      );

      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('previous');
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('period');

      expect(result.period).toBe('week');
      expect(typeof result.growthRate).toBe('number');
    });
  });

  describe('event tracking', () => {
    it('should track events with default values', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: [] }));
      localStorageMock.setItem.mockImplementation(() => {});

      const result = await analyticsStorage.trackEvent(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS
      );

      expect(result).toBeInstanceOf(AnalyticsData);
      expect(result.value).toBe(1);
      expect(result.category).toBe('users');
    });

    it('should track events with custom values', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: [] }));
      localStorageMock.setItem.mockImplementation(() => {});

      const result = await analyticsStorage.trackEvent(
        AnalyticsData.METRIC_TYPES.REVENUE,
        1000,
        { source: 'material-sale' }
      );

      expect(result.value).toBe(1000);
      expect(result.metadata.source).toBe('material-sale');
      expect(result.category).toBe('financial');
    });
  });

  describe('caching', () => {
    it('should cache data and return from cache', async () => {
      const mockData = { data: [] };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      // First call - should hit localStorage
      await analyticsStorage.getAllAnalytics();
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      await analyticsStorage.getAllAnalytics();
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should invalidate cache after timeout', async () => {
      const mockData = { data: [] };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      // Set a very short cache duration for testing
      analyticsStorage.cache.set('all_analytics', {
        data: [],
        timestamp: Date.now() - 10000 // 10 seconds ago
      });

      // Should hit localStorage again due to expired cache
      await analyticsStorage.getAllAnalytics();
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });

    it('should clear cache manually', async () => {
      analyticsStorage.setCache('test-key', { data: 'test' });
      expect(analyticsStorage.getFromCache('test-key')).toEqual({ data: 'test' });

      analyticsStorage.clearCache();
      expect(analyticsStorage.getFromCache('test-key')).toBeNull();
    });
  });

  describe('data export', () => {
    beforeEach(() => {
      const mockData = {
        data: [
          {
            id: '1',
            metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
            value: 10,
            date: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('should export analytics data', async () => {
      const result = await analyticsStorage.exportAnalytics();

      expect(result).toHaveProperty('analytics');
      expect(result).toHaveProperty('exportedAt');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('totalRecords');

      expect(result.analytics).toHaveLength(1);
      expect(result.format).toBe('json');
      expect(result.totalRecords).toBe(1);
    });

    it('should export analytics data with date range filter', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-01')
      };

      const result = await analyticsStorage.exportAnalytics('json', dateRange);

      expect(result.analytics).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await analyticsStorage.getAllAnalytics();
      expect(result).toEqual([]);
    });

    it('should handle save errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await analyticsStorage.saveAnalytics([]);
      expect(result).toBe(false);
    });
  });
});