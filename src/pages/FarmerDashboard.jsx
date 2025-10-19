import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import UploadModal from '../components/upload/UploadModal';
import {
  Upload,
  FileText,
  Users,
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Leaf,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabase/client';

const FarmerDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAllUploads, setShowAllUploads] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState({
    totalUploads: 0,
    pendingReviews: 0,
    reviewedUploads: 0
  });

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchUploads = async () => {
      try {
        const { data: uploadsData, error } = await supabase
          .from('uploads')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setUploads(uploadsData || []);

        // Calculate stats
        const totalUploads = uploadsData?.length || 0;
        const pendingReviews = uploadsData?.filter(upload => upload.status === 'pending').length || 0;
        const reviewedUploads = uploadsData?.filter(upload => upload.status === 'reviewed').length || 0;

        setStats({
          totalUploads,
          pendingReviews,
          reviewedUploads
        });
      } catch (error) {
        console.error('Error fetching uploads:', error);
      }
    };

    fetchUploads();

    // Set up real-time subscription
    const subscription = supabase
      .channel('uploads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'uploads',
          filter: `user_id=eq.${userProfile.id}`
        }, 
        () => {
          fetchUploads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile?.id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userProfile?.name}!</h1>
            <p className="text-primary-100 mt-1">
              Manage your crops and get expert advice
            </p>
            {userProfile?.farmDetails && (
              <div className="mt-3 text-sm text-primary-100">
                <p>📍 {userProfile.farmDetails.location}</p>
                <p>🌾 {userProfile.farmDetails.cropType?.join(', ')}</p>
              </div>
            )}
          </div>
          <Leaf className="h-16 w-16 text-primary-200" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
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
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reviewedUploads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowUploadModal(true)}>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Camera className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Crop Photo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get expert advice on your crops by uploading photos
            </p>
            <Button className="w-full">
              Upload Now
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/schemes')}>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Schemes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Explore government schemes and subsidies
            </p>
            <Button variant="secondary" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/schemes'); }}>
              View Schemes
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/contacts')}>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-accent-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Experts</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect with agricultural specialists
            </p>
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/contacts'); }}>
              Find Experts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Materials Support Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Need Agricultural Materials Guidance?</h3>
                <p className="text-sm text-gray-600">
                  Get expert recommendations for pesticides, fertilizers, and other agricultural materials
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/support')} className="bg-blue-600 hover:bg-blue-700">
              Get Materials Help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
              <p className="text-gray-600 mb-4">
                Start by uploading your first crop photo to get expert advice
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                Upload Your First Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.slice(0, 5).map((upload) => (
                <div key={upload.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <img
                    src={upload.image_url}
                    alt={upload.description}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{upload.description}</h4>
                    <p className="text-sm text-gray-600">Crop: {upload.crop_type}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {formatDate(upload.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(upload.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}

              {uploads.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => setShowAllUploads(true)}>
                    View All Uploads ({uploads.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* All Uploads Modal */}
      {showAllUploads && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">All Your Uploads</h2>
              <button
                onClick={() => setShowAllUploads(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <img
                      src={upload.image_url}
                      alt={upload.description}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{upload.description}</h4>
                      <p className="text-sm text-gray-600">Crop: {upload.crop_type}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {formatDate(upload.created_at)}
                      </p>
                      {upload.location && (
                        <p className="text-xs text-gray-500">Location: {upload.location}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {uploads.length === 0 && (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by uploading your first crop photo to get expert advice
                  </p>
                  <Button onClick={() => { setShowAllUploads(false); setShowUploadModal(true); }}>
                    Upload Your First Photo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;