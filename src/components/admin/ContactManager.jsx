import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    Phone,
    Mail,
    MapPin,
    Users,
    Search
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const ContactManager = () => {
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        crop_type: '',
        contact_info: '',
        region: ''
    });
    const [loading, setLoading] = useState(false);

    const specializations = [
        'Crop Diseases', 'Soil Management', 'Pest Control', 'Organic Farming',
        'Rice Cultivation', 'Horticulture', 'Irrigation Management', 'Crop Nutrition',
        'Plant Breeding', 'Post-Harvest Technology', 'Livestock Management',
        'Aquaculture', 'Agro-meteorology', 'Seed Technology', 'Farm Mechanization'
    ];

    const regions = ['North', 'South', 'East', 'West', 'Central'];

    const cropTypes = [
        'Rice', 'Wheat', 'Corn', 'Tomato', 'Cotton', 'Sugarcane', 'Fruits',
        'Vegetables', 'Grains', 'Fodder Crops', 'Fish Farming', 'Pulses', 'All Crops'
    ];

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setContacts(data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toast.error('Failed to fetch contacts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingContact) {
                const { error } = await supabase
                    .from('contacts')
                    .update(formData)
                    .eq('id', editingContact.id);

                if (error) throw error;
                toast.success('Contact updated successfully!');
            } else {
                const { error } = await supabase
                    .from('contacts')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Contact created successfully!');
            }

            setShowModal(false);
            setEditingContact(null);
            resetForm();
            fetchContacts();
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.error('Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            specialization: contact.specialization,
            crop_type: contact.crop_type,
            contact_info: contact.contact_info,
            region: contact.region
        });
        setShowModal(true);
    };

    const handleDelete = async (contactId) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contactId);

            if (error) throw error;
            toast.success('Contact deleted successfully!');
            fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Failed to delete contact');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            specialization: '',
            crop_type: '',
            contact_info: '',
            region: ''
        });
    };

    const parseContactInfo = (contactInfo) => {
        if (!contactInfo) return { phone: '', email: '' };

        const parts = contactInfo.split(',').map(part => part.trim());
        const phone = parts.find(part => part.startsWith('+') || /^\d/.test(part)) || '';
        const email = parts.find(part => part.includes('@')) || '';

        return { phone, email };
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.crop_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Contact Management</h2>
                    <p className="text-gray-600">Manage agricultural expert contacts</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Contact
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts.map((contact) => {
                    const contactDetails = parseContactInfo(contact.contact_info);

                    return (
                        <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                                        <div className="flex items-center mt-2">
                                            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                                                {contact.specialization}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDelete(contact.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{contact.region} Region</span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>Specializes in {contact.crop_type}</span>
                                    </div>

                                    <div className="pt-3 border-t space-y-2">
                                        {contactDetails.phone && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span>{contactDetails.phone}</span>
                                                </div>
                                            </div>
                                        )}

                                        {contactDetails.email && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span className="truncate">{contactDetails.email}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 pt-2 border-t">
                                        Expert Contact
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredContacts.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No contacts available'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingContact ? 'Edit Contact' : 'Add New Contact'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingContact(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <Input
                                label="Expert Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Dr. John Smith"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specialization
                                </label>
                                <select
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select specialization</option>
                                    {specializations.map((spec) => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Crop Type
                                </label>
                                <select
                                    value={formData.crop_type}
                                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select crop type</option>
                                    {cropTypes.map((crop) => (
                                        <option key={crop} value={crop}>{crop}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Region
                                </label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select region</option>
                                    {regions.map((region) => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Information
                                </label>
                                <Input
                                    value={formData.contact_info}
                                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                                    required
                                    placeholder="+91-9876543210, expert@email.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Format: phone, email (separated by comma)
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingContact(null);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" loading={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingContact ? 'Update Contact' : 'Create Contact'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactManager;