import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

const Schemes = () => {
  const { userProfile } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const categories = [
    'Subsidies', 'Loans', 'Insurance', 'Technology', 'Training', 'Marketing', 'Other'
  ];

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const { data: schemesData, error } = await supabase
          .from('schemes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSchemes(schemesData || []);
      } catch (error) {
        console.error('Error fetching schemes:', error);
      }
    };

    fetchSchemes();

    // Set up real-time subscription
    const subscription = supabase
      .channel('schemes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes' }, fetchSchemes)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || scheme.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Government Schemes</h1>
            <p className="text-primary-100 mt-1">
              Explore available schemes and subsidies for farmers
            </p>
          </div>
          <FileText className="h-16 w-16 text-primary-200" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            {userProfile?.role === 'admin' && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Scheme
              </Button>
            )}
          </div>
        </CardContent>
      </Card>  
    {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => (
          <Card key={scheme.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{scheme.title}</CardTitle>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full mt-2">
                    {scheme.category}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {scheme.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Added: {formatDate(scheme.created_at)}</span>
                </div>
                
                {scheme.benefits && scheme.benefits.length > 0 && (
                  <div className="flex items-start text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    <span>{scheme.benefits[0]}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedScheme(scheme);
                    setShowDetailModal(true);
                  }}
                  className="flex-1"
                >
                  View Details
                </Button>
                
                {scheme.governmentLink && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(scheme.governmentLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No schemes are currently available'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scheme Detail Modal */}
      {showDetailModal && selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedScheme(null);
          }}
        />
      )}
    </div>
  );
};

// Scheme Detail Modal Component
const SchemeDetailModal = ({ scheme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{scheme.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div> 
       <div className="p-6 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full mb-4">
              {scheme.category}
            </span>
            <p className="text-gray-700 leading-relaxed">{scheme.description}</p>
          </div>

          {scheme.eligibility && scheme.eligibility.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
              <ul className="space-y-2">
                {scheme.eligibility.map((criteria, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scheme.benefits && scheme.benefits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
              <ul className="space-y-2">
                {scheme.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scheme.documentsRequired && scheme.documentsRequired.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheme.documentsRequired.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">{doc.name}</span>
                      {doc.mandatory && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheme.applicationProcess && scheme.applicationProcess.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Process</h3>
              <ol className="space-y-3">
                {scheme.applicationProcess.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary-500 text-white text-sm font-medium rounded-full mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {scheme.contactInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {scheme.contactInfo.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{scheme.contactInfo.phone}</span>
                  </div>
                )}
                {scheme.contactInfo.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{scheme.contactInfo.email}</span>
                  </div>
                )}
                {scheme.contactInfo.office && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{scheme.contactInfo.office}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {scheme.governmentLink && (
              <Button onClick={() => window.open(scheme.governmentLink, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Online
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schemes;