import { useState } from 'react';
import { toast } from 'react-hot-toast';
import cropFormsStorage from '../../utils/cropFormsStorage';
import { useAuth } from '../../contexts/FastAuthContext';
import { 
  Upload, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  Crop,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';

const CropFormSubmission = ({ onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    farmerName: userProfile?.name || '',
    phoneNumber: userProfile?.phone || '',
    location: '',
    cropType: '',
    landSize: '',
    expectedYield: '',
    plantingDate: '',
    harvestDate: '',
    description: '',
    requirements: '',
    cropImages: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + previewImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        setPreviewImages(prev => [...prev, base64String]);
        setFormData(prev => ({
          ...prev,
          cropImages: [...prev.cropImages, base64String]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      cropImages: prev.cropImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.farmerName.trim()) {
      toast.error('Please enter farmer name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    if (!formData.location.trim()) {
      toast.error('Please enter location');
      return;
    }
    if (!formData.cropType.trim()) {
      toast.error('Please select crop type');
      return;
    }
    if (!formData.landSize.trim()) {
      toast.error('Please enter land size');
      return;
    }

    setIsSubmitting(true);

    try {
      const submission = cropFormsStorage.addCropForm({
        ...formData,
        farmerId: userProfile?.id || 'anonymous'
      });

      toast.success('Crop form submitted successfully!');
      onSuccess(submission);
    } catch (error) {
      console.error('Error submitting crop form:', error);
      toast.error('Failed to submit crop form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crop Information Form</h2>
          <p className="text-gray-600">Submit your crop details for admin review</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farmer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Farmer Name *
            </label>
            <input
              type="text"
              name="farmerName"
              value={formData.farmerName}
              onChange={handleInputChange}
              placeholder="Enter farmer name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-2" />
            Farm Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter farm location (Village, District, State)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        {/* Crop Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Crop className="h-4 w-4 inline mr-2" />
              Crop Type *
            </label>
            <select
              name="cropType"
              value={formData.cropType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select Crop Type</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="corn">Corn</option>
              <option value="sugarcane">Sugarcane</option>
              <option value="cotton">Cotton</option>
              <option value="soybean">Soybean</option>
              <option value="tomato">Tomato</option>
              <option value="potato">Potato</option>
              <option value="onion">Onion</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land Size (Acres) *
            </label>
            <input
              type="number"
              name="landSize"
              value={formData.landSize}
              onChange={handleInputChange}
              placeholder="Enter land size"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Yield (Tons)
            </label>
            <input
              type="number"
              name="expectedYield"
              value={formData.expectedYield}
              onChange={handleInputChange}
              placeholder="Expected yield"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Planting Date
            </label>
            <input
              type="date"
              name="plantingDate"
              value={formData.plantingDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Expected Harvest Date
            </label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-2" />
            Crop Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your crop, current condition, any issues..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requirements/Support Needed
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            placeholder="What kind of support or materials do you need?"
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Crop Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ImageIcon className="h-4 w-4 inline mr-2" />
            Crop Images (Optional - Max 5 images)
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="crop-images-input"
            />
            <label
              htmlFor="crop-images-input"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Click to upload crop images</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB each (Max 5 images)</p>
            </label>
          </div>

          {/* Image Previews */}
          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              {previewImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Crop ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Crop Form'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your crop information will be reviewed by our agricultural experts. 
          You will be contacted for further assistance based on your requirements.
        </p>
      </div>
    </div>
  );
};

export default CropFormSubmission;