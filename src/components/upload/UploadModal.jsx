import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/FastAuthContext';
import { Button } from '../ui/Button';
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { supabaseStorage } from '../../utils/supabaseStorage';
import toast from 'react-hot-toast';

const UploadModal = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    cropType: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Image compression function
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const cropTypes = [
    'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean',
    'Tomato', 'Potato', 'Onion', 'Cabbage', 'Carrot', 'Other'
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }
    
    if (!formData.cropType) {
      toast.error('Please select a crop type');
      return;
    }
    
    setUploading(true);
    
    try {
      // Validate user profile
      if (!userProfile?.id) {
        throw new Error('User profile not found. Please log in again.');
      }
      
      // Compress image if it's too large
      let fileToUpload = selectedFile;
      if (selectedFile.size > 2 * 1024 * 1024) { // If larger than 2MB
        fileToUpload = await compressImage(selectedFile);
      }
      
      setUploadProgress(30);
      console.log('📤 Uploading to Supabase Storage...');
      
      // Upload to Supabase Storage
      const uploadResult = await supabaseStorage.uploadFile(fileToUpload, userProfile.id);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      setUploadProgress(70);
      console.log('✅ Supabase Storage upload successful:', uploadResult.data.path);
      
      // Save upload record to database
      const uploadRecord = {
        user_id: userProfile.id,
        file_name: fileToUpload.name,
        file_size: fileToUpload.size,
        file_type: fileToUpload.type,
        storage_path: uploadResult.data.storagePath,
        public_url: uploadResult.data.publicUrl,
        description: formData.description.trim(),
        crop_type: formData.cropType,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      setUploadProgress(90);
      
      // Insert into database
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
      
      setUploadProgress(100);
      
      toast.success('Image uploaded successfully!', {
        duration: 4000,
        icon: '✅'
      });
      
      console.log('✅ Upload completed:', dbResult);
      onClose();
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      setFormData({
        description: '',
        cropType: ''
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Provide specific error messages
      if (error.message?.includes('storage')) {
        toast.error('Upload failed: Storage error. Please try again.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('unauthorized')) {
        toast.error('Upload failed: Please check your permissions and try again.');
      } else {
        toast.error(`Failed to upload image: ${error.message}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Crop Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Image
            </label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your image here, or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Supports: JPG, PNG, GIF (Max 10MB)
                </p>
                <Button type="button" variant="outline" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span>{selectedFile.name}</span>
                  <span className="ml-2">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Type
            </label>
            <select
              name="cropType"
              value={formData.cropType}
              onChange={handleInputChange}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select crop type</option>
              {cropTypes.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe the issue or what you'd like advice on..."
              required
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={uploading}
              disabled={!selectedFile || uploading}
            >
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Photo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;