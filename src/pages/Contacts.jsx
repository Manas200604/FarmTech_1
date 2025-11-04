import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FastAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  Award,
  Plus
} from 'lucide-react';
import { supabase } from '../supabase/client';

const Contacts = () => {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || contact.region === regionFilter;
    const matchesSpecialization = specializationFilter === 'all' || 
                                 contact.specialization === specializationFilter;
    return matchesSearch && matchesRegion && matchesSpecialization;
  });

  // Parse contact info (phone, email)
  const parseContactInfo = (contactInfo) => {
    if (!contactInfo) return { phone: '', email: '' };
    
    const parts = contactInfo.split(',').map(part => part.trim());
    const phone = parts.find(part => part.startsWith('+') || /^\d/.test(part)) || '';
    const email = parts.find(part => part.includes('@')) || '';
    
    return { phone, email };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('agriculturalSpecialists', 'Agricultural Specialists')}</h1>
            <p className="text-primary-100 mt-1">
              {t('connectWithExperts', 'Connect with verified experts for agricultural guidance')}
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
                placeholder={t('searchSpecialists', 'Search specialists...')}
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
              <option value="all">{t('allRegions', 'All Regions')}</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">{t('allSpecializations', 'All Specializations')}</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                <span>{filteredContacts.length} {t('specialistsFound', 'specialists found')}</span>
              </div>
              {userProfile?.role === 'admin' && (
                <Button onClick={() => navigate('/admin')}>
                  <Plus className="h-4 w-4 mr-2" />
{t('manageContacts', 'Manage Contacts')}
                </Button>
              )}
            </div>
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
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{contact.region} {t('region', 'Region')}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t('specializesIn', 'Specializes in')} {contact.crop_type}</span>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    {contactDetails.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{contactDetails.phone}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${contactDetails.phone}`)}
                        >
{t('call', 'Call')}
                        </Button>
                      </div>
                    )}

                    {contactDetails.email && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{contactDetails.email}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${contactDetails.email}`)}
                        >
{t('email', 'Email')}
                        </Button>
                      </div>
                    )}
                  </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSpecialistsFound', 'No specialists found')}</h3>
            <p className="text-gray-600">
              {searchTerm || regionFilter !== 'all' || specializationFilter !== 'all'
                ? t('adjustSearchCriteria', 'Try adjusting your search or filter criteria')
                : t('noSpecialistsAvailable', 'No specialists are currently available')
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Contacts;