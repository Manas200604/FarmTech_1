import { useState } from 'react';
import { toast } from 'react-hot-toast';
import paymentStorage from '../../utils/paymentStorage';
import RobustImage from '../RobustImage';
import {
    Upload,
    User,
    Phone,
    CreditCard,
    Image as ImageIcon,
    ArrowLeft,
    CheckCircle,
    X,
    AlertCircle
} from 'lucide-react';

const PaymentVerificationForm = ({ orderDetails, totalAmount, onBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        transactionId: '',
        paymentScreenshot: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
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

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target.result;
                setFormData(prev => ({
                    ...prev,
                    paymentScreenshot: base64String
                }));
                setPreviewImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.fullName.trim()) {
            toast.error('Please enter your full name');
            document.querySelector('input[name="fullName"]').focus();
            return;
        }
        if (!formData.phoneNumber.trim()) {
            toast.error('Please enter your phone number');
            document.querySelector('input[name="phoneNumber"]').focus();
            return;
        }
        if (!formData.transactionId.trim()) {
            toast.error('Please enter the transaction ID');
            document.querySelector('input[name="transactionId"]').focus();
            return;
        }
        if (!formData.paymentScreenshot) {
            toast.error('Payment screenshot is mandatory! Please upload your payment screenshot to proceed.');
            document.getElementById('payment-screenshot-input').click();
            return;
        }

        setIsSubmitting(true);

        try {
            // Save payment submission
            const submission = paymentStorage.addSubmission({
                fullName: formData.fullName.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                transactionId: formData.transactionId.trim(),
                paymentScreenshot: formData.paymentScreenshot,
                orderDetails,
                totalAmount
            });

            toast.success('Payment verification submitted successfully!');
            onSuccess(submission);
        } catch (error) {
            console.error('Error submitting payment verification:', error);
            toast.error('Failed to submit payment verification. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
                        <p className="text-gray-600">Submit payment details for verification</p>
                    </div>
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Items ({orderDetails.length}):</span>
                        <span>{orderDetails.map(item => `${item.name} (${item.quantity})`).join(', ')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span className="text-primary-600">₹{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* QR Code Scanner Image */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center mb-3">
                    <RobustImage 
                        src="/images/Scanner.png" 
                        alt="QR Code Scanner"
                        className="w-full h-full object-contain rounded-lg"
                        fallbackClassName="w-full h-full flex flex-col items-center justify-center text-center"
                        onError={() => console.log('Scanner image failed, showing fallback')}
                    />
                </div>
                <p className="text-sm text-blue-700">
                    Scan the QR code above to make payment, then fill the form below
                </p>
            </div>

            {/* Payment Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-2" />
                        Full Name *
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>

                {/* Phone Number */}
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
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>

                {/* Transaction ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="h-4 w-4 inline mr-2" />
                        Transaction ID *
                    </label>
                    <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleInputChange}
                        placeholder="Enter transaction ID from payment app"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>

                {/* Payment Screenshot Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="h-4 w-4 inline mr-2" />
                        Screenshot of Paid Amount
                        <span className="text-red-600 font-bold ml-1">* MANDATORY</span>
                    </label>
                    <div className="relative">
                        <div
                            className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer bg-red-50 hover:bg-primary-50 min-h-[200px] flex flex-col justify-center"
                            onClick={() => document.getElementById('payment-screenshot-input').click()}
                        >
                            {previewImage ? (
                                <div className="space-y-4">
                                    <img
                                        src={previewImage}
                                        alt="Payment screenshot preview"
                                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
                                    />
                                    <p className="text-sm text-green-600 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Screenshot uploaded successfully
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage(null);
                                            setFormData(prev => ({ ...prev, paymentScreenshot: null }));
                                            document.getElementById('payment-screenshot-input').value = '';
                                        }}
                                        className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove image
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Upload className="h-20 w-20 text-red-400 mx-auto" />
                                    <div>
                                        <p className="text-xl text-red-700 font-bold mb-2">📸 UPLOAD PAYMENT SCREENSHOT</p>
                                        <p className="text-lg text-gray-700 font-medium mb-2">Click anywhere in this area to select image</p>
                                        <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 5MB</p>
                                        <div className="inline-flex items-center px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold text-lg">
                                            <Upload className="h-6 w-6 mr-2" />
                                            SELECT IMAGE FILE
                                        </div>
                                    </div>
                                    <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                                        <p className="text-sm text-red-800 font-bold flex items-center justify-center">
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            ⚠️ MANDATORY: You must upload payment screenshot to continue
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            id="payment-screenshot-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            required
                        />
                    </div>
                    {!previewImage && (
                        <p className="text-xs text-red-600 mt-2 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Please upload your payment screenshot to continue
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.paymentScreenshot}
                        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${isSubmitting || !formData.paymentScreenshot
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 hover:bg-primary-600'
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Submitting...</span>
                            </div>
                        ) : !formData.paymentScreenshot ? (
                            <div className="flex items-center justify-center space-x-2">
                                <Upload className="h-5 w-5" />
                                <span>Upload Payment Screenshot First</span>
                            </div>
                        ) : (
                            'Submit Payment Verification'
                        )}
                    </button>
                    {!formData.paymentScreenshot && (
                        <p className="text-center text-sm text-red-600 mt-2 font-medium">
                            ⚠️ Please upload your payment screenshot to enable submission
                        </p>
                    )}
                </div>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After submitting, your payment will be verified by our admin team.
                    You will be notified once the verification is complete. Please keep your transaction details safe.
                </p>
            </div>
        </div>
    );
};

export default PaymentVerificationForm;