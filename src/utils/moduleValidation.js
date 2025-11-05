/**
 * Module validation utility to check for missing dependencies and imports
 */

/**
 * Check if a module can be imported successfully
 * @param {string} modulePath - Path to the module
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const validateModule = async (modulePath) => {
  try {
    await import(modulePath);
    return { success: true };
  } catch (error) {
    console.warn(`Module validation failed for ${modulePath}:`, error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Validate multiple modules
 * @param {string[]} modulePaths - Array of module paths
 * @returns {Promise<{valid: boolean, results: Object}>}
 */
export const validateModules = async (modulePaths) => {
  const results = {};
  let allValid = true;

  for (const modulePath of modulePaths) {
    const result = await validateModule(modulePath);
    results[modulePath] = result;
    if (!result.success) {
      allValid = false;
    }
  }

  return {
    valid: allValid,
    results
  };
};

/**
 * Check if required dependencies are available
 * @param {string[]} dependencies - Array of dependency names
 * @returns {Promise<{valid: boolean, missing: string[]}>}
 */
export const validateDependencies = async (dependencies) => {
  const missing = [];

  for (const dep of dependencies) {
    try {
      await import(dep);
    } catch (error) {
      console.warn(`Dependency validation failed for ${dep}:`, error);
      missing.push(dep);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Validate UploadManager specific dependencies
 * @returns {Promise<{valid: boolean, issues: string[]}>}
 */
export const validateUploadManagerDependencies = async () => {
  const issues = [];

  try {
    // Check required modules with proper error handling
    const moduleChecks = [
      { name: 'FastAuthContext', path: '../../contexts/FastAuthContext' },
      { name: 'Supabase Client', path: '../../supabase/client' },
      { name: 'UI Card', path: '../../components/ui/Card' },
      { name: 'UI Button', path: '../../components/ui/Button' },
      { name: 'UI Badge', path: '../../components/ui/Badge' },
      { name: 'Uploads Storage', path: '../../utils/uploadsStorage' },
      { name: 'CN Utility', path: '../../utils/cn' }
    ];

    for (const module of moduleChecks) {
      try {
        await import(module.path);
      } catch (error) {
        console.warn(`Module validation failed for ${module.name}:`, error);
        issues.push(`${module.name} module unavailable: ${error.message}`);
      }
    }

    // Check required dependencies
    const dependencies = [
      'react',
      'react-hot-toast', 
      'lucide-react',
      'clsx'
    ];

    for (const dep of dependencies) {
      try {
        await import(dep);
      } catch (error) {
        console.warn(`Dependency validation failed for ${dep}:`, error);
        issues.push(`Missing dependency: ${dep}`);
      }
    }

    // Check for localStorage availability (needed for uploadsStorage)
    if (typeof window !== 'undefined' && typeof localStorage === 'undefined') {
      issues.push('localStorage not available - uploads storage will not work');
    }

  } catch (error) {
    issues.push(`Validation process failed: ${error.message}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Create a validation result object
 * @param {Function} validator - Validation function
 * @returns {Promise<{valid: boolean, issues: string[]}>}
 */
export const createValidationResult = async (validator) => {
  try {
    const result = await validator();
    return {
      valid: result.valid,
      issues: result.issues || []
    };
  } catch (error) {
    return {
      valid: false,
      issues: [`Validation error: ${error.message}`]
    };
  }
};