import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FastAuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import UploadModal from '../components/upload/UploadModal';
import UploadStatus from '../components/farmer/UploadStatus';
import {
  Upload,
  FileText,
  Users,
  Camera,
  Clock,
  CheckCircle,
  Leaf,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabase/client';

const FarmerDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
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
        // Try to load from Supabase first
        const { data: supabaseUploads, error } = await supabase
          .from('uploads')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        let allUploads = [];

        if (error) {
          console.log('Loading from localStorage fallback...');
        } else {
          allUploads = supabaseUploads || [];
        }

        // Also load from localStorage (for development mode uploads)
        const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
        
        // Filter local uploads for current user and merge
        const userLocalUploads = localUploads.filter(upload => 
          upload.user_id === userProfile.id
        );

        // Merge and deduplicate uploads
        const mergedUploads = [...allUploads];
        
        userLocalUploads.forEach(localUpload => {
          // Add local uploads that aren't already in Supabase
          if (!allUploads.find(u => u.file_path === localUpload.file_path)) {
            mergedUploads.push({
              ...localUpload,
              source: 'local'
            });
          }
        });

        setUploads(mergedUploads);

        // Calculate enhanced stats
        const totalUploads = mergedUploads.length;
        const pendingUploads = mergedUploads.filter(upload => 
          !upload.status || upload.status === 'pending'
        ).length;
        const reviewedUploads = mergedUploads.filter(upload => 
          upload.status === 'approved' || upload.status === 'rejected' || upload.admin_notes
        ).length;

        setStats({
          totalUploads,
          pendingReviews: pendingUploads,
          reviewedUploads: reviewedUploads
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Uploads
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
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


        </div>
      )}

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <UploadStatus />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
        />
      )}


    </div>
  );
};

export default FarmerDashboard;