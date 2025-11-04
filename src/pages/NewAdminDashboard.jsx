import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FastAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';
import {
  Users, Upload, FileText, Settings, Check, X, Search, Filter,
  TrendingUp, Calendar, Shield, AlertTriangle, ShoppingCart, Package,
  BarChart3, DollarSign, Eye, Edit, Trash2, Plus, RefreshCw,
  Crown, Database, Activity, Clock, Star, Award
} from 'lucide-react';

const NewAdminDashboard = () => {
  const { userProfile, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalAdmins: 0,
    totalUploads: 0,
    pendingUploads: 0,
    totalMaterials: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalSchemes: 0,
    totalContacts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [payments, setPayments] = useState([]);

  // Redirect if not admin
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
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadUploads(),
        loadPayments(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get all users using auth admin
      const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;

      const totalUsers = allUsers.users.length;
      const totalAdmins = allUsers.users.filter(user => 
        user.user_metadata?.role === 'admin' || 
        user.email.includes('@farmtech.com')
      ).length;
      const totalFarmers = totalUsers - totalAdmins;

      // Mock data for other stats (you can replace with real queries)
      setStats({
        totalUsers,
        totalFarmers,
        totalAdmins,
        totalUploads: 156,
        pendingUploads: 23,
        totalMaterials: 45,
        totalPayments: 89,
        pendingPayments: 12,
        totalSchemes: 8,
        totalContacts: 15
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: allUsers, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      setUsers(allUsers.users.slice(0, 10)); // Show first 10 users
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadUploads = async () => {
    // Mock upload data (replace with real data)
    setUploads([
      { id: 1, farmer: 'John Doe', crop: 'Wheat', status: 'pending', date: '2024-11-04' },
      { id: 2, farmer: 'Jane Smith', crop: 'Rice', status: 'approved', date: '2024-11-03' },
      { id: 3, farmer: 'Bob Johnson', crop: 'Corn', status: 'pending', date: '2024-11-03' },
    ]);
  };

  const loadPayments = async () => {
    // Mock payment data (replace with real data)
    setPayments([
      { id: 1, farmer: 'John Doe', amount: 5000, status: 'pending', date: '2024-11-04' },
      { id: 2, farmer: 'Jane Smith', amount: 3500, status: 'approved', date: '2024-11-03' },
      { id: 3, farmer: 'Bob Johnson', amount: 4200, status: 'pending', date: '2024-11-03' },
    ]);
  };

  const loadRecentActivity = async () => {
    setRecentActivity([
      { id: 1, action: 'New user registered', user: 'John Doe', time: '2 hours ago' },
      { id: 2, action: 'Upload approved', user: 'Jane Smith', time: '4 hours ago' },
      { id: 3, action: 'Payment processed', user: 'Bob Johnson', time: '6 hours ago' },
      { id: 4, action: 'Material added', user: 'Admin', time: '1 day ago' },
    ]);
  };

  const handleApproveUpload = async (uploadId) => {
    try {
      // Mock approval (replace with real logic)
      setUploads(uploads.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'approved' } : upload
      ));
      toast.success('Upload approved successfully');
    } catch (error) {
      toast.error('Failed to approve upload');
    }
  };

  const handleRejectUpload = async (uploadId) => {
    try {
      // Mock rejection (replace with real logic)
      setUploads(uploads.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'rejected' } : upload
      ));
      toast.success('Upload rejected');
    } catch (error) {
      toast.error('Failed to reject upload');
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      // Mock approval (replace with real logic)
      setPayments(payments.map(payment => 
        payment.id === paymentId ? { ...payment, status: 'approved' } : payment
      ));
      toast.success('Payment approved successfully');
    } catch (error) {
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      // Mock rejection (replace with real logic)
      setPayments(payments.map(payment => 
        payment.id === paymentId ? { ...payment, status: 'rejected' } : payment
      ));
      toast.success('Payment rejected');
    } catch (error) {
      toast.error('Failed to reject payment');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'uploads', name: 'Uploads', icon: Upload },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'materials', name: 'Materials', icon: Package },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    ...(isSuperAdmin() ? [{ id: 'system', name: '👑 System', icon: Crown }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {isSuperAdmin() ? '👑 Super Admin' : '🛡️ Admin'} - {userProfile?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Upload className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUploads}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Payments</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Materials</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Pending Uploads ({stats.pendingUploads})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploads.filter(upload => upload.status === 'pending').map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{upload.farmer}</p>
                          <p className="text-sm text-gray-600">{upload.crop} - {upload.date}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUpload(upload.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectUpload(upload.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Pending Payments ({stats.pendingPayments})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.filter(payment => payment.status === 'pending').map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.farmer}</p>
                          <p className="text-sm text-gray-600">₹{payment.amount} - {payment.date}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayment(payment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectPayment(payment.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  All Users ({stats.totalUsers})
                </span>
                <div className="text-sm text-gray-600">
                  Farmers: {stats.totalFarmers} | Admins: {stats.totalAdmins}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const isAdminUser = user.user_metadata?.role === 'admin' || user.email.includes('@farmtech.com');
                      return (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.user_metadata?.name || user.email.split('@')[0]}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isAdminUser 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isAdminUser ? 'Admin' : 'Farmer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other tabs content can be added here */}
        {activeTab === 'uploads' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Upload management features will be implemented here.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Payment management features will be implemented here.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'materials' && (
          <Card>
            <CardHeader>
              <CardTitle>Materials Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Materials management features will be implemented here.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'system' && isSuperAdmin() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                Super Admin System Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Database className="h-6 w-6 mb-2" />
                  Database Management
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  System Settings
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewAdminDashboard;