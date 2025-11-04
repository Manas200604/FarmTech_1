/**
 * Analytics Service
 * Handles analytics data collection, aggregation, and reporting
 */

import BaseAdminService from './BaseAdminService.js';
import { AnalyticsData } from '../models/AnalyticsData.js';
import analyticsStorage from '../utils/analyticsStorage.js';
import { createOperationError, createValidationError } from './AdminServiceError.js';

export class AnalyticsService extends BaseAdminService {
  constructor(options = {}) {
    super({ ...options, serviceName: 'AnalyticsService' });
    this.storage = analyticsStorage;
    this.eventQueue = [];
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds
    this.startBatchProcessor();
  }

  // Initialize service
  async initialize() {
    this.logInfo('Analytics service initializing...');
    
    // Initialize with sample data if empty
    const existingData = await this.storage.getAllAnalytics();
    if (existingData.length === 0) {
      await this.initializeSampleData();
    }
    
    this.logInfo('Analytics service initialized successfully');
  }

  // Start batch processor for events
  startBatchProcessor() {
    this.batchProcessor = setInterval(() => {
      this.flushEventQueue();
    }, this.flushInterval);
  }

  // Stop batch processor
  stopBatchProcessor() {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
      this.batchProcessor = null;
    }
  }

  // Flush event queue
  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, this.batchSize);
    
    try {
      for (const event of events) {
        await this.storage.addAnalyticsData(event);
      }
      this.logInfo(`Flushed ${events.length} analytics events`);
    } catch (error) {
      this.logError('Error flushing analytics events', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  // Track event (add to queue for batch processing)
  async trackEvent(eventType, value = 1, metadata = {}) {
    try {
      const analyticsData = {
        metricType: eventType,
        value: value,
        date: new Date(),
        metadata: metadata,
        aggregationType: 'daily',
        category: this.getCategoryForEventType(eventType)
      };

      // Add to queue for batch processing
      this.eventQueue.push(analyticsData);

      // If queue is full, flush immediately
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEventQueue();
      }

      return analyticsData;
    } catch (error) {
      this.logError('Error tracking event', error, { eventType, value, metadata });
      throw createOperationError('Failed to track analytics event', { eventType, error: error.message });
    }
  }

  // Get user growth metrics
  async getUserGrowthMetrics(dateRange) {
    try {
      this.validateDateRange(dateRange.start, dateRange.end);

      const registrations = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        dateRange
      );

      const activeUsers = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.ACTIVE_USERS,
        dateRange
      );

      // Calculate growth metrics
      const currentPeriod = this.calculatePeriodMetrics(registrations, dateRange);
      const previousPeriod = await this.getPreviousPeriodMetrics(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        dateRange
      );

      const growthRate = this.calculateGrowthRate(currentPeriod.total, previousPeriod.total);

      return {
        registrations: registrations.map(r => ({
          date: r.date,
          value: r.value,
          formattedValue: r.getFormattedValue()
        })),
        activeUsers: activeUsers.map(a => ({
          date: a.date,
          value: a.value,
          formattedValue: a.getFormattedValue()
        })),
        summary: {
          totalRegistrations: currentPeriod.total,
          averageDaily: currentPeriod.average,
          growthRate: growthRate,
          peakDay: currentPeriod.peak
        }
      };
    } catch (error) {
      this.logError('Error getting user growth metrics', error, { dateRange });
      throw createOperationError('Failed to get user growth metrics', { error: error.message });
    }
  }

  // Get revenue metrics
  async getRevenueMetrics(dateRange) {
    try {
      this.validateDateRange(dateRange.start, dateRange.end);

      const revenue = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.REVENUE,
        dateRange
      );

      const ordersValue = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.ORDERS_VALUE,
        dateRange
      );

      const materialsRevenue = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE,
        dateRange
      );

      // Calculate revenue metrics
      const currentPeriod = this.calculatePeriodMetrics(revenue, dateRange);
      const previousPeriod = await this.getPreviousPeriodMetrics(
        AnalyticsData.METRIC_TYPES.REVENUE,
        dateRange
      );

      const growthRate = this.calculateGrowthRate(currentPeriod.total, previousPeriod.total);

      return {
        revenue: revenue.map(r => ({
          date: r.date,
          value: r.value,
          formattedValue: r.getFormattedValue()
        })),
        ordersValue: ordersValue.map(o => ({
          date: o.date,
          value: o.value,
          formattedValue: o.getFormattedValue()
        })),
        materialsRevenue: materialsRevenue.map(m => ({
          date: m.date,
          value: m.value,
          formattedValue: m.getFormattedValue()
        })),
        summary: {
          totalRevenue: currentPeriod.total,
          averageDaily: currentPeriod.average,
          growthRate: growthRate,
          peakDay: currentPeriod.peak
        }
      };
    } catch (error) {
      this.logError('Error getting revenue metrics', error, { dateRange });
      throw createOperationError('Failed to get revenue metrics', { error: error.message });
    }
  }

  // Get order metrics
  async getOrderMetrics(dateRange) {
    try {
      this.validateDateRange(dateRange.start, dateRange.end);

      const ordersCount = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
        dateRange
      );

      const averageOrderValue = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE,
        dateRange
      );

      const conversionRate = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.CONVERSION_RATE,
        dateRange
      );

      // Calculate order metrics
      const currentPeriod = this.calculatePeriodMetrics(ordersCount, dateRange);
      const previousPeriod = await this.getPreviousPeriodMetrics(
        AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
        dateRange
      );

      const growthRate = this.calculateGrowthRate(currentPeriod.total, previousPeriod.total);

      return {
        ordersCount: ordersCount.map(o => ({
          date: o.date,
          value: o.value,
          formattedValue: o.getFormattedValue()
        })),
        averageOrderValue: averageOrderValue.map(a => ({
          date: a.date,
          value: a.value,
          formattedValue: a.getFormattedValue()
        })),
        conversionRate: conversionRate.map(c => ({
          date: c.date,
          value: c.value,
          formattedValue: c.getFormattedValue()
        })),
        summary: {
          totalOrders: currentPeriod.total,
          averageDaily: currentPeriod.average,
          growthRate: growthRate,
          peakDay: currentPeriod.peak
        }
      };
    } catch (error) {
      this.logError('Error getting order metrics', error, { dateRange });
      throw createOperationError('Failed to get order metrics', { error: error.message });
    }
  }

  // Get upload metrics
  async getUploadMetrics(dateRange) {
    try {
      this.validateDateRange(dateRange.start, dateRange.end);

      const uploadsCount = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.UPLOADS_COUNT,
        dateRange
      );

      const uploadsApproved = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED,
        dateRange
      );

      // Calculate approval rate
      const approvalRates = uploadsCount.map(upload => {
        const approved = uploadsApproved.find(a => 
          new Date(a.date).toDateString() === new Date(upload.date).toDateString()
        );
        const approvalRate = approved && upload.value > 0 ? (approved.value / upload.value) * 100 : 0;
        
        return {
          date: upload.date,
          totalUploads: upload.value,
          approvedUploads: approved ? approved.value : 0,
          approvalRate: Math.round(approvalRate * 100) / 100
        };
      });

      // Calculate upload metrics
      const currentPeriod = this.calculatePeriodMetrics(uploadsCount, dateRange);
      const previousPeriod = await this.getPreviousPeriodMetrics(
        AnalyticsData.METRIC_TYPES.UPLOADS_COUNT,
        dateRange
      );

      const growthRate = this.calculateGrowthRate(currentPeriod.total, previousPeriod.total);

      return {
        uploadsCount: uploadsCount.map(u => ({
          date: u.date,
          value: u.value,
          formattedValue: u.getFormattedValue()
        })),
        uploadsApproved: uploadsApproved.map(u => ({
          date: u.date,
          value: u.value,
          formattedValue: u.getFormattedValue()
        })),
        approvalRates: approvalRates,
        summary: {
          totalUploads: currentPeriod.total,
          averageDaily: currentPeriod.average,
          growthRate: growthRate,
          overallApprovalRate: this.calculateOverallApprovalRate(approvalRates)
        }
      };
    } catch (error) {
      this.logError('Error getting upload metrics', error, { dateRange });
      throw createOperationError('Failed to get upload metrics', { error: error.message });
    }
  }

  // Get material popularity metrics
  async getMaterialPopularity(dateRange) {
    try {
      this.validateDateRange(dateRange.start, dateRange.end);

      const materialsSold = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.MATERIALS_SOLD,
        dateRange
      );

      const materialsRevenue = await this.storage.getAnalyticsByType(
        AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE,
        dateRange
      );

      // Group by material (using metadata)
      const materialStats = new Map();

      materialsSold.forEach(item => {
        const materialId = item.metadata.materialId || 'unknown';
        const materialName = item.metadata.materialName || 'Unknown Material';
        
        if (!materialStats.has(materialId)) {
          materialStats.set(materialId, {
            id: materialId,
            name: materialName,
            totalSold: 0,
            totalRevenue: 0,
            category: item.metadata.category || 'unknown'
          });
        }
        
        materialStats.get(materialId).totalSold += item.value;
      });

      materialsRevenue.forEach(item => {
        const materialId = item.metadata.materialId || 'unknown';
        if (materialStats.has(materialId)) {
          materialStats.get(materialId).totalRevenue += item.value;
        }
      });

      // Convert to array and sort by popularity
      const popularMaterials = Array.from(materialStats.values())
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10); // Top 10

      return {
        popularMaterials,
        summary: {
          totalMaterialsSold: materialsSold.reduce((sum, item) => sum + item.value, 0),
          totalMaterialsRevenue: materialsRevenue.reduce((sum, item) => sum + item.value, 0),
          uniqueMaterials: materialStats.size
        }
      };
    } catch (error) {
      this.logError('Error getting material popularity metrics', error, { dateRange });
      throw createOperationError('Failed to get material popularity metrics', { error: error.message });
    }
  }

  // Generate dashboard summary
  async generateDashboardSummary(dateRange = null) {
    try {
      const defaultRange = dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };

      const summary = await this.storage.getDashboardSummary(defaultRange);

      // Get growth metrics for key indicators
      const userGrowth = await this.storage.getGrowthMetrics(
        AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        'week'
      );

      const revenueGrowth = await this.storage.getGrowthMetrics(
        AnalyticsData.METRIC_TYPES.REVENUE,
        'week'
      );

      const orderGrowth = await this.storage.getGrowthMetrics(
        AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
        'week'
      );

      return {
        ...summary,
        growth: {
          users: userGrowth.growthRate,
          revenue: revenueGrowth.growthRate,
          orders: orderGrowth.growthRate
        },
        dateRange: defaultRange
      };
    } catch (error) {
      this.logError('Error generating dashboard summary', error);
      throw createOperationError('Failed to generate dashboard summary', { error: error.message });
    }
  }

  // Helper methods
  calculatePeriodMetrics(data, dateRange) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const days = Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24));
    const average = days > 0 ? total / days : 0;
    const peak = data.reduce((max, item) => Math.max(max, item.value), 0);

    return { total, average, peak };
  }

  async getPreviousPeriodMetrics(metricType, dateRange) {
    const periodLength = new Date(dateRange.end) - new Date(dateRange.start);
    const previousStart = new Date(new Date(dateRange.start) - periodLength);
    const previousEnd = new Date(dateRange.start);

    const previousData = await this.storage.getAnalyticsByType(metricType, {
      start: previousStart,
      end: previousEnd
    });

    return this.calculatePeriodMetrics(previousData, {
      start: previousStart,
      end: previousEnd
    });
  }

  calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  calculateOverallApprovalRate(approvalRates) {
    if (approvalRates.length === 0) return 0;
    const totalUploads = approvalRates.reduce((sum, rate) => sum + rate.totalUploads, 0);
    const totalApproved = approvalRates.reduce((sum, rate) => sum + rate.approvedUploads, 0);
    return totalUploads > 0 ? Math.round((totalApproved / totalUploads) * 100 * 100) / 100 : 0;
  }

  getCategoryForEventType(eventType) {
    const categoryMap = {
      [AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS]: 'users',
      [AnalyticsData.METRIC_TYPES.ACTIVE_USERS]: 'users',
      [AnalyticsData.METRIC_TYPES.USER_GROWTH]: 'users',
      [AnalyticsData.METRIC_TYPES.REVENUE]: 'financial',
      [AnalyticsData.METRIC_TYPES.ORDERS_VALUE]: 'financial',
      [AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE]: 'financial',
      [AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE]: 'financial',
      [AnalyticsData.METRIC_TYPES.ORDERS_COUNT]: 'orders',
      [AnalyticsData.METRIC_TYPES.UPLOADS_COUNT]: 'uploads',
      [AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED]: 'uploads',
      [AnalyticsData.METRIC_TYPES.MATERIALS_SOLD]: 'materials',
      [AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS]: 'payments',
      [AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS]: 'payments',
      [AnalyticsData.METRIC_TYPES.CONVERSION_RATE]: 'conversion'
    };
    
    return categoryMap[eventType] || 'general';
  }

  // Initialize with sample data
  async initializeSampleData() {
    this.logInfo('Initializing analytics with sample data...');
    
    const sampleData = [];
    const today = new Date();
    
    // Generate sample data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // User metrics
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
        value: Math.floor(Math.random() * 10) + 1,
        date: date,
        aggregationType: 'daily',
        category: 'users'
      }));
      
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.ACTIVE_USERS,
        value: Math.floor(Math.random() * 50) + 20,
        date: date,
        aggregationType: 'daily',
        category: 'users'
      }));
      
      // Revenue metrics
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.REVENUE,
        value: Math.floor(Math.random() * 10000) + 5000,
        date: date,
        aggregationType: 'daily',
        category: 'financial'
      }));
      
      // Order metrics
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
        value: Math.floor(Math.random() * 20) + 5,
        date: date,
        aggregationType: 'daily',
        category: 'orders'
      }));
      
      // Upload metrics
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.UPLOADS_COUNT,
        value: Math.floor(Math.random() * 15) + 3,
        date: date,
        aggregationType: 'daily',
        category: 'uploads'
      }));
      
      sampleData.push(new AnalyticsData({
        metricType: AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED,
        value: Math.floor(Math.random() * 12) + 2,
        date: date,
        aggregationType: 'daily',
        category: 'uploads'
      }));
    }
    
    await this.storage.saveAnalytics(sampleData);
    this.logInfo(`Initialized ${sampleData.length} sample analytics data points`);
  }

  // Shutdown service
  async shutdown() {
    this.logInfo('Analytics service shutting down...');
    
    // Flush remaining events
    await this.flushEventQueue();
    
    // Stop batch processor
    this.stopBatchProcessor();
    
    this.logInfo('Analytics service shutdown complete');
  }

  // Health check
  async healthCheck() {
    try {
      const analytics = await this.storage.getAllAnalytics();
      const queueSize = this.eventQueue.length;
      
      return {
        status: 'healthy',
        details: {
          totalAnalyticsRecords: analytics.length,
          queueSize: queueSize,
          batchProcessorActive: !!this.batchProcessor,
          lastSync: this.storage.lastSync
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}

export default AnalyticsService;