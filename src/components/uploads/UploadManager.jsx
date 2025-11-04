import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import uploadsStorage from '../../utils/uploadsStorage';
import { useAuth } from '../../contexts/FastAuthContext';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Grid,
  List,
  Eye,
  X,
  Plus,
  Calendar,
  User,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const UploadManager = ({ onClose }) => {
  const { userProfile } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUploads, setSelectedUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [statistics, setStatistics] = useState({});

  // Upload form state
  const [uploadData, setUploadData] = useState({
    file: null,
    fileName: '',
    category: 'general',
    description: '',
    tags: '',
    isPublic: false
  });

  useEffect(() => {
    loadUploads();
  }, []);

  useEffect(() => {
    filterUploads();
  }, [uploads, searchQuery, selectedCategory]);

  const loadUploads = () => {
    try {
      setLoading(true);
      const userUploads = uploadsStorage.getUploadsByUser(userProfile?.id || 'anonymous');
      const stats = uploadsStorage.getStatistics(userProfile?.id || 'anonymous');
      setUploads(userUploads);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading uploads:', error);
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const filterUploads = () => {
    let filtered = [...uploads];

    // Search filter
    if (searchQuery.trim()) {
      filtered = uploadsStorage.searchUploads(searchQuery, userProfile?.id || 'anonymous');
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(upload => upload.category === selectedCategory);
    }

    setFilteredUploads(filtered);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadData(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        fileData: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      const upload = uploadsStorage.addUpload({
        fileName: uploadData.fileName || uploadData.file.name,
        fileType: uploadData.file.type,
        fileSize: uploadData.file.size,
        fileData: uploadData.fileData,
        uploadedBy: userProfile?.id || 'anonymous',
        uploaderName: userProfile?.name || 'Anonymous User',
        uploaderRole: userProfile?.role || 'farmer',
        category: uploadData.category,
        description: uploadData.description,
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublic: uploadData.isPublic
      });

      toast.success('File uploaded successfully!');
      setShowUploadForm(false);
      setUploadData({
        file: null,
        fileName: '',
        category: 'general',
        description: '',
        tags: '',
        isPublic: false
      });
      loadUploads();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDeleteUpload = (uploadId) => {
    if (window.confirm('Are you sure you want to delete this upload?')) {
      try {
        uploadsStorage.deleteUpload(uploadId, userProfile?.id || 'anonymous');
        toast.success('Upload deleted successfully');
        loadUploads();
      } catch (error) {
        console.error('Error deleting upload:', error);
        toast.error('Failed to delete upload');
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedUploads.length === 0) {
      toast.error('Please select uploads to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedUploads.length} uploads?`)) {
      try {
        uploadsStorage.bulkDeleteUploads(selectedUploads, userProfile?.id || 'anonymous');
        toast.success(`${selectedUploads.length} uploads deleted successfully`);
        setSelectedUploads([]);
        loadUploads();
      } catch (error) {
        console.error('Error deleting uploads:', error);
        toast.error('Failed to delete uploads');
      }
    }
  };

  const handleDownload = (upload) => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = upload.fileData;
      link.download = upload.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment download count
      uploadsStorage.incrementDownloadCount(upload.id);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleSelectUpload = (uploadId) => {
    setSelectedUploads(prev => 
      prev.includes(uploadId) 
        ? prev.filter(id => id !== uploadId)
        : [...prev, uploadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUploads.length === filteredUploads.length) {
      setSelectedUploads([]);
    } else {
      setSelectedUploads(filteredUploads.map(upload => upload.id));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    return File;
  };

  const categories = ['general', 'crop', 'payment', 'document'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2">Loading uploads...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Uploads</h2>
          <p className="text-gray-600">Manage your uploaded files and documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            <span>Upload File</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-xl font-bold">{statistics.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
     