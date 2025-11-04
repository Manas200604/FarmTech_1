import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    MessageCircle,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Calendar,
    Tag,
    MessageSquare,
    Upload,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../supabase/client';
import { mockStorageService } from '../services/mockStorage';
import toast from 'react-hot-toast';

const Support = () => {
    const { userProfile } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [showNewInquiry, setShowNewInquiry] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        cropType: '',
        description: '',
        urgency: 'medium',
        requiredDate: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);

    const categories = [
        'Pesticides & Chemicals',
        'Fertilizers & Nutrients',
        'Seeds & Planting',
        'Disease Diagnosis',
        'Pest Control',
        'Soil Management',
        'Irrigation & Water',
        'Harvesting & Storage',
        'Market Information',
        'General Inquiry'
    ];

    const cropTypes = [
        'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean',
        'Tomato', 'Potato', 'Onion', 'Cabbage', 'Carrot', 'Other'
    ];

    const urgencyLevels = [
        { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
        { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' }
    ];

    useEffect(() => {
        if (!userProfile?.id) return;

        const fetchInquiries = async () => {
            try {
                // Using uploads table as inquiries since we don't have a separate inquiries table
                const { data: inquiriesData, error } = await supabase
                    .from('uploads')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setInquiries(inquiriesData || []);
            } catch (error) {
                console.error('Error fetching inquiries:', error);
            }
        };

        fetchInquiries();

        // Set up real-time subscription
        const subscription = supabase
            .channel('support_inquiries')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'uploads',
                    filter: `user_id=eq.${userProfile.id}`
                }, 
                fetchInquiries
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userProfile?.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.requiredDate) {
            toast.error('Please specify when you need the materials');
            return;
        }

        try {
            let imageUrl = null;

            // Handle image upload if provided
            if (formData.image) {
                try {
                    // For development, use the preview image (base64) directly
                    // This ensures the image is always available
                    if (imagePreview) {
                        imageUrl = imagePreview;
                        console.log('Using image preview as URL for material request:', formData.image.name);
                    } else {
                        // Fallback: create base64 from file
                        const reader = new FileReader();
                        const base64Promise = new Promise((resolve) => {
                            reader.onload = (e) => resolve(e.target.result);
                            reader.readAsDataURL(formData.image);
                        });
                        imageUrl = await base64Promise;
                        console.log('Created base64 image for material request:', formData.image.name);
                    }
                } catch (uploadError) {
                    console.log('Image processing failed:', uploadError);
                    // Use a placeholder image as last resort
                    imageUrl = `https://via.placeholder.com/400x300/22c55e/ffffff?text=Material+Request+Image`;
                }
            }

            const inquiryData = {
                user_id: userProfile.id,
                file_name: formData.image ? formData.image.name : 'Material Request',
                file_path: `material_requests/${Date.now()}_${formData.subject.replace(/\s+/g, '_')}`,
                file_size: formData.image ? formData.image.size : 0,
                crop_type: formData.cropType || 'General',
                notes: `Subject: ${formData.subject.trim()}\nCategory: ${formData.category}\nRequired Date: ${formData.requiredDate}\nUrgency: ${formData.urgency}\n\nDescription: ${formData.description.trim()}`,
                public_url: imageUrl,
                status: 'pending',
                created_at: new Date().toISOString(),
                // Additional fields for material requests
                user_name: userProfile.name || userProfile.email?.split('@')[0] || 'Unknown User',
                user_email: userProfile.email || 'no-email@example.com',
                request_type: 'material_request',
                required_date: formData.requiredDate,
                category: formData.category,
                urgency: formData.urgency
            };

            // Try database first, fallback to localStorage
            try {
                const { error } = await supabase
                    .from('uploads')
                    .insert([inquiryData]);

                if (error) throw error;
            } catch (dbError) {
                console.log('Database insert failed, storing locally:', dbError.message);
                const localRequests = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
                const requestWithId = {
                    ...inquiryData,
                    id: Date.now()
                };
                localRequests.push(requestWithId);
                localStorage.setItem('farmtech_uploads', JSON.stringify(localRequests));
                console.log('Stored material request locally with image URL:', requestWithId.public_url ? 'Yes' : 'No');
            }

            toast.success('Your material request has been submitted successfully!');
            setFormData({
                subject: '',
                category: '',
                cropType: '',
                description: '',
                urgency: 'medium',
                requiredDate: '',
                image: null
            });
            setImagePreview(null);
            setShowNewInquiry(false);
        } catch (error) {
            console.error('Error submitting material request:', error);
            toast.error('Failed to submit request. Please try again.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'in_progress':
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'resolved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getUrgencyColor = (urgency) => {
        const level = urgencyLevels.find(l => l.value === urgency);
        return level ? level.color : 'text-gray-600 bg-gray-100';
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Agricultural Materials Center</h1>
                        <p className="text-primary-100 mt-1">
                            Get expert recommendations for pesticides, fertilizers, and agricultural materials
                        </p>
                    </div>
                    <MessageCircle className="h-16 w-16 text-primary-200" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Your Material Requests</h2>
                    <p className="text-gray-600">Track your material requests and get expert recommendations</p>
                </div>
                <Button onClick={() => setShowNewInquiry(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    New Request
                </Button>
            </div>

            {/* New Inquiry Form */}
            {showNewInquiry && (
                <Card>
                    <CardHeader>
                        <CardTitle>Submit New Material Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of your inquiry"
                                    required
                                />
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Crop Type (Optional)
                                    </label>
                                    <select
                                        name="cropType"
                                        value={formData.cropType}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Crop Type</option>
                                        {cropTypes.map(crop => (
                                            <option key={crop} value={crop}>{crop}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Urgency Level
                                    </label>
                                    <select
                                        name="urgency"
                                        value={formData.urgency}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {urgencyLevels.map(level => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Required Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="requiredDate"
                                        value={formData.requiredDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">When do you need these materials?</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Upload Image (Optional)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="material-image"
                                        />
                                        <label
                                            htmlFor="material-image"
                                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Choose Image
                                        </label>
                                        {formData.image && (
                                            <span className="text-sm text-gray-600">{formData.image.name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {imagePreview && (
                                <div className="relative">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Image Preview
                                    </label>
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Detailed Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Please provide detailed information about your inquiry, including current situation, symptoms, or specific requirements..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewInquiry(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Inquiries List */}
            <div className="space-y-4">
                {inquiries.map((inquiry) => (
                    <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{inquiry.subject}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                            {inquiry.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(inquiry.urgency)}`}>
                                            {inquiry.urgency.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center">
                                            <Tag className="h-4 w-4 mr-1" />
                                            <span>{inquiry.category || 'General'}</span>
                                        </div>
                                        {inquiry.crop_type && (
                                            <div className="flex items-center">
                                                <span>🌾 {inquiry.crop_type}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {inquiry.required_date && (
                                            <div className="flex items-center">
                                                <span className="text-orange-600">📅 Needed: {new Date(inquiry.required_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    {getStatusIcon(inquiry.status)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Your Request:</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.notes || inquiry.description}</p>
                                </div>

                                {inquiry.public_url && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Attached Image:</h4>
                                        <div className="relative inline-block">
                                            <img
                                                src={inquiry.public_url}
                                                alt="Material request image"
                                                className="w-48 h-48 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(inquiry.public_url, '_blank')}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div 
                                                className="w-48 h-48 bg-gray-100 rounded border flex items-center justify-center"
                                                style={{ display: 'none' }}
                                            >
                                                <div className="text-center">
                                                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                                    <p className="text-xs text-gray-500">Image not available</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {inquiry.admin_notes && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <User className="h-4 w-4 mr-2 text-primary-500" />
                                            Expert Response:
                                        </h4>
                                        <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
                                            <p className="text-gray-800">{inquiry.admin_notes}</p>
                                            {inquiry.reviewed_at && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Responded on: {new Date(inquiry.reviewed_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {inquiry.status === 'pending' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-yellow-800 text-sm">
                                            ⏳ Your material request is pending review. Our experts will respond within 24-48 hours.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {inquiries.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No material requests yet</h3>
                        <p className="text-gray-600 mb-4">
                            Submit your first request to get expert recommendations on agricultural materials
                        </p>
                        <Button onClick={() => setShowNewInquiry(true)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Submit Your First Request
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Support;