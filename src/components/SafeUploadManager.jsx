import React from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import SupabaseUploadManager from './SupabaseUploadManager';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Create a fallback component for import failures
const ImportFailureFallback = ({ error, retry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <div className="flex items-start">
      <AlertCircle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Upload Manager Failed to Load
        </h3>
        <p className="text-red-700 mb-4">
          The upload manager component could not be loaded due to import errors.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
            <h4 className="font-medium text-red-800 mb-1">Error Details:</h4>
            <p className="text-sm text-red-700 mb-2">{error.message}</p>
            {error.stack && (
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer font-medium">Stack Trace</summary>
                <pre className="mt-2 p-2 bg-red-200 rounded overflow-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={retry}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Lazy load the admin UploadManager for admin users
const LazyAdminUploadManager = React.lazy(() => 
  import('./admin/UploadManager').catch(error => {
    console.error('Failed to load Admin UploadManager:', error);
    return {
      default: (props) => <ImportFailureFallback error={error} retry={() => window.location.reload()} {...props} />
    };
  })
);

const SafeUploadManager = (props) => {
  const { isAdmin } = useAuth();

  // Show admin upload manager for admins, regular upload manager for users
  if (isAdmin()) {
    return (
      <React.Suspense 
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2">Loading Admin Upload Manager...</span>
          </div>
        }
      >
        <LazyAdminUploadManager {...props} />
      </React.Suspense>
    );
  }

  // Regular users get the Supabase upload manager
  return (
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2">Loading Upload Manager...</span>
        </div>
      }
    >
      <SupabaseUploadManager {...props} />
    </React.Suspense>
  );
};

export default SafeUploadManager;