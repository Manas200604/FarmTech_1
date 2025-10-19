import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
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
    MessageSquare
} from 'lucide-react';
import { supabase } from '../supabase/client';
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
        urgency: 'medium'
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const inquiryData = {
                user_id: userProfile.id,
                description: `${formData.subject.trim()} - ${formData.description.trim()}`,
                crop_type: formData.cropType || 'General',
                status: 'pending',
                created_at: new Date().toISOString(),
                image_url: null // Support requests don't have images
            };

            const { error } = await supabase
                .from('uploads')
                .insert([inquiryData]);

            if (error) throw error;

            toast.success('Your inquiry has been submitted successfully!');
            setFormData({
                subject: '',
                category: '',
                cropType: '',
                description: '',
                urgency: 'medium'
            });
            setShowNewInquiry(false);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            toast.error('Failed to submit inquiry. Please try again.');
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
                                            <span>{inquiry.category}</span>
                                        </div>
                                        {inquiry.cropType && (
                                            <div className="flex items-center">
                                                <span>🌾 {inquiry.cropType}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span>{formatDate(inquiry.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    {getStatusIcon(inquiry.status)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Your Question:</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.description}</p>
                                </div>

                                {inquiry.adminResponse && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <User className="h-4 w-4 mr-2 text-primary-500" />
                                            Expert Response:
                                        </h4>
                                        <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
                                            <p className="text-gray-800">{inquiry.adminResponse}</p>
                                            {inquiry.respondedAt && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Responded on: {formatDate(inquiry.respondedAt)}
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