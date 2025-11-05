import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Upload } from 'lucide-react';
import UploadManagerErrorBoundary from './UploadManagerErrorBoundary';
import { validateUploadManagerDependencies } from '../utils/moduleValidation';

// Enhanced error boundary specifically for UploadManager
const RobustUploadManagerWrapper = ({ children }) => {
  const [validationState, setValidationState] = useState({
    loading: true,
    valid: false,
    issues: []
  });

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    validateDependencies();
  }, [retryCount]);

  const validateDependencies = async () => {
    try {
      setValidationState(prev => ({ ...prev, loading: true }));
      
      const result = await validateUploadManagerDependencies();
      
      setValidationState({
        loading: false,
        valid: result.valid,
        issues: result.issues || []
      });
    } catch (error) {
      console.error('Dependency validation failed:', error);
      setValidationState({
        loading: false,
        valid: false,
        issues: [`Validation error: ${error.message}`]
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (validationState.loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating upload manager dependencies...</p>
        </div>
      </div>
    );
  }

  if (!validationState.valid) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Upload Manager Dependencies Missing
            </h3>
            <p className="text-red-700 mb-4">
              The upload manager cannot load due to missing or invalid dependencies:
            </p>
            
            <ul className="list-disc list-inside text-red-600 space-y-1 mb-4">
              {validationState.issues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <div className="flex items-start">
                <Upload className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Troubleshooting Steps:
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Ensure all npm dependencies are installed</li>
                    <li>• Check that environment variables are configured</li>
                    <li>• Verify Supabase connection is working</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Validation
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UploadManagerErrorBoundary>
      {children}
    </UploadManagerErrorBoundary>
  );
};

export default RobustUploadManagerWrapper;