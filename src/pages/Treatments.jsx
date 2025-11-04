import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Beaker, 
  Search, 
  Filter, 
  Leaf,
  DollarSign,
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import { supabase } from '../supabase/client';

const Treatments = () => {
  const { t } = useLanguage();
  const [treatments, setTreatments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('all');
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const cropTypes = ['Rice', 'Wheat', 'Tomato', 'Potato', 'Cotton', 'Corn', 'Sugarcane'];

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        // Try treatments table first, then pesticides
        let { data: treatmentsData, error } = await supabase
          .from('treatments')
          .select('*')
          .order('name', { ascending: true });

        if (error && error.code === 'PGRST205') {
          // Try pesticides table if treatments doesn't exist
          const { data: pesticidesData, error: pesticidesError } = await supabase
            .from('pesticides')
            .select('*')
            .order('name', { ascending: true });
          
          if (pesticidesError) throw pesticidesError;
          treatmentsData = pesticidesData;
        } else if (error) {
          throw error;
        }

        setTreatments(treatmentsData || []);
      } catch (error) {
        console.error('Error fetching treatments:', error);
      }
    };

    fetchTreatments();

    // Set up real-time subscription for both possible table names
    const treatmentsSubscription = supabase
      .channel('treatments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatments' }, fetchTreatments)
      .subscribe();

    const pesticidesSubscription = supabase
      .channel('pesticides_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesticides' }, fetchTreatments)
      .subscribe();

    return () => {
      treatmentsSubscription.unsubscribe();
      pesticidesSubscription.unsubscribe();
    };
  }, []);

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = cropFilter === 'all' || treatment.crop_type === cropFilter;
    return matchesSearch && matchesCrop;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTreatmentType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('npk') || lowerName.includes('fertilizer')) return 'Fertilizer';
    if (lowerName.includes('oil') || lowerName.includes('neem')) return 'Organic';
    if (lowerName.includes('fungicide') || lowerName.includes('mancozeb')) return 'Fungicide';
    return 'Pesticide';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Fertilizer': return 'bg-green-100 text-green-800';
      case 'Organic': return 'bg-blue-100 text-blue-800';
      case 'Fungicide': return 'bg-purple-100 text-purple-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Treatments & Pesticides</h1>
            <p className="text-primary-100 mt-1">
              Find the right treatments and fertilizers for your crops
            </p>
          </div>
          <Beaker className="h-16 w-16 text-primary-200" />
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
                  placeholder="Search treatments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Crops</option>
                {cropTypes.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span>{filteredTreatments.length} treatments found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreatments.map((treatment) => {
          const treatmentType = getTreatmentType(treatment.name);
          
          return (
            <Card key={treatment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{treatment.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(treatmentType)}`}>
                        {treatmentType}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {treatment.crop_type}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {treatment.description}
                  </p>

                  {treatment.price_range && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{treatment.price_range}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Leaf className="h-4 w-4 mr-2 text-gray-400" />
                    <span>For {treatment.crop_type} crops</span>
                  </div>

                  {treatment.created_at && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Added: {formatDate(treatment.created_at)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTreatment(treatment);
                        setShowDetailModal(true);
                      }}
                      className="w-full"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Usage Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTreatments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No treatments found</h3>
            <p className="text-gray-600">
              {searchTerm || cropFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No treatments are currently available'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Treatment Detail Modal */}
      {showDetailModal && selectedTreatment && (
        <TreatmentDetailModal
          treatment={selectedTreatment}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTreatment(null);
          }}
        />
      )}
    </div>
  );
};

// Treatment Detail Modal Component
const TreatmentDetailModal = ({ treatment, onClose }) => {
  const treatmentType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('npk') || lowerName.includes('fertilizer')) return 'Fertilizer';
    if (lowerName.includes('oil') || lowerName.includes('neem')) return 'Organic';
    if (lowerName.includes('fungicide') || lowerName.includes('mancozeb')) return 'Fungicide';
    return 'Pesticide';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Fertilizer': return 'bg-green-100 text-green-800';
      case 'Organic': return 'bg-blue-100 text-blue-800';
      case 'Fungicide': return 'bg-purple-100 text-purple-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const type = treatmentType(treatment.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{treatment.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(type)}`}>
              {type}
            </span>
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
              {treatment.crop_type}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{treatment.description}</p>
          </div>

          {treatment.recommended_usage && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Instructions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800">{treatment.recommended_usage}</p>
                </div>
              </div>
            </div>
          )}

          {treatment.price_range && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">{treatment.price_range}</span>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Safety Precautions</h4>
                <p className="text-yellow-800 text-sm">
                  Always read the product label carefully. Use protective equipment when handling. 
                  Keep away from children and pets. Follow recommended dosage and application timing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Treatments;