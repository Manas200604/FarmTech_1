import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import SeedData from '../components/admin/SeedData';
import ExpertManager from '../components/admin/ExpertManager';
import InquiryManager from '../components/admin/InquiryManager';
import { 
  Users, 
  Upload, 
  FileText, 
  Settings,
  Eye,
  Check,
  X,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [uploads, setUploads] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUploads: 0,
    pendingReviews: 0,
    totalSchemes: 0
  });
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
          { count: pendingReviews },
          { count: totalSchemes }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('uploads').select('*', { count: 'exact', head: true }),
          supabase.from('uploads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('schemes').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          totalUsers: totalUsers || 0,
          totalUploads: totalUploads || 0,
          pendingReviews: pendingReviews || 0,
          totalSchemes: totalSchemes || 0
        });
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

  const handleReviewUpload = async (uploadId, status, adminFeedback = '') => {
    try {
      const { error } = await supabase
        .from('uploads')
        .update({
          status,
          admin_feedback: adminFeedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin' // In a real app, use actual admin ID
        })
        .eq('id', uploadId);

      if (error) throw error;
      
      toast.success(`Upload ${status} successfully!`);
      setReviewModal(false);
      setSelectedUpload(null);
      setFeedback('');
    } catch (error) {
      console.error('Error reviewing upload:', error);
      toast.error('Failed to review upload');
    }
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = upload.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         upload.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || upload.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    { id: 'uploads', name: 'Uploads', icon: Upload },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'experts', name: 'Experts', icon: Users },
    { id: 'inquiries', name: 'Material Requests', icon: MessageSquare },
    { id: 'content', name: 'Content', icon: Settings }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-primary-100 mt-1">
          Manage users, review uploads, and oversee platform content
        </p>
      </div>

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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads Requiring Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploads.filter(upload => upload.status === 'pending').slice(0, 5).map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={upload.imageUrl}
                        alt={upload.description}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{upload.description}</h4>
                        <p className="text-sm text-gray-600">
                          {upload.cropType} • {formatDate(upload.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUpload(upload);
                        setReviewModal(true);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search uploads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploads List */}
          <Card>
            <CardHeader>
              <CardTitle>All Uploads ({filteredUploads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <img
                        src={upload.imageUrl}
                        alt={upload.description}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{upload.description}</h4>
                        <p className="text-sm text-gray-600">
                          Crop: {upload.cropType} • Location: {upload.location || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {formatDate(upload.createdAt)}
                        </p>
                        {upload.adminFeedback && (
                          <p className="text-sm text-blue-600 mt-1">
                            Feedback: {upload.adminFeedback}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                      {upload.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUpload(upload);
                            setReviewModal(true);
                          }}
                        >
                          Review
                        </Button>
                      )}
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
                      Role: {user.role} • Joined: {formatDate(user.createdAt)}
                    </p>
                    {user.farmDetails && (
                      <p className="text-xs text-gray-500">
                        Farm: {user.farmDetails.location} • Crops: {user.farmDetails.cropType?.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
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

      {/* Experts Tab */}
      {activeTab === 'experts' && (
        <ExpertManager />
      )}

      {/* Material Requests Tab */}
      {activeTab === 'inquiries' && (
        <InquiryManager />
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          {/* Database Seeding */}
          <div className="mb-8">
            <SeedData />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <FileText className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Schemes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add, edit, or remove government schemes
                </p>
                <Button className="w-full">
                  Manage Schemes
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Users className="h-12 w-12 text-secondary-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Contacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add or update specialist contacts
                </p>
                <Button variant="secondary" className="w-full">
                  Manage Contacts
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Settings className="h-12 w-12 text-accent-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Treatments</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Manage pesticides and fertilizers
                </p>
                <Button variant="outline" className="w-full">
                  Manage Treatments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <div>
                <img
                  src={selectedUpload.imageUrl}
                  alt={selectedUpload.description}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Upload Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Description:</strong> {selectedUpload.description}</p>
                  <p><strong>Crop Type:</strong> {selectedUpload.cropType}</p>
                  <p><strong>Location:</strong> {selectedUpload.location || 'N/A'}</p>
                  <p><strong>Uploaded:</strong> {formatDate(selectedUpload.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide feedback or advice for the farmer..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleReviewUpload(selectedUpload.id, 'rejected', feedback)}
                  className="flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </Button>
                <Button
                  onClick={() => handleReviewUpload(selectedUpload.id, 'reviewed', feedback)}
                  className="flex items-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;