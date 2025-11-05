import React, { useState, useEffect } from 'react';
import { validateEnvironmentVariables, logEnvironmentStatus } from '../utils/environmentValidation';
import EnvironmentErrorFallback from './EnvironmentErrorFallback';

/**
 * Environment Validator Component
 * Validates environment variables before rendering the application
 * Shows fallback UI if required variables are missing
 */
const EnvironmentValidator = ({ children }) => {
  const [validation, setValidation] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkEnvironment = () => {
    setIsChecking(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const result = validateEnvironmentVariables();
      setValidation(result);
      setIsChecking(false);
      
      // Log environment status in development
      logEnvironmentStatus();
    }, 100);
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  const handleRetry = () => {
    checkEnvironment();
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Checking configuration...</p>
        </div>
      </div>
    );
  }

  // Show error fallback if validation failed
  if (!validation?.isValid) {
    return <EnvironmentErrorFallback onRetry={handleRetry} />;
  }

  // Show warning banner for missing optional variables (but still render app)
  const WarningBanner = () => {
    if (!validation.hasWarnings) return null;

    return (
      <div className="bg-yellow-50 border-b border-yellow-200 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800">
              Some optional features may not work properly due to missing configuration.
            </span>
          </div>
          <button
            onClick={() => console.log('Optional variables:', validation.missingOptional)}
            className="text-sm text-yellow-700 hover:text-yellow-900 underline"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  // Render the application with optional warning banner
  return (
    <>
      <WarningBanner />
      {children}
    </>
  );
};

export default EnvironmentValidator;