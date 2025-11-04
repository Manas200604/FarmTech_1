/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AnalyticsService from '../analyticsService.js';
import { AnalyticsData } from '../../models/AnalyticsData.js';
import analyticsStorage from '../../utils/analyticsStorage.js';

// Mock the analytics storage
vi.mock('../../utils/analyticsStorage.js', () => ({
  default: {
    getAllAnalytics: vi.fn(),
    addAnalyticsData: vi.fn(),
    getAnalyticsByType: vi.fn(),
    getAnalyticsByDateRange: vi.fn(),
    getDashboardSummary: vi.fn(),
    getGrowthMetrics: vi.fn(),
    saveAnalytics: vi.fn()
  }
}));

describe('AnalyticsService', () => {
  let analyticsService;
  let mockOptions;

  beforeEach(() => {
    mockOptions = {
      serviceName: 'TestAnalyticsService',
      batchSize: 5,
      flushInterval: 1000,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn()
      }
    };
    
    analyticsService = new AnalyticsService(mockOptions);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (analyticsService) {
      analyticsService.stopBatchProcessor();
    }
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const service = new AnalyticsService();
      expect(service.serviceName).toBe('AnalyticsService');
      expect(service.batchSize).toBe(10);
      expect(service.flushInterval).toBe(30000);
    });

    it('should initialize with custom options', () => {
      expect(analyticsService.serviceName).toBe('TestAnalyticsService');
      expect(analyticsService.batchSize).toBe(5);
      expect(analyticsService.flushInterval).toBe(1000);
    });

    it('should initialize sample data when storage is empty', async () => {
      analyticsStorage.getAllAnalytics.mockResolvedValue([]);
      analyticsStorage.saveAnalytics.mockResolvedValue(true);

      await analyticsService.initialize();

      expect(analyticsStorage.getAllAnalytics).toHaveBeenCalled();
      expect(analyticsStorage.saveAnalytics).toHaveBeenCalled();
    });

    it('should not initialize sample data when storage has data', async () => {
      const existingData = [new AnalyticsData({ metricType: 'test', value: 1 })];
      analyticsStorage.getAllAnalytics.mockResolvedValue(existingData);

      await analyticsService.initialize();

      expect(analyticsStorage.getAllAnalytics).toHaveBeenCalled();
      expect(analyticsStorage.saveAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('event tracking', () => {
    it('should track events and add to queue', async () => {
      const eventType = AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS;
      const value = 1;
      const metadata = { userId: 'test-user' };

      const result = await analyticsService.trackEvent(eventType, value, metadata);

      expect(result).toEqual({
        metricType: eventType,
        value: value,
        date: expect.any(Date),
        metadata: metadata,
        aggregationType: 'daily',
        category: 'users'
      });

      expect(analyticsService.eventQueue).toHaveLength(1);
    });

    it('should flush queue when batch size is reached', async () => {
      analyticsStorage.addAnalyticsData.mockResolvedValue(true);

      // Add events up to batch size
      for (let i = 0; i < 5; i++) {
        await analyticsService.trackEvent(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS, 1);
      }

      // Wait for flush to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(analyticsStorage.addAnalyticsData).toHaveBeenCalledTimes(5);
      expect(analyticsService.eventQueue).toHaveLength(0);
    });

    it('should handle tracking errors gracefully', async () => {
      const invalidEventType = null;

      await expect(analyticsService.trackEvent(invalidEventType)).rejects.toThrow();
    });
  });

  describe('user growth metrics', () => {
    it('should get user growth metrics', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      const mockRegistrations = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
          value: 10,
          date: new Date('2023-01-01')
        }),
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
          value: 15,
          date: new Date('2023-01-02')
        })
      ];

      const mockActiveUsers = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.ACTIVE_USERS,
          value: 100,
          date: new Date('2023-01-01')
        })
      ];

      analyticsStorage.getAnalyticsByType
        .mockResolvedValueOnce(mockRegistrations)
        .mockResolvedValueOnce(mockActiveUsers)
        .mockResolvedValueOnce([]); // Previous period data

      const result = await analyticsService.getUserGrowthMetrics(dateRange);

      expect(result).toHaveProperty('registrations');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalRegistrations).toBe(25);
      expect(analyticsStorage.getAnalyticsByType).toHaveBeenCalledTimes(3);
    });

    it('should handle empty data gracefully', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      analyticsStorage.getAnalyticsByType.mockResolvedValue([]);

      const result = await analyticsService.getUserGrowthMetrics(dateRange);

      expect(result.registrations).toEqual([]);
      expect(result.activeUsers).toEqual([]);
      expect(result.summary.totalRegistrations).toBe(0);
    });
  });

  describe('revenue metrics', () => {
    it('should get revenue metrics', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      const mockRevenue = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.REVENUE,
          value: 1000,
          date: new Date('2023-01-01')
        }),
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.REVENUE,
          value: 1500,
          date: new Date('2023-01-02')
        })
      ];

      analyticsStorage.getAnalyticsByType
        .mockResolvedValueOnce(mockRevenue)
        .mockResolvedValueOnce([]) // Orders value
        .mockResolvedValueOnce([]) // Materials revenue
        .mockResolvedValueOnce([]); // Previous period data

      const result = await analyticsService.getRevenueMetrics(dateRange);

      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalRevenue).toBe(2500);
    });
  });

  describe('dashboard summary', () => {
    it('should generate dashboard summary', async () => {
      const mockSummary = {
        totalUsers: 100,
        newRegistrations: 10,
        activeUsers: 80,
        totalRevenue: 5000,
        totalOrders: 25,
        totalUploads: 50,
        approvedUploads: 45,
        conversionRate: 31.25,
        averageOrderValue: 200
      };

      const mockGrowthMetrics = {
        growthRate: 15.5,
        current: 100,
        previous: 85,
        period: 'week'
      };

      analyticsStorage.getDashboardSummary.mockResolvedValue(mockSummary);
      analyticsStorage.getGrowthMetrics.mockResolvedValue(mockGrowthMetrics);

      const result = await analyticsService.generateDashboardSummary();

      expect(result).toEqual({
        ...mockSummary,
        growth: {
          users: 15.5,
          revenue: 15.5,
          orders: 15.5
        },
        dateRange: expect.any(Object)
      });
    });

    it('should use default date range when none provided', async () => {
      analyticsStorage.getDashboardSummary.mockResolvedValue({});
      analyticsStorage.getGrowthMetrics.mockResolvedValue({ growthRate: 0 });

      const result = await analyticsService.generateDashboardSummary();

      expect(result.dateRange).toHaveProperty('start');
      expect(result.dateRange).toHaveProperty('end');
      expect(result.dateRange.start).toBeInstanceOf(Date);
      expect(result.dateRange.end).toBeInstanceOf(Date);
    });
  });

  describe('material popularity', () => {
    it('should get material popularity metrics', async () => {
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      const mockMaterialsSold = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.MATERIALS_SOLD,
          value: 10,
          date: new Date('2023-01-01'),
          metadata: { materialId: 'mat1', materialName: 'Material 1', category: 'pesticides' }
        }),
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.MATERIALS_SOLD,
          value: 5,
          date: new Date('2023-01-02'),
          metadata: { materialId: 'mat2', materialName: 'Material 2', category: 'tools' }
        })
      ];

      const mockMaterialsRevenue = [
        new AnalyticsData({
          metricType: AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE,
          value: 1000,
          date: new Date('2023-01-01'),
          metadata: { materialId: 'mat1' }
        })
      ];

      analyticsStorage.getAnalyticsByType
        .mockResolvedValueOnce(mockMaterialsSold)
        .mockResolvedValueOnce(mockMaterialsRevenue);

      const result = await analyticsService.getMaterialPopularity(dateRange);

      expect(result).toHaveProperty('popularMaterials');
      expect(result).toHaveProperty('summary');
      expect(result.popularMaterials).toHaveLength(2);
      expect(result.popularMaterials[0].totalSold).toBe(10);
      expect(result.popularMaterials[0].totalRevenue).toBe(1000);
    });
  });

  describe('helper methods', () => {
    it('should calculate period metrics correctly', () => {
      const data = [
        { value: 10 },
        { value: 20 },
        { value: 30 }
      ];
      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-03')
      };

      const result = analyticsService.calculatePeriodMetrics(data, dateRange);

      expect(result.total).toBe(60);
      expect(result.average).toBe(20); // 60 / 3 days
      expect(result.peak).toBe(30);
    });

    it('should calculate growth rate correctly', () => {
      expect(analyticsService.calculateGrowthRate(120, 100)).toBe(20);
      expect(analyticsService.calculateGrowthRate(80, 100)).toBe(-20);
      expect(analyticsService.calculateGrowthRate(100, 0)).toBe(100);
      expect(analyticsService.calculateGrowthRate(0, 0)).toBe(0);
    });

    it('should get correct category for event type', () => {
      expect(analyticsService.getCategoryForEventType(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS)).toBe('users');
      expect(analyticsService.getCategoryForEventType(AnalyticsData.METRIC_TYPES.REVENUE)).toBe('financial');
      expect(analyticsService.getCategoryForEventType(AnalyticsData.METRIC_TYPES.ORDERS_COUNT)).toBe('orders');
      expect(analyticsService.getCategoryForEventType('unknown')).toBe('general');
    });
  });

  describe('batch processing', () => {
    it('should flush event queue manually', async () => {
      analyticsStorage.addAnalyticsData.mockResolvedValue(true);

      // Add events to queue
      await analyticsService.trackEvent(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS, 1);
      await analyticsService.trackEvent(AnalyticsData.METRIC_TYPES.REVENUE, 100);

      expect(analyticsService.eventQueue).toHaveLength(2);

      // Flush manually
      await analyticsService.flushEventQueue();

      expect(analyticsService.eventQueue).toHaveLength(0);
      expect(analyticsStorage.addAnalyticsData).toHaveBeenCalledTimes(2);
    });

    it('should handle flush errors and retry', async () => {
      analyticsStorage.addAnalyticsData.mockRejectedValue(new Error('Storage error'));

      // Add event to queue
      await analyticsService.trackEvent(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS, 1);

      // Attempt to flush
      await analyticsService.flushEventQueue();

      // Event should be back in queue for retry
      expect(analyticsService.eventQueue).toHaveLength(1);
    });
  });

  describe('service lifecycle', () => {
    it('should shutdown gracefully', async () => {
      analyticsStorage.addAnalyticsData.mockResolvedValue(true);

      // Add events to queue
      await analyticsService.trackEvent(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS, 1);

      await analyticsService.shutdown();

      // Queue should be flushed
      expect(analyticsService.eventQueue).toHaveLength(0);
      expect(analyticsService.batchProcessor).toBeNull();
    });

    it('should provide health check status', async () => {
      analyticsStorage.getAllAnalytics.mockResolvedValue([
        new AnalyticsData({ metricType: 'test', value: 1 })
      ]);

      const health = await analyticsService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toHaveProperty('totalAnalyticsRecords');
      expect(health.details).toHaveProperty('queueSize');
      expect(health.details).toHaveProperty('batchProcessorActive');
    });

    it('should report unhealthy status on error', async () => {
      analyticsStorage.getAllAnalytics.mockRejectedValue(new Error('Storage error'));

      const health = await analyticsService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toHaveProperty('error');
    });
  });

  describe('error handling', () => {
    it('should handle invalid date ranges', async () => {
      const invalidDateRange = {
        start: new Date('2023-01-31'),
        end: new Date('2023-01-01') // End before start
      };

      await expect(analyticsService.getUserGrowthMetrics(invalidDateRange))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should handle storage errors gracefully', async () => {
      analyticsStorage.getAnalyticsByType.mockRejectedValue(new Error('Storage error'));

      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      await expect(analyticsService.getUserGrowthMetrics(dateRange))
        .rejects.toThrow('Failed to get user growth metrics');
    });
  });
});