import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import { supabase } from '../supabase/client';
import { supabaseStorage } from '../utils/supabaseStorage';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupabaseUploadManager = () => {
  const { currentUser, userProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadData, setUploadData] = useState({
    description: '',
    crop_type: ''
  });

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadData({ description: '', crop_type: '' });
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!uploadData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to upload files');
      return;
    }

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const uploadResult = await supabaseStorage.uploadFile(
        selectedFile, 
        currentUser.id || 'anonymous'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save upload record to database
      const uploadRecord = {
        user_id: currentUser.id,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        storage_path: uploadResult.data.storagePath,
        public_url: uploadResult.data.publicUrl,
        description: uploadData.description.trim(),
        crop_type: uploadData.crop_type.trim() || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data: dbResult, error: dbError } = await supabase
        .from('uploads')
        .insert([uploadRecord])
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabaseStorage.deleteFile(uploadResult.data.storagePath);
        throw dbError;
      }

      toast.success('File uploaded successfully!');
      console.log('Upload completed:', dbResult);

      // Clear form
      clearSelection();
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const cropTypes = [
    'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean', 
    'Potato', 'Tomato', 'Onion', 'Cabbage', 'Carrot', 'Other'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Crop Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearSelection}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Upload Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the crop condition, disease symptoms, or what you need help with..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    disabled={uploading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="crop_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type
                  </label>
                  <select
                    id="crop_type"
                    value={uploadData.crop_type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, crop_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={uploading}
                  >
                    <option value="">Select crop type (optional)</option>
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !uploadData.description.trim()}
                    className="flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-1">Upload Guidelines</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Upload clear images of your crops for better analysis</li>
                  <li>• Include detailed descriptions of any issues you're facing</li>
                  <li>• Images are stored securely and reviewed by agricultural experts</li>
                  <li>• You'll receive feedback and recommendations within 24-48 hours</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseUploadManager;