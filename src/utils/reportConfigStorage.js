/**
 * Report Configuration Storage Utilities
 * Handles storage and retrieval of report configuration data
 */

import { ReportConfig } from '../models/ReportConfig.js';

const STORAGE_KEY = 'farmtech_report_configs';

class ReportConfigStorage {
  constructor() {
    this.cache = new Map();
  }

  // Load all report configurations from storage
  async getAllConfigs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const configs = JSON.parse(stored);
        return configs.map(data => ReportConfig.fromJSON(data));
      }
      return [];
    } catch (error) {
      console.error('Error loading report configurations:', error);
      return [];
    }
  }

  // Save report configurations to storage
  async saveConfigs(configs) {
    try {
      const configsData = configs.map(config => 
        config instanceof ReportConfig ? config.toJSON() : config
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configsData));
      return true;
    } catch (error) {
      console.error('Error saving report configurations:', error);
      return false;
    }
  }

  // Add new report configuration
  async addConfig(configData) {
    try {
      const configs = await this.getAllConfigs();
      const newConfig = new ReportConfig(configData);
      
      // Validate configuration
      const validation = newConfig.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      configs.push(newConfig);
      await this.saveConfigs(configs);
      return newConfig;
    } catch (error) {
      console.error('Error adding report configuration:', error);
      throw error;
    }
  }

  // Get configuration by ID
  async getConfigById(id) {
    const configs = await this.getAllConfigs();
    return configs.find(config => config.id === id);
  }

  // Update configuration
  async updateConfig(id, updateData) {
    try {
      const configs = await this.getAllConfigs();
      const configIndex = configs.findIndex(config => config.id === id);
      
      if (configIndex === -1) {
        throw new Error('Report configuration not found');
      }

      configs[configIndex].update(updateData);
      await this.saveConfigs(configs);
      return configs[configIndex];
    } catch (error) {
      console.error('Error updating report configuration:', error);
      throw error;
    }
  }

  // Delete configuration
  async deleteConfig(id) {
    try {
      const configs = await this.getAllConfigs();
      const filteredConfigs = configs.filter(config => config.id !== id);
      
      if (configs.length === filteredConfigs.length) {
        throw new Error('Report configuration not found');
      }

      await this.saveConfigs(filteredConfigs);
      return true;
    } catch (error) {
      console.error('Error deleting report configuration:', error);
      throw error;
    }
  }

  // Get configurations by type
  async getConfigsByType(type) {
    const configs = await this.getAllConfigs();
    return configs.filter(config => config.type === type);
  }

  // Get active configurations
  async getActiveConfigs() {
    const configs = await this.getAllConfigs();
    return configs.filter(config => config.isActive);
  }

  // Get scheduled configurations
  async getScheduledConfigs() {
    const configs = await this.getAllConfigs();
    return configs.filter(config => config.isScheduled && config.isActive);
  }

  // Get configurations due for generation
  async getDueConfigs() {
    const scheduledConfigs = await this.getScheduledConfigs();
    return scheduledConfigs.filter(config => config.isDue());
  }

  // Mark configuration as generated
  async markAsGenerated(id) {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error('Report configuration not found');
      }

      config.markAsGenerated();
      await this.updateConfig(id, config.toJSON());
      return config;
    } catch (error) {
      console.error('Error marking configuration as generated:', error);
      throw error;
    }
  }

  // Toggle configuration active status
  async toggleActive(id) {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error('Report configuration not found');
      }

      config.isActive = !config.isActive;
      config.updatedAt = new Date();
      
      await this.updateConfig(id, config.toJSON());
      return config;
    } catch (error) {
      console.error('Error toggling configuration active status:', error);
      throw error;
    }
  }

  // Set configuration schedule
  async setSchedule(id, frequency, time = '09:00', dayOfWeek = 1, dayOfMonth = 1) {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error('Report configuration not found');
      }

      config.setSchedule(frequency, time, dayOfWeek, dayOfMonth);
      await this.updateConfig(id, config.toJSON());
      return config;
    } catch (error) {
      console.error('Error setting configuration schedule:', error);
      throw error;
    }
  }

  // Add recipient to configuration
  async addRecipient(id, email) {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error('Report configuration not found');
      }

      config.addRecipient(email);
      await this.updateConfig(id, config.toJSON());
      return config;
    } catch (error) {
      console.error('Error adding recipient to configuration:', error);
      throw error;
    }
  }

  // Remove recipient from configuration
  async removeRecipient(id, email) {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error('Report configuration not found');
      }

      config.removeRecipient(email);
      await this.updateConfig(id, config.toJSON());
      return config;
    } catch (error) {
      console.error('Error removing recipient from configuration:', error);
      throw error;
    }
  }

  // Get configurations by creator
  async getConfigsByCreator(createdBy) {
    const configs = await this.getAllConfigs();
    return configs.filter(config => config.createdBy === createdBy);
  }

  // Search configurations
  async searchConfigs(query, filters = {}) {
    const configs = await this.getAllConfigs();
    const searchTerm = query.toLowerCase();
    
    let filtered = configs.filter(config => {
      const matchesSearch = 
        config.name.toLowerCase().includes(searchTerm) ||
        config.description.toLowerCase().includes(searchTerm) ||
        config.type.toLowerCase().includes(searchTerm);
      
      return matchesSearch;
    });
    
    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(config => config.type === filters.type);
    }
    
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(config => config.isActive === filters.isActive);
    }
    
    if (filters.isScheduled !== undefined) {
      filtered = filtered.filter(config => config.isScheduled === filters.isScheduled);
    }
    
    if (filters.format) {
      filtered = filtered.filter(config => config.format === filters.format);
    }
    
    if (filters.createdBy) {
      filtered = filtered.filter(config => config.createdBy === filters.createdBy);
    }
    
    return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // Get configuration statistics
  async getConfigStatistics() {
    const configs = await this.getAllConfigs();
    
    const stats = {
      total: configs.length,
      active: 0,
      scheduled: 0,
      byType: {},
      byFormat: {},
      totalRecipients: 0
    };
    
    configs.forEach(config => {
      if (config.isActive) stats.active++;
      if (config.isScheduled) stats.scheduled++;
      
      // Count by type
      if (!stats.byType[config.type]) {
        stats.byType[config.type] = 0;
      }
      stats.byType[config.type]++;
      
      // Count by format
      if (!stats.byFormat[config.format]) {
        stats.byFormat[config.format] = 0;
      }
      stats.byFormat[config.format]++;
      
      // Count recipients
      stats.totalRecipients += config.recipients.length;
    });
    
    return stats;
  }

  // Get report templates
  async getReportTemplates() {
    return [
      {
        type: ReportConfig.REPORT_TYPES.USER_ACTIVITY,
        name: 'User Activity Report',
        description: 'Track user registrations, logins, and engagement metrics',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeRegistrations: true,
          includeLogins: true,
          includeActivity: true,
          groupBy: 'day'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.FINANCIAL,
        name: 'Financial Report',
        description: 'Revenue, orders, and payment analytics',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeRevenue: true,
          includeOrders: true,
          includePayments: true,
          currency: 'INR',
          groupBy: 'day'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.INVENTORY,
        name: 'Inventory Report',
        description: 'Stock levels, popular items, and reorder suggestions',
        defaultParameters: {
          includeStockLevels: true,
          includeLowStock: true,
          includePopularItems: true,
          includeReorderSuggestions: true,
          categories: 'all'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.ORDERS,
        name: 'Orders Report',
        description: 'Order details, payment status, and shipping information',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeOrderDetails: true,
          includePaymentStatus: true,
          includeShippingStatus: true,
          groupBy: 'day'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.PAYMENTS,
        name: 'Payments Report',
        description: 'Payment submissions, approvals, and rejections',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeSubmissions: true,
          includeApprovals: true,
          includeRejections: true,
          groupBy: 'day'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.UPLOADS,
        name: 'Uploads Report',
        description: 'Upload statistics, approval rates, and crop analysis',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeUploadStats: true,
          includeApprovalRates: true,
          includeCropTypes: true,
          groupBy: 'day'
        }
      },
      {
        type: ReportConfig.REPORT_TYPES.ANALYTICS,
        name: 'Analytics Report',
        description: 'Comprehensive platform analytics and insights',
        defaultParameters: {
          dateRange: 'last_30_days',
          includeUserMetrics: true,
          includeRevenueMetrics: true,
          includeEngagementMetrics: true,
          groupBy: 'day'
        }
      }
    ];
  }

  // Create configuration from template
  async createFromTemplate(templateType, configData) {
    const templates = await this.getReportTemplates();
    const template = templates.find(t => t.type === templateType);
    
    if (!template) {
      throw new Error('Report template not found');
    }
    
    const newConfigData = {
      name: configData.name || template.name,
      description: configData.description || template.description,
      type: template.type,
      parameters: { ...template.defaultParameters, ...configData.parameters },
      format: configData.format || 'pdf',
      recipients: configData.recipients || [],
      createdBy: configData.createdBy
    };
    
    return await this.addConfig(newConfigData);
  }

  // Export configurations
  async exportConfigs(format = 'json') {
    const configs = await this.getAllConfigs();
    
    const exportData = {
      configurations: configs.map(config => config.toJSON()),
      exportedAt: new Date().toISOString(),
      format,
      totalRecords: configs.length
    };
    
    return exportData;
  }

  // Import configurations
  async importConfigs(importData) {
    try {
      if (!importData.configurations || !Array.isArray(importData.configurations)) {
        throw new Error('Invalid import data format');
      }

      const configs = importData.configurations.map(data => ReportConfig.fromJSON(data));
      
      // Validate all configurations
      for (const config of configs) {
        const validation = config.validate();
        if (!validation.isValid) {
          throw new Error(`Invalid configuration data: ${validation.errors.join(', ')}`);
        }
      }

      await this.saveConfigs(configs);
      return true;
    } catch (error) {
      console.error('Error importing configurations:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const configs = await this.getAllConfigs();
    return configs
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);
  }
}

// Create singleton instance
const reportConfigStorage = new ReportConfigStorage();

export default reportConfigStorage;
export { ReportConfigStorage };