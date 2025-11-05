import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/FastAuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import UploadManagerErrorBoundary from './components/UploadManagerErrorBoundary';
import EnvironmentValidator from './components/EnvironmentValidator';
import MobileWrapper from './components/mobile/MobileWrapper';
import Navbar from './components/layout/Navbar';
import { performanceMonitor } from './utils/performance';
// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const FarmerDashboard = React.lazy(() => import('./pages/FarmerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const EnvTest = React.lazy(() => import('./components/EnvTest'));
const AdminUploadManager = React.lazy(() => import('./pages/admin/AdminUploadManager'));
const AdminUserManager = React.lazy(() => import('./pages/admin/AdminUserManager'));
const AdminSchemeManager = React.lazy(() => import('./pages/admin/AdminSchemeManager'));
const AdminOrderManager = React.lazy(() => import('./pages/admin/AdminOrderManager'));
const Schemes = React.lazy(() => import('./pages/Schemes'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const Treatments = React.lazy(() => import('./pages/Treatments'));
const Support = React.lazy(() => import('./pages/Support'));
const Materials = React.lazy(() => import('./pages/Materials'));
const Cart = React.lazy(() => import('./pages/Cart'));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/admin-login" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppContent() {
  const { currentUser, userProfile } = useAuth();

  // Monitor app initialization performance
  React.useEffect(() => {
    performanceMonitor.startTiming('app-initialization');
    
    return () => {
      performanceMonitor.endTiming('app-initialization');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schemes"
            element={
              <ProtectedRoute>
                <Schemes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/treatments"
            element={
              <ProtectedRoute>
                <Treatments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-login"
            element={<AdminLogin />}
          />
          <Route
            path="/env-test"
            element={<EnvTest />}
          />
          <Route
            path="/admin/uploads"
            element={
              <UploadManagerErrorBoundary>
                <AdminUploadManager />
              </UploadManagerErrorBoundary>
            }
          />
          <Route
            path="/admin/users"
            element={<AdminUserManager />}
          />
          <Route
            path="/admin/schemes"
            element={<AdminSchemeManager />}
          />
          <Route
            path="/admin/orders"
            element={<AdminOrderManager />}
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <EnvironmentValidator>
        <LanguageProvider>
          <NetworkProvider>
            <CartProvider>
              <MobileWrapper>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AuthProvider>
                    <React.Suspense fallback={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading...</p>
                        </div>
                      </div>
                    }>
                      <AppContent />
                    </React.Suspense>
                  </AuthProvider>
                </Router>
              </MobileWrapper>
            </CartProvider>
          </NetworkProvider>
        </LanguageProvider>
      </EnvironmentValidator>
    </ErrorBoundary>
  );
}

export default App;