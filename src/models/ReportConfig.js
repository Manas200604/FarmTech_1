/**
 * Report Configuration Model
 * Represents report configurations for automated and manual report generation
 */

export class ReportConfig {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || ''; // 'user_activity', 'financial', 'inventory', 'custom'
    this.parameters = data.parameters || {};
    this.schedule = data.schedule || null; // cron expression for scheduled reports
    this.format = data.format || 'pdf'; // 'pdf', 'csv', 'excel', 'json'
    this.recipients = data.recipients || []; // email addresses for delivery
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isScheduled = data.isScheduled !== undefined ? data.isScheduled : false;
    this.lastGenerated = data.lastGenerated || null;
    this.nextScheduled = data.nextScheduled || null;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'report_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Report type constants
  static REPORT_TYPES = {
    USER_ACTIVITY: 'user_activity',
    FINANCIAL: 'financial',
    INVENTORY: 'inventory',
    ORDERS: 'orders',
    PAYMENTS: 'payments',
    UPLOADS: 'uploads',
    ANALYTICS: 'analytics',
    CUSTOM: 'custom'
  };

  // Report format constants
  static FORMATS = {
    PDF: 'pdf',
    CSV: 'csv',
    EXCEL: 'excel',
    JSON: 'json'
  };

  // Schedule frequency constants
  static SCHEDULE_FREQUENCIES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly'
  };

  // Update report configuration
  update(updateData) {
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        this[key] = updateData[key];
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  // Set schedule
  setSchedule(frequency, time = '09:00', dayOfWeek = 1, dayOfMonth = 1) {
    let cronExpression = '';
    
    switch (frequency) {
      case ReportConfig.SCHEDULE_FREQUENCIES.DAILY:
        const [hour, minute] = time.split(':');
        cronExpression = `${minute} ${hour} * * *`;
        break;
      
      case ReportConfig.SCHEDULE_FREQUENCIES.WEEKLY:
        const [weekHour, weekMinute] = time.split(':');
        cronExpression = `${weekMinute} ${weekHour} * * ${dayOfWeek}`;
        break;
      
      case ReportConfig.SCHEDULE_FREQUENCIES.MONTHLY:
        const [monthHour, monthMinute] = time.split(':');
        cronExpression = `${monthMinute} ${monthHour} ${dayOfMonth} * *`;
        break;
      
      case ReportConfig.SCHEDULE_FREQUENCIES.QUARTERLY:
        const [quarterHour, quarterMinute] = time.split(':');
        cronExpression = `${quarterMinute} ${quarterHour} ${dayOfMonth} */3 *`;
        break;
      
      case ReportConfig.SCHEDULE_FREQUENCIES.YEARLY:
        const [yearHour, yearMinute] = time.split(':');
        cronExpression = `${yearMinute} ${yearHour} ${dayOfMonth} 1 *`;
        break;
      
      default:
        cronExpression = null;
    }

    this.schedule = cronExpression;
    this.isScheduled = !!cronExpression;
    this.updatedAt = new Date();
  }

  // Add recipient
  addRecipient(email) {
    if (this.isValidEmail(email) && !this.recipients.includes(email)) {
      this.recipients.push(email);
      this.updatedAt = new Date();
    }
  }

  // Remove recipient
  removeRecipient(email) {
    const index = this.recipients.indexOf(email);
    if (index > -1) {
      this.recipients.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Set report parameters
  setParameters(params) {
    this.parameters = { ...this.parameters, ...params };
    this.updatedAt = new Date();
  }

  // Get default parameters for report type
  getDefaultParameters() {
    const defaults = {
      [ReportConfig.REPORT_TYPES.USER_ACTIVITY]: {
        dateRange: 'last_30_days',
        includeRegistrations: true,
        includeLogins: true,
        includeActivity: true,
        groupBy: 'day'
      },
      [ReportConfig.REPORT_TYPES.FINANCIAL]: {
        dateRange: 'last_30_days',
        includeRevenue: true,
        includeOrders: true,
        includePayments: true,
        currency: 'INR',
        groupBy: 'day'
      },
      [ReportConfig.REPORT_TYPES.INVENTORY]: {
        includeStockLevels: true,
        includeLowStock: true,
        includePopularItems: true,
        includeReorderSuggestions: true,
        categories: 'all'
      },
      [ReportConfig.REPORT_TYPES.ORDERS]: {
        dateRange: 'last_30_days',
        includeOrderDetails: true,
        includePaymentStatus: true,
        includeShippingStatus: true,
        groupBy: 'day'
      },
      [ReportConfig.REPORT_TYPES.PAYMENTS]: {
        dateRange: 'last_30_days',
        includeSubmissions: true,
        includeApprovals: true,
        includeRejections: true,
        groupBy: 'day'
      },
      [ReportConfig.REPORT_TYPES.UPLOADS]: {
        dateRange: 'last_30_days',
        includeUploadStats: true,
        includeApprovalRates: true,
        includeCropTypes: true,
        groupBy: 'day'
      },
      [ReportConfig.REPORT_TYPES.ANALYTICS]: {
        dateRange: 'last_30_days',
        includeUserMetrics: true,
        includeRevenueMetrics: true,
        includeEngagementMetrics: true,
        groupBy: 'day'
      }
    };

    return defaults[this.type] || {};
  }

  // Get report type display name
  getTypeDisplayName(language = 'en') {
    const displayNames = {
      en: {
        [ReportConfig.REPORT_TYPES.USER_ACTIVITY]: 'User Activity Report',
        [ReportConfig.REPORT_TYPES.FINANCIAL]: 'Financial Report',
        [ReportConfig.REPORT_TYPES.INVENTORY]: 'Inventory Report',
        [ReportConfig.REPORT_TYPES.ORDERS]: 'Orders Report',
        [ReportConfig.REPORT_TYPES.PAYMENTS]: 'Payments Report',
        [ReportConfig.REPORT_TYPES.UPLOADS]: 'Uploads Report',
        [ReportConfig.REPORT_TYPES.ANALYTICS]: 'Analytics Report',
        [ReportConfig.REPORT_TYPES.CUSTOM]: 'Custom Report'
      },
      hi: {
        [ReportConfig.REPORT_TYPES.USER_ACTIVITY]: 'उपयोगकर्ता गतिविधि रिपोर्ट',
        [ReportConfig.REPORT_TYPES.FINANCIAL]: 'वित्तीय रिपोर्ट',
        [ReportConfig.REPORT_TYPES.INVENTORY]: 'इन्वेंटरी रिपोर्ट',
        [ReportConfig.REPORT_TYPES.ORDERS]: 'ऑर्डर रिपोर्ट',
        [ReportConfig.REPORT_TYPES.PAYMENTS]: 'भुगतान रिपोर्ट',
        [ReportConfig.REPORT_TYPES.UPLOADS]: 'अपलोड रिपोर्ट',
        [ReportConfig.REPORT_TYPES.ANALYTICS]: 'एनालिटिक्स रिपोर्ट',
        [ReportConfig.REPORT_TYPES.CUSTOM]: 'कस्टम रिपोर्ट'
      },
      mr: {
        [ReportConfig.REPORT_TYPES.USER_ACTIVITY]: 'वापरकर्ता क्रियाकलाप अहवाल',
        [ReportConfig.REPORT_TYPES.FINANCIAL]: 'आर्थिक अहवाल',
        [ReportConfig.REPORT_TYPES.INVENTORY]: 'इन्व्हेंटरी अहवाल',
        [ReportConfig.REPORT_TYPES.ORDERS]: 'ऑर्डर अहवाल',
        [ReportConfig.REPORT_TYPES.PAYMENTS]: 'पेमेंट अहवाल',
        [ReportConfig.REPORT_TYPES.UPLOADS]: 'अपलोड अहवाल',
        [ReportConfig.REPORT_TYPES.ANALYTICS]: 'अॅनालिटिक्स अहवाल',
        [ReportConfig.REPORT_TYPES.CUSTOM]: 'कस्टम अहवाल'
      }
    };

    return displayNames[language]?.[this.type] || displayNames.en[this.type] || this.type;
  }

  // Get format display name
  getFormatDisplayName(language = 'en') {
    const displayNames = {
      en: {
        [ReportConfig.FORMATS.PDF]: 'PDF Document',
        [ReportConfig.FORMATS.CSV]: 'CSV Spreadsheet',
        [ReportConfig.FORMATS.EXCEL]: 'Excel Workbook',
        [ReportConfig.FORMATS.JSON]: 'JSON Data'
      },
      hi: {
        [ReportConfig.FORMATS.PDF]: 'PDF दस्तावेज़',
        [ReportConfig.FORMATS.CSV]: 'CSV स्प्रेडशीट',
        [ReportConfig.FORMATS.EXCEL]: 'Excel वर्कबुक',
        [ReportConfig.FORMATS.JSON]: 'JSON डेटा'
      },
      mr: {
        [ReportConfig.FORMATS.PDF]: 'PDF दस्तावेज',
        [ReportConfig.FORMATS.CSV]: 'CSV स्प्रेडशीट',
        [ReportConfig.FORMATS.EXCEL]: 'Excel वर्कबुक',
        [ReportConfig.FORMATS.JSON]: 'JSON डेटा'
      }
    };

    return displayNames[language]?.[this.format] || displayNames.en[this.format] || this.format;
  }

  // Check if report is due for generation
  isDue() {
    if (!this.isScheduled || !this.schedule) return false;
    
    const now = new Date();
    return !this.nextScheduled || now >= new Date(this.nextScheduled);
  }

  // Mark as generated
  markAsGenerated() {
    this.lastGenerated = new Date();
    this.updatedAt = new Date();
    // Calculate next scheduled time based on cron expression
    this.calculateNextScheduled();
  }

  // Calculate next scheduled time (simplified)
  calculateNextScheduled() {
    if (!this.schedule) return;
    
    // This is a simplified implementation
    // In a real application, you'd use a proper cron parser
    const now = new Date();
    const nextRun = new Date(now);
    
    if (this.schedule.includes('* * *')) { // Daily
      nextRun.setDate(now.getDate() + 1);
    } else if (this.schedule.includes('* *')) { // Weekly
      nextRun.setDate(now.getDate() + 7);
    } else { // Monthly or other
      nextRun.setMonth(now.getMonth() + 1);
    }
    
    this.nextScheduled = nextRun;
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      parameters: this.parameters,
      schedule: this.schedule,
      format: this.format,
      recipients: this.recipients,
      isActive: this.isActive,
      isScheduled: this.isScheduled,
      lastGenerated: this.lastGenerated,
      nextScheduled: this.nextScheduled,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new ReportConfig(data);
  }

  // Validate report configuration
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length < 3) {
      errors.push('Report name is required and must be at least 3 characters');
    }

    if (!this.type) {
      errors.push('Report type is required');
    }

    if (!Object.values(ReportConfig.REPORT_TYPES).includes(this.type)) {
      errors.push('Invalid report type');
    }

    if (!Object.values(ReportConfig.FORMATS).includes(this.format)) {
      errors.push('Invalid report format');
    }

    if (this.recipients.length > 0) {
      const invalidEmails = this.recipients.filter(email => !this.isValidEmail(email));
      if (invalidEmails.length > 0) {
        errors.push(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }
    }

    if (this.isScheduled && !this.schedule) {
      errors.push('Schedule is required for scheduled reports');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ReportConfig;