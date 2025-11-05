import React, { useState } from 'react';
import { validateEnvironmentVariables, generateEnvErrorMessage } from '../utils/environmentValidation';

/**
 * Fallback UI component displayed when required environment variables are missing
 * Provides helpful information and guidance for resolving configuration issues
 */
const EnvironmentErrorFallback = ({ onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const validation = validateEnvironmentVariables();

  const handleRetry = () => {
    // Reload the page to re-check environment variables
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const exampleEnvContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudinary Configuration (Optional)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Application Configuration (Optional)
VITE_APP_NAME=FarmTech
VITE_APP_VERSION=1.0.0
VITE_ADMIN_SECRET_CODE=your-admin-code
VITE_ADMIN_EMAIL=admin@farmtech.com`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-red-800">
                Configuration Required
              </h1>
              <p className="text-red-600 mt-1">
                The application cannot start due to missing environment variables
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Missing Configuration</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Required Variables:</span>
                  <span className="ml-2 text-red-600">
                    {validation.summary.validRequired}/{validation.summary.totalRequired}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Optional Variables:</span>
                  <span className="ml-2 text-yellow-600">
                    {validation.summary.validOptional}/{validation.summary.totalOptional}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Variables List */}
          {validation.missingRequired.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">Required Variables</h3>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="space-y-1">
                  {validation.missingRequired.map((variable) => (
                    <li key={variable} className="text-sm text-red-700 font-mono">
                      • {variable}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Setup Instructions</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Create a <code className="bg-blue-100 px-1 rounded">.env</code> file in your project root</li>
                <li>Add the required environment variables (see example below)</li>
                <li>Get your Supabase credentials from your Supabase project dashboard</li>
                <li>Save the file and refresh this page</li>
              </ol>
            </div>
          </div>

          {/* Example .env file */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-gray-900">Example .env File</h3>
              <button
                onClick={() => copyToClipboard(exampleEnvContent)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm overflow-x-auto">
              {exampleEnvContent}
            </pre>
          </div>

          {/* Detailed Errors (Collapsible) */}
          {validation.errors.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <svg 
                  className={`w-4 h-4 mr-1 transform transition-transform ${showDetails ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                {showDetails ? 'Hide' : 'Show'} detailed errors
              </button>
              
              {showDetails && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                  <ul className="space-y-2">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-mono text-red-600">{error.variable}:</span>
                        <span className="ml-2 text-gray-700">{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Check Again
            </button>
            <button
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Open Supabase Dashboard
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Need help? Check the project documentation or contact your system administrator.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentErrorFallback;