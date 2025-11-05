import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FastAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import SchemeManager from '../components/admin/SchemeManager';
import ContactManager from '../components/admin/ContactManager';
import SafeUploadManager from '../components/SafeUploadManager';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import PaymentReviewSystem from '../components/admin/PaymentReviewSystem';
import EnhancedMaterialsManager from '../components/admin/EnhancedMaterialsManager';
import SuperAdminControls from '../components/admin/SuperAdminControls';
import { 
  Users, 
  Upload, 
  FileText, 
  Settings,
  Check,
  X,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Shield,
  AlertTriangle,
  ShoppingCart,
  Package
} from 'lucide-react';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';
import analyticsStorage from '../utils/analyticsStorage';
import useAnalyticsTracking from '../hooks/useAnalyticsTracking';

const AdminDashboard = () => {
  const { userProfile, isAdmin, isSuperAdmin, canManageUsers, canDeleteData, canModifySystem } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Role verification - redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need administrator privileges to access this page.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/admin-login')} className="w-full">
                Admin Login
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const [uploads, setUploads] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUploads: 0,
    pendingReviews: 0,
    totalSchemes: 0
  });
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const { trackPageView } = useAnalyticsTracking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch uploads
        const { data: uploadsData, error: uploadsError } = await supabase
          .from('uploads')
          .select('*')
          .order('created_at', { ascending: false });

        if (uploadsError) throw uploadsError;
        setUploads(uploadsData || []);

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Calculate stats
        const [
          { count: totalUsers },
          { count: totalUploads },
          { count: totalSchemes }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('uploads').select('*', { count: 'exact', head: true }),
          supabase.from('schemes').select('*', { count: 'exact', head: true })
        ]);

        // Try to get stats data, but don't fail if it doesn't work
        let statsData = null;
        try {
          const { data } = await supabase.from('stats').select('*').limit(1).single();
          statsData = data;
        } catch (statsError) {
          console.log('Stats table not accessible, using calculated values');
        }

        setStats({
          totalUsers: statsData?.total_users || totalUsers || 0,
          totalUploads: statsData?.total_uploads || totalUploads || 0,
          pendingReviews: 0, // We don't have upload status in current schema
          totalSchemes: statsData?.total_schemes || totalSchemes || 0
        });

        // Load analytics summary
        try {
          const summary = await analyticsStorage.getDashboardSummary();
          setAnalyticsSummary(summary);
        } catch (analyticsError) {
          console.log('Analytics data not available, using default values');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const uploadsSubscription = supabase
      .channel('uploads_admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploads' }, fetchData)
      .subscribe();

    const usersSubscription = supabase
      .channel('users_admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe();

    return () => {
      uploadsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
    };
  }, []);

  // Track page view
  useEffect(() => {
    trackPageView('admin-dashboard', { tab: activeTab });
  }, [trackPageView, activeTab]);

  const handleReviewUpload = async (uploadId, status, adminFeedback = '') => {
    try {
      const { error } = await supabase
        .from('uploads')
        .update({
          notes: adminFeedback
        })
        .eq('id', uploadId);

      if (error) throw error;
      
      toast.success(`Upload reviewed successfully!`);
      setReviewModal(false);
      setSelectedUpload(null);
      setFeedback('');
    } catch (error) {
      console.error('Error reviewing upload:', error);
      toast.error('Failed to review upload');
    }
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = (upload.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (upload.crop_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (upload.file_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch; // Remove status filter since we don't have status field
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'materials', name: 'Materials', icon: Package },
    { id: 'payments', name: 'Payments', icon: ShoppingCart },
    { id: 'uploads', name: 'Uploads', icon: Upload },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'schemes', name: 'Manage Schemes', icon: FileText },
    { id: 'contacts', name: 'Manage Contacts', icon: Users },
    { id: 'content', name: 'Content Overview', icon: Settings },
    ...(isSuperAdmin() ? [{ id: 'superadmin', name: '👑 Super Admin', icon: Shield }] : [])
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-primary-100 mt-1">
              Manage users, review uploads, and oversee platform content
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary-200" />
            <div className="text-right">
              <p className="text-sm text-primary-100">Logged in as</p>
              <p className="font-medium">{userProfile?.name || userProfile?.email}</p>
              {isSuperAdmin() && (
                <p className="text-xs text-yellow-200 font-semibold">🔑 SUPER ADMIN</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Privileges Panel */}
      {isSuperAdmin() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Super Administrator Privileges</h3>
              <p className="text-xs text-yellow-700 mt-1">
                You have complete system control including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-yellow-700">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  User Management
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Data Deletion
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  System Settings
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Full Override
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUploads}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Schemes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Analytics Cards */}
          {analyticsSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{analyticsSummary.totalRevenue.toLocaleString()}</p>
                    {analyticsSummary.growth?.revenue && (
                      <p className={`text-sm ${analyticsSummary.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsSummary.growth.revenue >= 0 ? '+' : ''}{analyticsSummary.growth.revenue}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsSummary.totalOrders}</p>
                    {analyticsSummary.growth?.orders && (
                      <p className={`text-sm ${analyticsSummary.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsSummary.growth.orders >= 0 ? '+' : ''}{analyticsSummary.growth.orders}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-lg">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsSummary.activeUsers}</p>
                    {analyticsSummary.growth?.users && (
                      <p className={`text-sm ${analyticsSummary.growth.users >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsSummary.growth.users >= 0 ? '+' : ''}{analyticsSummary.growth.users}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsSummary.conversionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Avg Order: ₹{analyticsSummary.averageOrderValue.toFixed(0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploads.slice(0, 5).map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{upload.file_name}</h4>
                        <p className="text-sm text-gray-600">
                          {upload.crop_type || 'Unknown crop'} • {formatDate(upload.created_at)}
                        </p>
                        {upload.notes && (
                          <p className="text-xs text-gray-500">{upload.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUpload(upload);
                        setReviewModal(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
                {uploads.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No uploads yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard />
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <EnhancedMaterialsManager />
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <PaymentReviewSystem />
      )}

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <SafeUploadManager />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Role: {user.role} • Joined: {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          {/* Content Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/schemes')}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <FileText className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">View Schemes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Browse all government schemes and programs
                </p>
                <Button className="w-full">
                  View Schemes
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/contacts')}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Users className="h-12 w-12 text-secondary-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Contacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and contact agricultural specialists
                </p>
                <Button variant="secondary" className="w-full">
                  View Contacts
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/treatments')}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Settings className="h-12 w-12 text-accent-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Treatments</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Browse pesticides and fertilizers
                </p>
                <Button variant="outline" className="w-full">
                  View Treatments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{stats.totalSchemes}</div>
                  <div className="text-sm text-gray-600">Government Schemes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-600">15</div>
                  <div className="text-sm text-gray-600">Expert Contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-600">3</div>
                  <div className="text-sm text-gray-600">Treatment Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schemes Management Tab */}
      {activeTab === 'schemes' && (
        <SchemeManager />
      )}

      {/* Contacts Management Tab */}
      {activeTab === 'contacts' && (
        <ContactManager />
      )}

      {/* Review Modal */}
      {reviewModal && selectedUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Review Upload</h2>
              <button
                onClick={() => {
                  setReviewModal(false);
                  setSelectedUpload(null);
                  setFeedback('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">File preview not available</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Upload Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>File Name:</strong> {selectedUpload.file_name}</p>
                  <p><strong>Crop Type:</strong> {selectedUpload.crop_type || 'Not specified'}</p>
                  <p><strong>File Size:</strong> {(selectedUpload.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Uploaded:</strong> {formatDate(selectedUpload.created_at)}</p>
                  {selectedUpload.notes && (
                    <p><strong>Current Notes:</strong> {selectedUpload.notes}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add notes or feedback for this upload..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewModal(false);
                    setSelectedUpload(null);
                    setFeedback('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReviewUpload(selectedUpload.id, 'reviewed', feedback)}
                  className="flex items-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Notes</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Tab */}
      {activeTab === 'superadmin' && isSuperAdmin() && (
        <SuperAdminControls />
      )}
    </div>
  );
};

export default AdminDashboard;