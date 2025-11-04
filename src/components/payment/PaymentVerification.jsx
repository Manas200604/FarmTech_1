import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import { orderStorage } from '../../utils/orderStorage';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  CreditCard, 
  User, 
  Hash, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  X
} from 'lucide-react';

const PaymentVerification = ({ orderId, orderData, onSubmissionComplete, onCancel }) => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    transactionId: '',
    farmerName: userProfile?.name || '',
    paymentScreenshot: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        paymentScreenshot: file
      }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      paymentScreenshot: null
    }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.transactionId.trim()) {
      errors.push(t('transactionId') + ' is required');
    }

    if (!formData.farmerName.trim()) {
      errors.push(t('customerName') + ' is required');
    }

    if (!formData.paymentScreenshot) {
      errors.push(t('paymentScreenshot') + ' is required');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSubmitting(true);

    try {
      // Convert file to base64 for storage (in a real app, you'd upload to a server)
      const screenshotUrl = await fileToBase64(formData.paymentScreenshot);

      const paymentDetails = {
        transactionId: formData.transactionId.trim(),
        farmerName: formData.farmerName.trim(),
        screenshotUrl: screenshotUrl,
        submittedAt: new Date().toISOString()
      };

      // Submit payment verification
      await orderStorage.submitPayment(orderId, paymentDetails);

      setSubmitted(true);
      toast.success(t('paymentDetailsSubmitted') || 'Payment details submitted successfully');
      
      // Call completion callback after a delay
      setTimeout(() => {
        onSubmissionComplete && onSubmissionComplete();
      }, 2000);

    } catch (error) {
      console.error('Error submitting payment verification:', error);
      toast.error('Failed to submit payment details');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('paymentDetailsSubmitted') || 'Payment Details Submitted'}
          </h2>
          <p className="text-gray-600 mb-4">
            Your payment verification details have been submitted successfully. 
            Our team will review and verify your payment within 24 hours.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Transaction ID:</strong> {formData.transactionId}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {t('pendingVerification')}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-primary-600" />
              <span>{t('paymentVerification')}</span>
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-primary-600">₹{orderData?.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>UPI ID:</span>
                <span className="font-mono">manas28prabhu@okaxis</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">{t('paymentInstructions')}</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Complete payment using the UPI ID: <strong>manas28prabhu@okaxis</strong></li>
                  <li>2. Take a screenshot of the successful payment</li>
                  <li>3. Fill in the transaction details below</li>
                  <li>4. Upload the payment screenshot</li>
                  <li>5. Submit for manual verification</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Payment Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                {t('transactionId')} *
              </label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter UPI transaction ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Usually starts with numbers like 123456789012
              </p>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline h-4 w-4 mr-1" />
                {t('customerName')} *
              </label>
              <input
                type="text"
                value={formData.farmerName}
                onChange={(e) => handleInputChange('farmerName', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Payment Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileImage className="inline h-4 w-4 mr-1" />
                {t('paymentScreenshot')} *
              </label>
              
              {!formData.paymentScreenshot ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Click to upload payment screenshot
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Payment screenshot preview"
                      className="w-full max-w-sm mx-auto rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {formData.paymentScreenshot.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.paymentScreenshot.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="space-y-1">
                    <li>• Ensure the screenshot clearly shows the transaction details</li>
                    <li>• Transaction ID must match exactly with the screenshot</li>
                    <li>• Payment amount should match the order total</li>
                    <li>• Verification may take up to 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-2 flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('submit')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;