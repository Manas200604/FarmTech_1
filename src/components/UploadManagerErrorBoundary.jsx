import ErrorBoundary from './ErrorBoundary';
import { Upload, AlertCircle } from 'lucide-react';

const UploadManagerFallback = (error, retry) => (
  <div className="bg-white rounded-lg shadow-lg p-8">
    <div className="text-center">
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Upload Manager Unavailable
      </h2>
      
      <p className="text-gray-600 mb-6">
        The upload management system encountered an error and couldn't load properly.
        This might be due to missing dependencies or configuration issues.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Error Details:
              </h3>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Upload className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-left">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Possible Solutions:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check that all required dependencies are installed</li>
              <li>• Verify environment variables are properly configured</li>
              <li>• Ensure Supabase connection is working</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-3">
        <button
          onClick={retry}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Retry Loading
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

const UploadManagerErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      title="Upload Manager Error"
      message="The upload management component failed to load."
      fallback={UploadManagerFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default UploadManagerErrorBoundary;