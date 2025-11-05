/**
 * Environment Variable Validation Utility
 * Validates required environment variables for the FarmTech application
 */

// Required environment variables for the application to function
const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: {
    name: 'VITE_SUPABASE_URL',
    description: 'Supabase project URL',
    example: 'https://your-project-id.supabase.co',
    setupInstructions: 'Get this from your Supabase project dashboard at https://supabase.com/dashboard',
    validator: (value) => {
      if (!value) return 'Supabase URL is required for database connectivity';
      try {
        const url = new URL(value);
        if (!value.includes('supabase.co')) {
          return 'Must be a valid Supabase URL (should contain "supabase.co")';
        }
        if (url.protocol !== 'https:') {
          return 'Supabase URL must use HTTPS protocol';
        }
        return null;
      } catch {
        return 'Invalid URL format - must be a valid HTTPS URL';
      }
    }
  },
  VITE_SUPABASE_ANON_KEY: {
    name: 'VITE_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key for client authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    setupInstructions: 'Get this from your Supabase project settings under API keys',
    validator: (value) => {
      if (!value) return 'Supabase anonymous key is required for authentication';
      if (value.length < 100) return 'Invalid Supabase key format - key appears too short';
      if (!value.startsWith('eyJ')) return 'Invalid JWT format - Supabase keys should start with "eyJ"';
      return null;
    }
  }
};

// Optional environment variables that enhance functionality
const OPTIONAL_ENV_VARS = {
  VITE_SUPABASE_STORAGE_BUCKET: {
    description: 'Supabase Storage bucket name for file uploads',
    example: 'uploads',
    impact: 'Default bucket name "uploads" will be used',
    validator: (value) => {
      if (value && (value.length < 3 || /[^a-zA-Z0-9_-]/.test(value))) {
        return 'Invalid bucket name format - should contain only letters, numbers, hyphens, and underscores';
      }
      return null;
    }
  },
  VITE_ADMIN_USERNAME: {
    description: 'Admin username for environment-based authentication',
    example: 'admin',
    impact: 'Admin login functionality will be disabled',
    validator: (value) => {
      if (value && value.length < 3) {
        return 'Admin username should be at least 3 characters';
      }
      return null;
    }
  },
  VITE_ADMIN_PASSWORD: {
    description: 'Admin password for environment-based authentication',
    example: 'your-secure-password',
    impact: 'Admin login functionality will be disabled',
    validator: (value) => {
      if (value && value.length < 8) {
        return 'Admin password should be at least 8 characters for security';
      }
      return null;
    }
  },
  VITE_APP_NAME: {
    description: 'Application display name',
    example: 'FarmTech',
    impact: 'Default application name will be used',
    validator: (value) => {
      if (value && value.length > 50) {
        return 'Application name should be 50 characters or less';
      }
      return null;
    }
  },
  VITE_APP_VERSION: {
    description: 'Application version number',
    example: '1.0.0',
    impact: 'Version information will not be displayed',
    validator: (value) => {
      if (value && !/^\d+\.\d+\.\d+/.test(value)) {
        return 'Invalid version format - should follow semantic versioning (e.g., 1.0.0)';
      }
      return null;
    }
  },

  VITE_ADMIN_SECRET_CODE: {
    description: 'Legacy admin secret code (deprecated)',
    example: 'your-secure-admin-code',
    impact: 'Legacy admin access features may be limited',
    validator: (value) => {
      if (value && value.length < 6) {
        return 'Admin secret code should be at least 6 characters for security';
      }
      return null;
    }
  }
};

/**
 * Validates all required environment variables
 * @returns {Object} Validation result with errors and warnings
 */
export function validateEnvironmentVariables() {
  const errors = [];
  const warnings = [];
  const missingRequired = [];
  const missingOptional = [];
  const invalidOptional = [];

  // Check required variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = import.meta.env[key];
    
    if (!value) {
      missingRequired.push({
        variable: key,
        config: config
      });
      errors.push({
        variable: key,
        message: config.validator(''),
        severity: 'error',
        config: config
      });
    } else {
      const validationError = config.validator(value);
      if (validationError) {
        errors.push({
          variable: key,
          message: validationError,
          severity: 'error',
          config: config
        });
      }
    }
  });

  // Check optional variables
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, config]) => {
    const value = import.meta.env[key];
    
    if (!value) {
      missingOptional.push({
        variable: key,
        config: config
      });
      warnings.push({
        variable: key,
        message: `${config.description} is not configured`,
        impact: config.impact,
        severity: 'warning',
        config: config
      });
    } else {
      // Validate optional variables if they are provided
      const validationError = config.validator ? config.validator(value) : null;
      if (validationError) {
        invalidOptional.push({
          variable: key,
          config: config
        });
        warnings.push({
          variable: key,
          message: validationError,
          severity: 'warning',
          config: config
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    missingRequired: missingRequired.map(item => item.variable),
    missingOptional: missingOptional.map(item => item.variable),
    invalidOptional: invalidOptional.map(item => item.variable),
    detailedMissing: {
      required: missingRequired,
      optional: missingOptional,
      invalid: invalidOptional
    },
    summary: {
      totalRequired: Object.keys(REQUIRED_ENV_VARS).length,
      validRequired: Object.keys(REQUIRED_ENV_VARS).length - missingRequired.length,
      totalOptional: Object.keys(OPTIONAL_ENV_VARS).length,
      validOptional: Object.keys(OPTIONAL_ENV_VARS).length - missingOptional.length - invalidOptional.length,
      hasStorageConfig: !!(import.meta.env.VITE_SUPABASE_URL && 
                               import.meta.env.VITE_SUPABASE_ANON_KEY),
      hasAdminConfig: !!(import.meta.env.VITE_ADMIN_USERNAME && 
                        import.meta.env.VITE_ADMIN_PASSWORD)
    }
  };
}

/**
 * Checks if the application can function with current environment variables
 * @returns {boolean} True if minimum requirements are met
 */
export function canApplicationStart() {
  const validation = validateEnvironmentVariables();
  return validation.isValid;
}

/**
 * Gets environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value or fallback
 */
export function getEnvVar(key, fallback = '') {
  return import.meta.env[key] || fallback;
}

/**
 * Gets Supabase configuration with validation
 * @returns {Object} Supabase configuration or null if invalid
 */
export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  try {
    new URL(url);
    return { url, anonKey };
  } catch {
    return null;
  }
}

/**
 * Generates helpful error messages for missing environment variables
 * @param {Array} missingVars - Array of missing variable names
 * @returns {string} Formatted error message
 */
export function generateEnvErrorMessage(missingVars) {
  if (missingVars.length === 0) return '';

  const varList = missingVars.map(variable => `  - ${variable}`).join('\n');
  
  return `Missing required environment variables:\n${varList}\n\nPlease check your .env file and ensure all required variables are set.`;
}

/**
 * Generates a comprehensive setup guide for missing environment variables
 * @param {Object} validation - Validation result from validateEnvironmentVariables
 * @returns {Object} Setup guide with instructions and examples
 */
export function generateSetupGuide(validation) {
  const guide = {
    hasIssues: validation.errors.length > 0 || validation.warnings.length > 0,
    requiredSteps: [],
    optionalSteps: [],
    exampleEnvFile: '',
    deploymentNotes: []
  };

  // Generate required steps
  if (validation.detailedMissing.required.length > 0) {
    guide.requiredSteps = validation.detailedMissing.required.map(item => ({
      variable: item.variable,
      description: item.config.description,
      example: item.config.example,
      instructions: item.config.setupInstructions,
      priority: 'high'
    }));
  }

  // Generate optional steps
  if (validation.detailedMissing.optional.length > 0) {
    guide.optionalSteps = validation.detailedMissing.optional.map(item => ({
      variable: item.variable,
      description: item.config.description,
      example: item.config.example,
      impact: item.config.impact,
      priority: 'low'
    }));
  }

  // Generate example .env file content
  const allVars = { ...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS };
  const envLines = Object.entries(allVars).map(([key, config]) => {
    const example = typeof config === 'object' ? config.example : 'your-value-here';
    const description = typeof config === 'object' ? config.description : config;
    return `# ${description}\n${key}=${example}`;
  });
  
  guide.exampleEnvFile = envLines.join('\n\n');

  // Generate deployment notes
  guide.deploymentNotes = [
    'For Netlify deployment, set environment variables in Site Settings > Environment Variables',
    'Only variables prefixed with VITE_ are available in client-side code',
    'Never commit sensitive keys to version control',
    'Use strong, unique values for admin credentials',
    'Test the configuration locally before deploying'
  ];

  return guide;
}

/**
 * Validates environment variables at application startup
 * Throws an error if critical variables are missing in production
 * @param {boolean} throwOnError - Whether to throw an error for missing required variables
 * @returns {Object} Validation result
 */
export function validateAtStartup(throwOnError = false) {
  const validation = validateEnvironmentVariables();
  
  // Log validation results
  logEnvironmentStatus();
  
  // In production, we might want to throw an error for missing required variables
  if (throwOnError && !validation.isValid) {
    const missingVars = validation.missingRequired.join(', ');
    throw new Error(`Application cannot start: Missing required environment variables: ${missingVars}`);
  }
  
  return validation;
}

/**
 * Checks if specific feature sets are properly configured
 * @returns {Object} Feature availability status
 */
export function checkFeatureAvailability() {
  const validation = validateEnvironmentVariables();
  
  return {
    database: validation.isValid, // Requires Supabase config
    imageUploads: validation.summary.hasStorageConfig, // Uses Supabase Storage
    adminFeatures: validation.summary.hasAdminConfig,
    fullFunctionality: validation.isValid && validation.summary.hasStorageConfig && validation.summary.hasAdminConfig
  };
}

/**
 * Development helper to log environment status
 */
export function logEnvironmentStatus() {
  if (import.meta.env.MODE === 'development') {
    const validation = validateEnvironmentVariables();
    const features = checkFeatureAvailability();
    
    console.group('🌍 Environment Variables Status');
    console.log(`✅ Valid: ${validation.isValid ? 'Yes' : 'No'}`);
    console.log(`📊 Required: ${validation.summary.validRequired}/${validation.summary.totalRequired}`);
    console.log(`📊 Optional: ${validation.summary.validOptional}/${validation.summary.totalOptional}`);
    
    console.group('🚀 Feature Availability');
    console.log(`Database: ${features.database ? '✅' : '❌'}`);
    console.log(`Image Uploads: ${features.imageUploads ? '✅' : '❌'}`);
    console.log(`Admin Features: ${features.adminFeatures ? '✅' : '❌'}`);
    console.log(`Full Functionality: ${features.fullFunctionality ? '✅' : '❌'}`);
    console.groupEnd();
    
    if (validation.errors.length > 0) {
      console.group('❌ Errors');
      validation.errors.forEach(error => {
        console.error(`${error.variable}: ${error.message}`);
        if (error.config?.setupInstructions) {
          console.info(`Setup: ${error.config.setupInstructions}`);
        }
      });
      console.groupEnd();
    }
    
    if (validation.warnings.length > 0) {
      console.group('⚠️ Warnings');
      validation.warnings.forEach(warning => {
        console.warn(`${warning.variable}: ${warning.message}`);
        if (warning.impact) {
          console.info(`Impact: ${warning.impact}`);
        }
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}