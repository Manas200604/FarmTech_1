import React from 'react';

const EnvTest = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    VITE_SUPABASE_STORAGE_BUCKET: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET,
    VITE_ADMIN_USERNAME: import.meta.env.VITE_ADMIN_USERNAME,
    VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD ? 'SET' : 'NOT SET',
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Environment Variables Test</h2>
      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="text-sm">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Admin Login Test</h3>
        <p>Username: <code>{import.meta.env.VITE_ADMIN_USERNAME || 'NOT SET'}</code></p>
        <p>Password: <code>{import.meta.env.VITE_ADMIN_PASSWORD ? 'SET (hidden)' : 'NOT SET'}</code></p>
      </div>
    </div>
  );
};

export default EnvTest;