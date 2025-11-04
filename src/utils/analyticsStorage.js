/**
 * Analytics Storage Utilities
 * Handles storage and retrieval of analytics data
 */

import { AnalyticsData } from '../models/AnalyticsData.js';

const STORAGE_KEY = 'farmtech_analytics';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class AnalyticsStorage {
  constructor() {
    this.cache = new Map();
    this.lastSync = null;
  }

  // Load all analytics data from storage
  async getAllAnalytics() {
    try {
      const cached = this.getFromCache('all_analytics');
      if (cached && this.isCacheValid('all_analytics')) {
        return cached.map(data => AnalyticsData.fromJSON(data));
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const analyticsData = JSON.parse(stored);
        const data = analyticsData.data || [];
        this.setCache('all_analytics', data);
        return data.map(item => AnalyticsData.fromJSON(item));
      }

      // Return empty array if no data
      return [];
    } catch (error) {
      console.error('Error loading analytics data:', error);
      return [];
    }
  }

  // Save analytics data to storage
  async saveAnalytics(analyticsArray) {
    try {
      const analyticsData = analyticsArray.map(item => 
        item instanceof AnalyticsData ? item.toJSON() : item
      );
      
      const storageData = {
        data: analyticsData,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
      this.setCache('all_analytics', analyticsData);
      this.lastSync = new Date();
      return true;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      return false;
    }
  }

  // Add new analytics data point
  async addAnalyticsData(analyticsData) {
    try {
      const allAnalytics = await this.getAllAnalytics();
      const newAnalytics = new AnalyticsData(analyticsData);
      
      // Validate analytics data
      const validation = newAnalytics.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      allAnalytics.push(newAnalytics);
      await this.saveAnalytics(allAnalytics);
      return newAnalytics;
    } catch (error) {
      console.error('Error adding analytics data:', error);
      throw error;
    }
  }

  // Get analytics data by metric type
  async getAnalyticsByType(metricType, dateRange = null) {
    const allAnalytics = await this.getAllAnalytics();
    let filtered = allAnalytics.filter(item => item.metricType === metricType);
    
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get analytics data by date range
  async getAnalyticsByDateRange(startDate, endDate, metricTypes = null) {
    const allAnalytics = await this.getAllAnalytics();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let filtered = allAnalytics.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
    
    if (metricTypes && Array.isArray(metricTypes)) {
      filtered = filtered.filter(item => metricTypes.includes(item.metricType));
    }
    
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get analytics data by category
  async getAnalyticsByCategory(category, dateRange = null) {
    const allAnalytics = await this.getAllAnalytics();
    let filtered = allAnalytics.filter(item => item.category === category);
    
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get aggregated metrics
  async getAggregatedMetrics(metricType, aggregationType = 'daily', dateRange = null) {
    const analytics = await this.getAnalyticsByType(metricType, dateRange);
    const aggregated = new Map();
    
    analytics.forEach(item => {
      let key;
      const date = new Date(item.date);
      
      switch (aggregationType) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (aggregated.has(key)) {
        aggregated.get(key).value += item.value;
        aggregated.get(key).count += 1;
      } else {
        aggregated.set(key, {
          date: key,
          value: item.value,
          count: 1,
          metricType: item.metricType,
          aggregationType
        });
      }
    });
    
    return Array.from(aggregated.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get dashboard summary
  async getDashboardSummary(dateRange = null) {
    const defaultRange = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    
    const analytics = await this.getAnalyticsByDateRange(defaultRange.start, defaultRange.end);
    
    const summary = {
      totalUsers: 0,
      newRegistrations: 0,
      activeUsers: 0,
      totalRevenue: 0,
      totalOrders: 0,
      totalUploads: 0,
      approvedUploads: 0,
      conversionRate: 0,
      averageOrderValue: 0
    };
    
    // Calculate metrics
    analytics.forEach(item => {
      switch (item.metricType) {
        case AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS:
          summary.newRegistrations += item.value;
          break;
        case AnalyticsData.METRIC_TYPES.ACTIVE_USERS:
          summary.activeUsers = Math.max(summary.activeUsers, item.value);
          break;
        case AnalyticsData.METRIC_TYPES.REVENUE:
          summary.totalRevenue += item.value;
          break;
        case AnalyticsData.METRIC_TYPES.ORDERS_COUNT:
          summary.totalOrders += item.value;
          break;
        case AnalyticsData.METRIC_TYPES.UPLOADS_COUNT:
          summary.totalUploads += item.value;
          break;
        case AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED:
          summary.approvedUploads += item.value;
          break;
      }
    });
    
    // Calculate derived metrics
    summary.totalUsers = summary.activeUsers; // Simplified
    summary.conversionRate = summary.totalOrders > 0 ? (summary.totalOrders / summary.activeUsers) * 100 : 0;
    summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
    
    return summary;
  }

  // Get growth metrics
  async getGrowthMetrics(metricType, period = 'week') {
    const now = new Date();
    let currentPeriodStart, previousPeriodStart, previousPeriodEnd;
    
    switch (period) {
      case 'day':
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousPeriodEnd = new Date(currentPeriodStart);
        break;
      case 'week':
        currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodStart);
        break;
      case 'month':
        currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(now.getDate() - 30);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
        previousPeriodEnd = new Date(currentPeriodStart);
        break;
      default:
        currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodStart);
    }
    
    const currentData = await this.getAnalyticsByDateRange(currentPeriodStart, now, [metricType]);
    const previousData = await this.getAnalyticsByDateRange(previousPeriodStart, previousPeriodEnd, [metricType]);
    
    const currentValue = currentData.reduce((sum, item) => sum + item.value, 0);
    const previousValue = previousData.reduce((sum, item) => sum + item.value, 0);
    
    const growthRate = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    
    return {
      current: currentValue,
      previous: previousValue,
      growthRate: Math.round(growthRate * 100) / 100,
      period
    };
  }

  // Track event (add analytics data point)
  async trackEvent(eventType, value = 1, metadata = {}) {
    const analyticsData = {
      metricType: eventType,
      value: value,
      date: new Date(),
      metadata: metadata,
      aggregationType: 'daily',
      category: this.getCategoryForEventType(eventType)
    };
    
    return await this.addAnalyticsData(analyticsData);
  }

  // Get category for event type
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

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < CACHE_DURATION;
  }

  clearCache() {
    this.cache.clear();
  }

  // Export analytics data
  async exportAnalytics(format = 'json', dateRange = null) {
    const analytics = dateRange 
      ? await this.getAnalyticsByDateRange(dateRange.start, dateRange.end)
      : await this.getAllAnalytics();
    
    const exportData = {
      analytics: analytics.map(item => item.toJSON()),
      exportedAt: new Date().toISOString(),
      format,
      totalRecords: analytics.length
    };
    
    return exportData;
  }
}

// Create singleton instance
const analyticsStorage = new AnalyticsStorage();

export default analyticsStorage;
export { AnalyticsStorage };