import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Award,
  Star
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const ExpertManager = () => {
  const [experts, setExperts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: [],
    cropTypes: [],
    region: '',
    contactInfo: {
      phone: '',
      email: '',
      address: ''
    },
    experience: '',
    qualifications: [],
    languages: [],
    availability: {
      days: [],
      hours: ''
    },
    rating: 0,
    isVerified: true
  });

  const specializationOptions = [
    'Crop Diseases', 'Soil Management', 'Pest Control', 'Irrigation',
    'Organic Farming', 'Livestock', 'Horticulture', 'Agronomy',
    'Plant Pathology', 'Entomology', 'Weed Management', 'Seed Technology'
  ];

  const cropOptions = [
    'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean',
    'Tomato', 'Potato', 'Onion', 'Cabbage', 'Carrot', 'Mango',
    'Banana', 'Grapes', 'Citrus', 'Coconut', 'Tea', 'Coffee'
  ];

  const regionOptions = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const { data: expertsData, error } = await supabase
          .from('contacts')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setExperts(expertsData || []);
      } catch (error) {
        console.error('Error fetching experts:', error);
      }
    };

    fetchExperts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('contacts_admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchExperts)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [contactField]: value
        }
      }));
    } else if (name.startsWith('availability.')) {
      const availField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [availField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (field, value) => {
    if (field === 'availability.days') {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          days: prev.availability.days?.includes(value)
            ? prev.availability.days.filter(item => item !== value)
            : [...(prev.availability.days || []), value]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter(item => item !== value)
          : [...prev[field], value]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const expertData = {
        name: formData.name,
        specialization: formData.specialization.join(', '),
        crop_type: formData.cropTypes.join(', '),
        region: formData.region,
        contact_info: `${formData.contactInfo.phone}, ${formData.contactInfo.email}`,
        created_at: editingExpert ? editingExpert.created_at : new Date().toISOString()
      };

      if (editingExpert) {
        const { error } = await supabase
          .from('contacts')
          .update(expertData)
          .eq('id', editingExpert.id);

        if (error) throw error;
        toast.success('Expert updated successfully!');
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([expertData]);

        if (error) throw error;
        toast.success('Expert added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving expert:', error);
      toast.error('Failed to save expert');
    }
  };

  const handleEdit = (expert) => {
    setEditingExpert(expert);
    setFormData(expert);
    setShowAddForm(true);
  };

  const handleDelete = async (expertId) => {
    if (window.confirm('Are you sure you want to delete this expert?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', expertId);

        if (error) throw error;
        toast.success('Expert deleted successfully!');
      } catch (error) {
        console.error('Error deleting expert:', error);
        toast.error('Failed to delete expert');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: [],
      cropTypes: [],
      region: '',
      contactInfo: { phone: '', email: '', address: '' },
      experience: '',
      qualifications: [],
      languages: [],
      availability: { days: [], hours: '' },
      rating: 0,
      isVerified: true
    });
    setEditingExpert(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agricultural Experts Management</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expert
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingExpert ? 'Edit Expert' : 'Add New Expert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Region</option>
                    {regionOptions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Experience (years)"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Rating (0-5)"
                  name="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={handleInputChange}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone"
                    name="contact.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Email"
                    name="contact.email"
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                  />
                </div>
                <Input
                  label="Address"
                  name="contact.address"
                  value={formData.contactInfo.address}
                  onChange={handleInputChange}
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Specializations (Select multiple)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specializationOptions.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleArrayChange('specialization', spec)}
                      className={`p-2 text-sm border rounded-md transition-colors ${
                        formData.specialization.includes(spec)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Types */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Crop Types (Select multiple)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cropOptions.map(crop => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => handleArrayChange('cropTypes', crop)}
                      className={`p-2 text-sm border rounded-md transition-colors ${
                        formData.cropTypes.includes(crop)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualifications and Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Qualifications (comma-separated)
                  </label>
                  <textarea
                    name="qualifications"
                    value={formData.qualifications.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      qualifications: e.target.value.split(',').map(q => q.trim()).filter(q => q)
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ph.D. in Agriculture, M.Sc. Plant Pathology, etc."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Languages (comma-separated)
                  </label>
                  <textarea
                    name="languages"
                    value={formData.languages.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Hindi, English, Regional languages, etc."
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Availability</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Available Days
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {dayOptions.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleArrayChange('availability.days', day)}
                          className={`p-2 text-xs border rounded-md transition-colors ${
                            formData.availability.days?.includes(day)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Available Hours"
                    name="availability.hours"
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                    value={formData.availability.hours}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingExpert ? 'Update Expert' : 'Add Expert'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Experts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experts.map(expert => (
          <Card key={expert.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{expert.name}</CardTitle>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">{expert.region}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(expert)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(expert.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{expert.experience} years experience</span>
                </div>
                
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-sm">{expert.rating}/5 rating</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Specializations:</p>
                  <div className="flex flex-wrap gap-1">
                    {expert.specialization?.slice(0, 2).map((spec, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                        {spec}
                      </span>
                    ))}
                    {expert.specialization?.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{expert.specialization.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{expert.contactInfo?.phone}</span>
                  </div>
                  {expert.contactInfo?.email && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{expert.contactInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {experts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No experts added yet</h3>
            <p className="text-gray-600 mb-4">
              Start by adding agricultural experts to help farmers
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Expert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpertManager;