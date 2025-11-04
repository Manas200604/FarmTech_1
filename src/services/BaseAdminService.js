/**
 * Base Admin Service Class
 * Provides common functionality for all admin services
 */

import { AdminServiceError, ERROR_CODES, createValidationError, createPermissionError } from './AdminServiceError.js';

export class BaseAdminService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'BaseAdminService';
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes default
    this.rateLimits = new Map();
    this.rateLimitWindow = options.rateLimitWindow || 60 * 1000; // 1 minute default
    this.rateLimitMax = options.rateLimitMax || 100; // 100 requests per minute default
    this.logger = options.logger || console;
  }

  // Validate user permissions
  validateAdminPermissions(userProfile, requiredRole = 'admin') {
    if (!userProfile) {
      throw createPermissionError('User not authenticated');
    }

    if (userProfile.role !== requiredRole) {
      throw createPermissionError(`Required role: ${requiredRole}, current role: ${userProfile.role}`);
    }

    return true;
  }

  // Validate input data
  validateInput(data, schema) {
    if (!data) {
      throw createValidationError('Input data is required');
    }

    const errors = [];

    // Basic schema validation
    if (schema.required) {
      schema.required.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`${field} is required`);
        }
      });
    }

    if (schema.fields) {
      Object.keys(schema.fields).forEach(field => {
        const fieldSchema = schema.fields[field];
        const value = data[field];

        if (value !== undefined && value !== null) {
          // Type validation
          if (fieldSchema.type && typeof value !== fieldSchema.type) {
            errors.push(`${field} must be of type ${fieldSchema.type}`);
          }

          // String validations
          if (fieldSchema.type === 'string') {
            if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
              errors.push(`${field} must be at least ${fieldSchema.minLength} characters`);
            }
            if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
              errors.push(`${field} must be no more than ${fieldSchema.maxLength} characters`);
            }
            if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
              errors.push(`${field} format is invalid`);
            }
          }

          // Number validations
          if (fieldSchema.type === 'number') {
            if (fieldSchema.min !== undefined && value < fieldSchema.min) {
              errors.push(`${field} must be at least ${fieldSchema.min}`);
            }
            if (fieldSchema.max !== undefined && value > fieldSchema.max) {
              errors.push(`${field} must be no more than ${fieldSchema.max}`);
            }
          }

          // Array validations
          if (fieldSchema.type === 'array') {
            if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
              errors.push(`${field} must have at least ${fieldSchema.minItems} items`);
            }
            if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
              errors.push(`${field} must have no more than ${fieldSchema.maxItems} items`);
            }
          }

          // Custom validation
          if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
            const customError = fieldSchema.validate(value);
            if (customError) {
              errors.push(customError);
            }
          }
        }
      });
    }

    if (errors.length > 0) {
      throw createValidationError('Validation failed', { errors });
    }

    return true;
  }

  // Rate limiting
  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;

    if (!this.rateLimits.has(identifier)) {
      this.rateLimits.set(identifier, []);
    }

    const requests = this.rateLimits.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.rateLimitMax) {
      throw new AdminServiceError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT_EXCEEDED, {
        limit: this.rateLimitMax,
        window: this.rateLimitWindow,
        identifier
      });
    }

    // Add current request
    validRequests.push(now);
    this.rateLimits.set(identifier, validRequests);

    return true;
  }

  // Caching utilities
  setCache(key, data, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.timeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(pattern = null) {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Logging utilities
  log(level, message, data = {}) {
    const logEntry = {
      service: this.serviceName,
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (this.logger[level]) {
      this.logger[level](logEntry);
    } else {
      this.logger.log(logEntry);
    }
  }

  logInfo(message, data = {}) {
    this.log('info', message, data);
  }

  logWarn(message, data = {}) {
    this.log('warn', message, data);
  }

  logError(message, error = null, data = {}) {
    const errorData = {
      ...data,
      error: error ? {
        message: error.message,
        code: error.code,
        stack: error.stack
      } : null
    };
    this.log('error', message, errorData);
  }

  // Retry mechanism
  async retry(operation, maxAttempts = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !error.isRetryable?.()) {
          break;
        }

        this.logWarn(`Operation failed, retrying (${attempt}/${maxAttempts})`, {
          error: error.message,
          attempt
        });

        // Exponential backoff
        await this.sleep(delay * Math.pow(2, attempt - 1));
      }
    }

    throw lastError;
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pagination utilities
  validatePagination(page = 1, limit = 10, maxLimit = 100) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError('Page must be a positive integer');
    }

    if (isNaN(limitNum) || limitNum < 1) {
      throw createValidationError('Limit must be a positive integer');
    }

    if (limitNum > maxLimit) {
      throw createValidationError(`Limit cannot exceed ${maxLimit}`);
    }

    return {
      page: pageNum,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    };
  }

  // Create paginated response
  createPaginatedResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Date range validation
  validateDateRange(startDate, endDate, maxDays = 365) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw createValidationError('Invalid start date');
    }

    if (isNaN(end.getTime())) {
      throw createValidationError('Invalid end date');
    }

    if (start > end) {
      throw createValidationError('Start date must be before end date');
    }

    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      throw createValidationError(`Date range cannot exceed ${maxDays} days`);
    }

    return { start, end, daysDiff };
  }

  // Format response
  formatResponse(data, message = 'Success', metadata = {}) {
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        ...metadata
      }
    };
  }

  // Format error response
  formatErrorResponse(error, requestId = null) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || {},
        requestId
      },
      metadata: {
        timestamp: new Date().toISOString(),
        service: this.serviceName
      }
    };
  }

  // Sanitize data for logging (remove sensitive information)
  sanitizeForLogging(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
        
        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }
}

export default BaseAdminService;