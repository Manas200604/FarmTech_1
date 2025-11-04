import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AdminPortal = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = () => {
    const isAdmin = sessionStorage.getItem('isAdmin');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    
    if (isAdmin === 'true' && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
      
      // Session expires after 24 hours
      if (hoursDiff < 24) {
        setIsAuthenticated(true);
        navigate('/red-admin-dashboard');
      } else {
        // Session expired
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminLoginTime');
        toast.error('Admin session expired. Please login again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check against environment variables
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      if (credentials.email === adminEmail && credentials.password === adminPassword) {
        // Store admin session
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminLoginTime', new Date().toISOString());
        sessionStorage.setItem('adminEmail', credentials.email);
        
        setIsAuthenticated(true);
        toast.success('🛡️ Admin access granted!');
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/red-admin-dashboard');
        }, 1000);
      } else {
        toast.error('❌ Invalid admin credentials');
        // Clear form on failed attempt
        setCredentials({ email: '', password: '' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('❌ Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>

      <div style={{
        backgroundColor: 'white',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '25px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
              transform: 'rotate(45deg)'
            }}></div>
            <Shield size={40} style={{ marginBottom: '10px', position: 'relative', zIndex: 1 }} />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', position: 'relative', zIndex: 1 }}>
              ADMIN PORTAL
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px', position: 'relative', zIndex: 1 }}>
              FarmTech Administration Access
            </p>
          </div>
          
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
            Secure access to administrative controls
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '16px'
            }}>
              <User size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Admin Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc2626'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Enter your admin email"
              required
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '35px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '16px'
            }}>
              <Lock size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Admin Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  paddingRight: '50px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Enter your admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(220,38,38,0.3)',
              transform: loading ? 'none' : 'translateY(0)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(220,38,38,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220,38,38,0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }}></div>
                Authenticating...
              </>
            ) : (
              <>
                <Shield size={20} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
                Access Admin Portal
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          marginBottom: '25px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#92400e',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            🔒 Secure authentication with environment-based credentials
          </p>
        </div>

        {/* Back to App */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#dc2626';
              e.target.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.color = '#6b7280';
            }}
          >
            <ArrowLeft size={16} />
            Back to FarmTech
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminPortal;