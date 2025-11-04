/**
 * Admin Service Error Class
 * Provides consistent error handling across admin services
 */

export class AdminServiceError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AdminServiceError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AdminServiceError);
    }
  }

  // Convert error to JSON for logging/transmission
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  // Get user-friendly error message
  getUserMessage(language = 'en') {
    const userMessages = {
      en: {
        [ERROR_CODES.VALIDATION_FAILED]: 'The provided data is invalid. Please check your input and try again.',
        [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
        [ERROR_CODES.RESOURCE_NOT_FOUND]: 'The requested resource could not be found.',
        [ERROR_CODES.OPERATION_FAILED]: 'The operation could not be completed. Please try again.',
        [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'An external service is currently unavailable. Please try again later.',
        [ERROR_CODES.DUPLICATE_RESOURCE]: 'A resource with this information already exists.',
        [ERROR_CODES.INVALID_OPERATION]: 'This operation is not allowed in the current state.',
        [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait before trying again.',
        [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred. Please try again.',
        [ERROR_CODES.FILE_UPLOAD_ERROR]: 'File upload failed. Please check the file and try again.'
      },
      hi: {
        [ERROR_CODES.VALIDATION_FAILED]: 'प्रदान किया गया डेटा अमान्य है। कृपया अपना इनपुट जांचें और पुनः प्रयास करें।',
        [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'आपके पास इस कार्य को करने की अनुमति नहीं है।',
        [ERROR_CODES.RESOURCE_NOT_FOUND]: 'अनुरोधित संसाधन नहीं मिला।',
        [ERROR_CODES.OPERATION_FAILED]: 'ऑपरेशन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।',
        [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'एक बाहरी सेवा वर्तमान में अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें।',
        [ERROR_CODES.DUPLICATE_RESOURCE]: 'इस जानकारी के साथ एक संसाधन पहले से मौजूद है।',
        [ERROR_CODES.INVALID_OPERATION]: 'वर्तमान स्थिति में यह ऑपरेशन की अनुमति नहीं है।',
        [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'बहुत सारे अनुरोध। कृपया पुनः प्रयास करने से पहले प्रतीक्षा करें।',
        [ERROR_CODES.DATABASE_ERROR]: 'डेटाबेस त्रुटि हुई। कृपया पुनः प्रयास करें।',
        [ERROR_CODES.FILE_UPLOAD_ERROR]: 'फ़ाइल अपलोड विफल। कृपया फ़ाइल जांचें और पुनः प्रयास करें।'
      },
      mr: {
        [ERROR_CODES.VALIDATION_FAILED]: 'प्रदान केलेला डेटा अवैध आहे. कृपया तुमचा इनपुट तपासा आणि पुन्हा प्रयत्न करा.',
        [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'तुम्हाला ही क्रिया करण्याची परवानगी नाही.',
        [ERROR_CODES.RESOURCE_NOT_FOUND]: 'विनंती केलेले संसाधन सापडले नाही.',
        [ERROR_CODES.OPERATION_FAILED]: 'ऑपरेशन पूर्ण होऊ शकले नाही. कृपया पुन्हा प्रयत्न करा.',
        [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'बाह्य सेवा सध्या अनुपलब्ध आहे. कृपया नंतर पुन्हा प्रयत्न करा.',
        [ERROR_CODES.DUPLICATE_RESOURCE]: 'या माहितीसह संसाधन आधीच अस्तित्वात आहे.',
        [ERROR_CODES.INVALID_OPERATION]: 'सध्याच्या स्थितीत या ऑपरेशनला परवानगी नाही.',
        [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'खूप विनंत्या. कृपया पुन्हा प्रयत्न करण्यापूर्वी प्रतीक्षा करा.',
        [ERROR_CODES.DATABASE_ERROR]: 'डेटाबेस त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.',
        [ERROR_CODES.FILE_UPLOAD_ERROR]: 'फाइल अपलोड अयशस्वी. कृपया फाइल तपासा आणि पुन्हा प्रयत्न करा.'
      }
    };

    return userMessages[language]?.[this.code] || userMessages.en[this.code] || this.message;
  }

  // Check if error is retryable
  isRetryable() {
    const retryableCodes = [
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      ERROR_CODES.OPERATION_FAILED
    ];
    return retryableCodes.includes(this.code);
  }

  // Check if error should be logged
  shouldLog() {
    const noLogCodes = [
      ERROR_CODES.VALIDATION_FAILED,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS
    ];
    return !noLogCodes.includes(this.code);
  }
}

// Error codes constants
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  OPERATION_FAILED: 'OPERATION_FAILED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR'
};

// Helper functions for creating specific error types
export const createValidationError = (message, details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.VALIDATION_FAILED, details);
};

export const createPermissionError = (message = 'Insufficient permissions', details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.INSUFFICIENT_PERMISSIONS, details);
};

export const createNotFoundError = (resource = 'Resource', details = {}) => {
  return new AdminServiceError(`${resource} not found`, ERROR_CODES.RESOURCE_NOT_FOUND, details);
};

export const createOperationError = (message, details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.OPERATION_FAILED, details);
};

export const createExternalServiceError = (service, details = {}) => {
  return new AdminServiceError(`External service ${service} error`, ERROR_CODES.EXTERNAL_SERVICE_ERROR, details);
};

export const createDuplicateError = (resource = 'Resource', details = {}) => {
  return new AdminServiceError(`${resource} already exists`, ERROR_CODES.DUPLICATE_RESOURCE, details);
};

export const createInvalidOperationError = (message, details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.INVALID_OPERATION, details);
};

export const createRateLimitError = (details = {}) => {
  return new AdminServiceError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT_EXCEEDED, details);
};

export const createDatabaseError = (message, details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.DATABASE_ERROR, details);
};

export const createFileUploadError = (message, details = {}) => {
  return new AdminServiceError(message, ERROR_CODES.FILE_UPLOAD_ERROR, details);
};

export default AdminServiceError;