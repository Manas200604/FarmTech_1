import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Users, 
  Search, 
  Filter, 
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../supabase/client';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const specializations = [
    'Crop Diseases', 'Soil Management', 'Pest Control', 'Irrigation', 
    'Organic Farming', 'Livestock', 'Horticulture', 'Agronomy'
  ];

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data: contactsData, error } = await supabase
          .from('contacts')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('contacts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchContacts)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };

    return () => unsubscribe();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.specialization.some(spec => 
                           spec.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesRegion = regionFilter === 'all' || contact.region === regionFilter;
    const matchesSpecialization = specializationFilter === 'all' || 
                                 contact.specialization.includes(specializationFilter);
    return matchesSearch && matchesRegion && matchesSpecialization;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating || 0) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agricultural Specialists</h1>
            <p className="text-primary-100 mt-1">
              Connect with verified experts for agricultural guidance
            </p>
          </div>
          <Users className="h-16 w-16 text-primary-200" />
        </div>
      </div>      
{/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search specialists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              <span>{filteredContacts.length} specialists found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    {contact.name}
                    {contact.isVerified && (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    )}
                  </CardTitle>
                  <div className="flex items-center mt-2">
                    {renderStars(contact.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      ({contact.rating?.toFixed(1) || 'New'})
                    </span>
                  </div>
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
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{contact.experience} years experience</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Specializations:</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.specialization.slice(0, 3).map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                    {contact.specialization.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{contact.specialization.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Crop Types:</p>
                  <p className="text-sm text-gray-600">
                    {contact.cropTypes.slice(0, 3).join(', ')}
                    {contact.cropTypes.length > 3 && ` +${contact.cropTypes.length - 3} more`}
                  </p>
                </div>

                {contact.availability && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{contact.availability.hours}</span>
                  </div>
                )}

                <div className="pt-3 border-t space-y-2">
                  {contact.contactInfo.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{contact.contactInfo.phone}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${contact.contactInfo.phone}`)}
                      >
                        Call
                      </Button>
                    </div>
                  )}

                  {contact.contactInfo.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{contact.contactInfo.email}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`mailto:${contact.contactInfo.email}`)}
                      >
                        Email
                      </Button>
                    </div>
                  )}
                </div>

                {contact.qualifications && contact.qualifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Qualifications:</p>
                    <p className="text-xs text-gray-600">
                      {contact.qualifications.join(', ')}
                    </p>
                  </div>
                )}

                {contact.languages && contact.languages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Languages:</p>
                    <p className="text-xs text-gray-600">
                      {contact.languages.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No specialists found</h3>
            <p className="text-gray-600">
              {searchTerm || regionFilter !== 'all' || specializationFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No specialists are currently available'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Contacts;