/**
 * Analytics Data Model
 * Represents analytics metrics and data points for admin dashboard
 */

export class AnalyticsData {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.metricType = data.metricType || ''; // 'user_growth', 'revenue', 'orders', 'uploads', 'materials'
    this.value = data.value || 0;
    this.date = data.date || new Date();
    this.metadata = data.metadata || {};
    this.aggregationType = data.aggregationType || 'daily'; // 'daily', 'weekly', 'monthly', 'yearly'
    this.category = data.category || ''; // Additional categorization
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Metric type constants
  static METRIC_TYPES = {
    USER_GROWTH: 'user_growth',
    USER_REGISTRATIONS: 'user_registrations',
    ACTIVE_USERS: 'active_users',
    REVENUE: 'revenue',
    ORDERS_COUNT: 'orders_count',
    ORDERS_VALUE: 'orders_value',
    UPLOADS_COUNT: 'uploads_count',
    UPLOADS_APPROVED: 'uploads_approved',
    MATERIALS_SOLD: 'materials_sold',
    MATERIALS_REVENUE: 'materials_revenue',
    PAYMENT_SUBMISSIONS: 'payment_submissions',
    PAYMENT_APPROVALS: 'payment_approvals',
    CONVERSION_RATE: 'conversion_rate',
    AVERAGE_ORDER_VALUE: 'average_order_value'
  };

  // Aggregation type constants
  static AGGREGATION_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    REAL_TIME: 'real_time'
  };

  // Update metric value
  updateValue(newValue, metadata = {}) {
    this.value = newValue;
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  // Add to existing value (for cumulative metrics)
  addToValue(increment, metadata = {}) {
    this.value += increment;
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  // Get formatted value based on metric type
  getFormattedValue(language = 'en') {
    switch (this.metricType) {
      case AnalyticsData.METRIC_TYPES.REVENUE:
      case AnalyticsData.METRIC_TYPES.ORDERS_VALUE:
      case AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE:
      case AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE:
        return this.formatCurrency(this.value, language);
      
      case AnalyticsData.METRIC_TYPES.CONVERSION_RATE:
        return `${(this.value * 100).toFixed(2)}%`;
      
      case AnalyticsData.METRIC_TYPES.USER_GROWTH:
        return this.value > 0 ? `+${this.value.toFixed(1)}%` : `${this.value.toFixed(1)}%`;
      
      default:
        return this.formatNumber(this.value, language);
    }
  }

  // Format currency values
  formatCurrency(amount, language = 'en') {
    const formatters = {
      en: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      hi: new Intl.NumberFormat('hi-IN', { style: 'currency', currency: 'INR' }),
      mr: new Intl.NumberFormat('mr-IN', { style: 'currency', currency: 'INR' })
    };

    return formatters[language]?.format(amount) || formatters.en.format(amount);
  }

  // Format number values
  formatNumber(number, language = 'en') {
    const formatters = {
      en: new Intl.NumberFormat('en-IN'),
      hi: new Intl.NumberFormat('hi-IN'),
      mr: new Intl.NumberFormat('mr-IN')
    };

    return formatters[language]?.format(number) || formatters.en.format(number);
  }

  // Get metric display name
  getMetricDisplayName(language = 'en') {
    const displayNames = {
      en: {
        [AnalyticsData.METRIC_TYPES.USER_GROWTH]: 'User Growth',
        [AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS]: 'New Registrations',
        [AnalyticsData.METRIC_TYPES.ACTIVE_USERS]: 'Active Users',
        [AnalyticsData.METRIC_TYPES.REVENUE]: 'Total Revenue',
        [AnalyticsData.METRIC_TYPES.ORDERS_COUNT]: 'Total Orders',
        [AnalyticsData.METRIC_TYPES.ORDERS_VALUE]: 'Orders Value',
        [AnalyticsData.METRIC_TYPES.UPLOADS_COUNT]: 'Total Uploads',
        [AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED]: 'Approved Uploads',
        [AnalyticsData.METRIC_TYPES.MATERIALS_SOLD]: 'Materials Sold',
        [AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE]: 'Materials Revenue',
        [AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS]: 'Payment Submissions',
        [AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS]: 'Payment Approvals',
        [AnalyticsData.METRIC_TYPES.CONVERSION_RATE]: 'Conversion Rate',
        [AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE]: 'Average Order Value'
      },
      hi: {
        [AnalyticsData.METRIC_TYPES.USER_GROWTH]: 'उपयोगकर्ता वृद्धि',
        [AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS]: 'नए पंजीकरण',
        [AnalyticsData.METRIC_TYPES.ACTIVE_USERS]: 'सक्रिय उपयोगकर्ता',
        [AnalyticsData.METRIC_TYPES.REVENUE]: 'कुल राजस्व',
        [AnalyticsData.METRIC_TYPES.ORDERS_COUNT]: 'कुल ऑर्डर',
        [AnalyticsData.METRIC_TYPES.ORDERS_VALUE]: 'ऑर्डर मूल्य',
        [AnalyticsData.METRIC_TYPES.UPLOADS_COUNT]: 'कुल अपलोड',
        [AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED]: 'स्वीकृत अपलोड',
        [AnalyticsData.METRIC_TYPES.MATERIALS_SOLD]: 'बेची गई सामग्री',
        [AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE]: 'सामग्री राजस्व',
        [AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS]: 'भुगतान सबमिशन',
        [AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS]: 'भुगतान अनुमोदन',
        [AnalyticsData.METRIC_TYPES.CONVERSION_RATE]: 'रूपांतरण दर',
        [AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE]: 'औसत ऑर्डर मूल्य'
      },
      mr: {
        [AnalyticsData.METRIC_TYPES.USER_GROWTH]: 'वापरकर्ता वाढ',
        [AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS]: 'नवीन नोंदणी',
        [AnalyticsData.METRIC_TYPES.ACTIVE_USERS]: 'सक्रिय वापरकर्ते',
        [AnalyticsData.METRIC_TYPES.REVENUE]: 'एकूण महसूल',
        [AnalyticsData.METRIC_TYPES.ORDERS_COUNT]: 'एकूण ऑर्डर',
        [AnalyticsData.METRIC_TYPES.ORDERS_VALUE]: 'ऑर्डर मूल्य',
        [AnalyticsData.METRIC_TYPES.UPLOADS_COUNT]: 'एकूण अपलोड',
        [AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED]: 'मंजूर अपलोड',
        [AnalyticsData.METRIC_TYPES.MATERIALS_SOLD]: 'विकली गेलेली सामग्री',
        [AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE]: 'सामग्री महसूल',
        [AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS]: 'पेमेंट सबमिशन',
        [AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS]: 'पेमेंट मंजुरी',
        [AnalyticsData.METRIC_TYPES.CONVERSION_RATE]: 'रूपांतरण दर',
        [AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE]: 'सरासरी ऑर्डर मूल्य'
      }
    };

    return displayNames[language]?.[this.metricType] || displayNames.en[this.metricType] || this.metricType;
  }

  // Check if metric is a growth metric
  isGrowthMetric() {
    return this.metricType === AnalyticsData.METRIC_TYPES.USER_GROWTH;
  }

  // Check if metric is a revenue metric
  isRevenueMetric() {
    return [
      AnalyticsData.METRIC_TYPES.REVENUE,
      AnalyticsData.METRIC_TYPES.ORDERS_VALUE,
      AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE,
      AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE
    ].includes(this.metricType);
  }

  // Check if metric is a count metric
  isCountMetric() {
    return [
      AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
      AnalyticsData.METRIC_TYPES.ACTIVE_USERS,
      AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
      AnalyticsData.METRIC_TYPES.UPLOADS_COUNT,
      AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED,
      AnalyticsData.METRIC_TYPES.MATERIALS_SOLD,
      AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS,
      AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS
    ].includes(this.metricType);
  }

  // Get date range for aggregation
  getDateRange() {
    const date = new Date(this.date);
    
    switch (this.aggregationType) {
      case AnalyticsData.AGGREGATION_TYPES.DAILY:
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        };
      
      case AnalyticsData.AGGREGATION_TYPES.WEEKLY:
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return { start: weekStart, end: weekEnd };
      
      case AnalyticsData.AGGREGATION_TYPES.MONTHLY:
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
        };
      
      case AnalyticsData.AGGREGATION_TYPES.YEARLY:
        return {
          start: new Date(date.getFullYear(), 0, 1),
          end: new Date(date.getFullYear() + 1, 0, 1)
        };
      
      default:
        return { start: date, end: date };
    }
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      metricType: this.metricType,
      value: this.value,
      date: this.date,
      metadata: this.metadata,
      aggregationType: this.aggregationType,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new AnalyticsData(data);
  }

  // Validate analytics data
  validate() {
    const errors = [];

    if (!this.metricType) {
      errors.push('Metric type is required');
    }

    if (!Object.values(AnalyticsData.METRIC_TYPES).includes(this.metricType)) {
      errors.push('Invalid metric type');
    }

    if (typeof this.value !== 'number') {
      errors.push('Value must be a number');
    }

    if (!Object.values(AnalyticsData.AGGREGATION_TYPES).includes(this.aggregationType)) {
      errors.push('Invalid aggregation type');
    }

    if (!(this.date instanceof Date) && !Date.parse(this.date)) {
      errors.push('Invalid date format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AnalyticsData;