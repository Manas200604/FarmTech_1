import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAuthContext';
import { supabase } from '../../supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Clock, 
  Check, 
  X, 
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';

const UploadStatus = () => {
  const { userProfile } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyUploads = async () => {
    if (!userProfile?.id) {
      console.log('No user profile ID available');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading uploads for user:', userProfile.id);
      
      // Load from Supabase only (no more localStorage fallback)
      const { data: supabaseUploads, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading uploads:', error.message);
        setUploads([]);
        return;
      }

      const uploads = supabaseUploads || [];
      console.log('Loaded from Supabase:', uploads.length, 'uploads');
      setUploads(uploads);
    } catch (error) {
      console.error('Error loading uploads:', error);
      setUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.id) {
      loadMyUploads();
    }
  }, [userProfile]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        text: 'Under Review'
      },
      approved: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: Check,
        text: 'Approved'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: X,
        text: 'Rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getStatusMessage = (upload) => {
    const status = upload.status || 'pending';
    
    if (status === 'pending') {
      return {
        title: 'Upload Under Review',
        message: 'Your upload is being reviewed by our agricultural experts. You will be notified once the review is complete.',
        color: 'text-yellow-700'
      };
    } else if (status === 'approved') {
      return {
        title: 'Upload Approved!',
        message: 'Great job! Your crop photo has been approved by our experts.',
        color: 'text-green-700'
      };
    } else if (status === 'rejected') {
      return {
        title: 'Upload Needs Improvement',
        message: 'Your upload was reviewed and needs some improvements. Please check the feedback below.',
        color: 'text-red-700'
      };
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your uploads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Uploads</h2>
        <Button onClick={loadMyUploads} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {uploads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
            <p className="text-gray-500 mb-4">
              Start by uploading your first crop photo for expert review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload) => {
            const statusInfo = getStatusMessage(upload);
            
            return (
              <Card key={upload.id || upload.file_path} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{upload.file_name}</h3>
                          {getStatusBadge(upload.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Uploaded {new Date(upload.created_at).toLocaleDateString()}</span>
                          </div>
                          <span>•</span>
                          <span>Crop: {upload.crop_type || 'Not specified'}</span>
                        </div>

                        <div className={`p-3 rounded-lg border-l-4 ${
                          upload.status === 'approved' ? 'bg-green-50 border-green-400' :
                          upload.status === 'rejected' ? 'bg-red-50 border-red-400' :
                          'bg-yellow-50 border-yellow-400'
                        }`}>
                          <h4 className={`font-medium ${statusInfo.color} mb-1`}>
                            {statusInfo.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {statusInfo.message}
                          </p>
                        </div>
                      </div>

                      {upload.public_url && (
                        <div className="ml-6">
                          <img 
                            src={upload.public_url} 
                            alt={upload.file_name}
                            className="w-24 h-24 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>

                    {upload.notes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Your Description</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {upload.notes}
                        </p>
                      </div>
                    )}

                    {upload.admin_notes && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Expert Feedback</span>
                        </div>
                        <p className="text-sm text-blue-800 mb-2">{upload.admin_notes}</p>
                        {upload.reviewed_at && (
                          <p className="text-xs text-blue-600">
                            Reviewed on {new Date(upload.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {upload.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm text-orange-800">
                          💡 <strong>Tip:</strong> You can upload a new photo addressing the feedback above.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadStatus;