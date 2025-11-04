import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAuthContext';
import { supabase } from '../../supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const UploadManager = () => {
  const { userProfile } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    admin_notes: ''
  });

  // Load uploads from localStorage and Supabase
  const loadUploads = async () => {
    try {
      setLoading(true);
      console.log('Admin loading all uploads...');
      
      // Try to load from Supabase first
      const { data: supabaseUploads, error } = await supabase
        .from('uploads')
        .select(`
          *,
          users!uploads_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      let allUploads = [];

      if (error) {
        console.log('Supabase error, loading from localStorage fallback:', error.message);
      } else {
        allUploads = supabaseUploads || [];
        console.log('Loaded from Supabase:', allUploads.length, 'uploads');
      }

      // Also load from localStorage (for development mode uploads)
      const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
      console.log('Total local uploads found:', localUploads.length);
      
      // Merge and deduplicate uploads
      const mergedUploads = [...allUploads];
      
      localUploads.forEach(localUpload => {
        // Add local uploads that aren't already in Supabase
        if (!allUploads.find(u => u.file_path === localUpload.file_path)) {
          console.log('Adding local upload:', localUpload.file_name, 'URL:', localUpload.public_url);
          mergedUploads.push({
            ...localUpload,
            users: { 
              name: localUpload.user_name || 'Local User', 
              email: localUpload.user_email || 'unknown@user.com' 
            },
            source: 'local'
          });
        }
      });

      console.log('Final uploads for admin:', mergedUploads.length);
      setUploads(mergedUploads);
    } catch (error) {
      console.error('Error loading uploads:', error);
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadUploads();
    }
  }, [userProfile]);

  const handleReview = (upload) => {
    setSelectedUpload(upload);
    setReviewData({
      status: upload.status || 'pending',
      admin_notes: upload.admin_notes || ''
    });
    setReviewModal(true);
  };

  const handleDelete = async (upload) => {
    if (!window.confirm(`Are you sure you want to delete "${upload.file_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Try to delete from Supabase
      if (upload.source !== 'local' && upload.id) {
        const { error } = await supabase
          .from('uploads')
          .delete()
          .eq('id', upload.id);

        if (error) {
          console.log('Supabase delete failed, removing locally...');
        }
      }

      // Remove from localStorage for local uploads or as fallback
      const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
      const updatedLocalUploads = localUploads.filter(localUpload => 
        localUpload.file_path !== upload.file_path
      );
      localStorage.setItem('farmtech_uploads', JSON.stringify(updatedLocalUploads));

      // Update local state
      setUploads(prev => prev.filter(u => 
        u.id !== upload.id && u.file_path !== upload.file_path
      ));

      toast.success('Upload deleted successfully!');

    } catch (error) {
      console.error('Error deleting upload:', error);
      toast.error('Failed to delete upload');
    }
  };

  const submitReview = async () => {
    if (!selectedUpload || !reviewData.status) {
      toast.error('Please select a status');
      return;
    }

    if (!reviewData.admin_notes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    try {
      const updateData = {
        status: reviewData.status,
        admin_notes: reviewData.admin_notes.trim(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: userProfile.id
      };

      // Try to update in Supabase
      if (selectedUpload.source !== 'local') {
        const { error } = await supabase
          .from('uploads')
          .update(updateData)
          .eq('id', selectedUpload.id);

        if (error) {
          console.log('Supabase update failed, updating locally...');
        }
      }

      // Update in localStorage for local uploads or as fallback
      const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
      const updatedLocalUploads = localUploads.map(upload => {
        if (upload.file_path === selectedUpload.file_path) {
          return { ...upload, ...updateData };
        }
        return upload;
      });
      localStorage.setItem('farmtech_uploads', JSON.stringify(updatedLocalUploads));

      // Update local state
      setUploads(prev => prev.map(upload => {
        if (upload.id === selectedUpload.id || upload.file_path === selectedUpload.file_path) {
          return { ...upload, ...updateData };
        }
        return upload;
      }));

      toast.success(`Upload ${reviewData.status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setReviewModal(false);
      setSelectedUpload(null);
      setReviewData({ status: '', admin_notes: '' });

    } catch (error) {
      console.error('Error updating upload:', error);
      toast.error('Failed to update upload status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: Check },
      rejected: { color: 'bg-red-100 text-red-800', icon: X }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status || 'pending'}
      </Badge>
    );
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Upload Management</h2>
        <Button onClick={loadUploads} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading uploads...</p>
        </div>
      ) : uploads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No uploads found</p>
            <p className="text-sm text-gray-400 mt-2">
              Farmer uploads will appear here for review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {uploads.map((upload) => (
            <Card key={upload.id || upload.file_path} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{upload.users?.name || 'Unknown User'}</span>
                        <span className="text-gray-400">•</span>
                        <span>{upload.users?.email || 'No email'}</span>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{upload.file_name}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Crop Type:</strong> {upload.crop_type || 'Not specified'}</p>
                          <p><strong>File Size:</strong> {upload.file_size ? `${(upload.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {upload.notes || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      {upload.public_url ? (
                        <img 
                          src={upload.public_url} 
                          alt={upload.file_name}
                          className="w-32 h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-32 h-32 bg-gray-100 rounded border flex items-center justify-center"
                        style={{ display: upload.public_url ? 'none' : 'flex' }}
                      >
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Image Preview</p>
                        </div>
                      </div>
                    </div>

                    {upload.admin_notes && (
                      <div className="bg-blue-50 p-3 rounded mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Admin Review</span>
                        </div>
                        <p className="text-sm text-blue-800">{upload.admin_notes}</p>
                        {upload.reviewed_at && (
                          <p className="text-xs text-blue-600 mt-1">
                            Reviewed on {new Date(upload.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleReview(upload)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                    <Button
                      onClick={() => handleDelete(upload)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Review Upload</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedUpload.file_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Image
                </label>
                {selectedUpload.public_url ? (
                  <img 
                    src={selectedUpload.public_url} 
                    alt={selectedUpload.file_name}
                    className="w-full max-w-md h-64 object-cover rounded border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full max-w-md h-64 bg-gray-100 rounded border flex items-center justify-center"
                  style={{ display: selectedUpload.public_url ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Image not available</p>
                    <p className="text-sm text-gray-400">File: {selectedUpload.file_name}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Status *
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="approved"
                      checked={reviewData.status === 'approved'}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-green-700">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={reviewData.status === 'rejected'}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-red-700">Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes *
                </label>
                <textarea
                  value={reviewData.admin_notes}
                  onChange={(e) => setReviewData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Provide feedback for the farmer..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                onClick={() => setReviewModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                className={reviewData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {reviewData.status === 'approved' ? 'Approve Upload' : 'Reject Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadManager;