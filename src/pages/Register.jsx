import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Leaf, Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    adminCode: '',
    farmDetails: {
      location: '',
      cropType: [],
      farmSize: '',
      soilType: '',
      customCropDescription: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const cropOptions = [
    'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean', 
    'Tomato', 'Potato', 'Onion', 'Cabbage', 'Carrot', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('farm.')) {
      const farmField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        farmDetails: {
          ...prev.farmDetails,
          [farmField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCropTypeChange = (crop) => {
    setFormData(prev => ({
      ...prev,
      farmDetails: {
        ...prev.farmDetails,
        cropType: prev.farmDetails.cropType.includes(crop)
          ? prev.farmDetails.cropType.filter(c => c !== crop)
          : [...prev.farmDetails.cropType, crop]
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'admin' && formData.adminCode !== import.meta.env.VITE_ADMIN_SECRET_CODE) {
      newErrors.adminCode = 'Invalid admin code';
    }
    
    if (formData.role === 'farmer') {
      if (!formData.farmDetails.location.trim()) {
        newErrors.location = 'Farm location is required';
      }
      if (formData.farmDetails.cropType.length === 0) {
        newErrors.cropType = 'Please select at least one crop type';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'farmer' && { farmDetails: formData.farmDetails })
      };
      
      await register(formData.email, formData.password, userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Leaf className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join FarmTech
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'farmer' }))}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.role === 'farmer'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Farmer</div>
                    <div className="text-sm text-gray-500">Upload crops, get advice</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.role === 'admin'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Admin</div>
                    <div className="text-sm text-gray-500">Manage content</div>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={errors.name}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  placeholder="Enter your email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={errors.confirmPassword}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Code */}
              {formData.role === 'admin' && (
                <div>
                  <Input
                    label="Admin Code"
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleInputChange}
                    error={errors.adminCode}
                    placeholder="Enter admin access code"
                  />
                </div>
              )}

              {/* Farm Details for Farmers */}
              {formData.role === 'farmer' && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Farm Details</h3>
                  
                  <div className="relative">
                    <Input
                      label="Farm Location"
                      name="farm.location"
                      value={formData.farmDetails.location}
                      onChange={handleInputChange}
                      error={errors.location}
                      placeholder="Enter your farm location"
                      className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Crop Types (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cropOptions.map((crop) => (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => handleCropTypeChange(crop)}
                          className={`p-2 text-sm border rounded-md transition-colors ${
                            formData.farmDetails.cropType.includes(crop)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                    {errors.cropType && (
                      <p className="text-sm text-red-600 mt-1">{errors.cropType}</p>
                    )}
                  </div>

                  {/* Custom Crop Description - Show only if "Other" is selected */}
                  {formData.farmDetails.cropType.includes('Other') && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Describe your other crops
                      </label>
                      <textarea
                        name="farm.customCropDescription"
                        value={formData.farmDetails.customCropDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Please describe the other crops you grow..."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Farm Size (acres)"
                      name="farm.farmSize"
                      type="number"
                      value={formData.farmDetails.farmSize}
                      onChange={handleInputChange}
                      placeholder="Enter farm size"
                    />

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Soil Type
                      </label>
                      <select
                        name="farm.soilType"
                        value={formData.farmDetails.soilType}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select soil type</option>
                        <option value="clay">Clay</option>
                        <option value="sandy">Sandy</option>
                        <option value="loamy">Loamy</option>
                        <option value="silty">Silty</option>
                        <option value="peaty">Peaty</option>
                        <option value="chalky">Chalky</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Sign In Instead
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;