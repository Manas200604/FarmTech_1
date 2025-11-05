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
  ExternalLink,
  FileText,
  Search
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const SchemeManager = () => {
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eligibility: '',
    documents: '',
    government_link: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utility function to safely parse JSON documents
  const safeParseDocuments = (documentsField) => {
    if (!documentsField) return [];
    
    // If it's already an array, return it
    if (Array.isArray(documentsField)) {
      return documentsField;
    }
    
    // If it's not a string, convert to string first
    if (typeof documentsField !== 'string') {
      documentsField = String(documentsField);
    }
    
    try {
      const parsed = JSON.parse(documentsField);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      // If it's not valid JSON, treat as plain text and split by lines
      return documentsField.split('\n').filter(line => line.trim());
    }
  };

  useEffect(() => {
    // Add error boundary for the initial fetch
    try {
      fetchSchemes();
    } catch (error) {
      console.error('Error initializing SchemeManager:', error);
      toast.error('Failed to initialize scheme manager');
    }
  }, []);

  const fetchSchemes = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Clean up any corrupted JSON data
      const cleanedSchemes = (data || []).map(scheme => {
        try {
          // Ensure documents field is properly formatted
          if (scheme.documents) {
            // If it's already an array, stringify it
            if (Array.isArray(scheme.documents)) {
              scheme.documents = JSON.stringify(scheme.documents);
            } else if (typeof scheme.documents === 'string') {
              try {
                // Test if it's valid JSON
                JSON.parse(scheme.documents);
              } catch (error) {
                // Convert plain text to JSON array
                const docs = scheme.documents.split('\n').filter(line => line.trim());
                scheme.documents = JSON.stringify(docs);
                
                // Optionally update the database to fix the corrupted data
                supabase
                  .from('schemes')
                  .update({ documents: scheme.documents })
                  .eq('id', scheme.id)
                  .then(() => console.log(`Fixed corrupted documents for scheme: ${scheme.title}`))
                  .catch(err => console.warn('Failed to fix corrupted data:', err));
              }
            } else {
              // Convert any other type to JSON array
              scheme.documents = JSON.stringify([String(scheme.documents)]);
            }
          } else {
            // Ensure documents is never null/undefined
            scheme.documents = JSON.stringify([]);
          }
        } catch (error) {
          console.warn(`Error processing scheme ${scheme.id}:`, error);
          // Fallback to empty array
          scheme.documents = JSON.stringify([]);
        }
        return scheme;
      });
      
      setSchemes(cleanedSchemes);
    } catch (error) {
      console.error('Error fetching schemes:', error);
      setError(error.message);
      toast.error('Failed to fetch schemes');
      setSchemes([]); // Ensure schemes is always an array
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const schemeData = {
        ...formData,
        documents: JSON.stringify(
          formData.documents.split('\n').filter(doc => doc.trim())
        )
      };

      if (editingScheme) {
        const { error } = await supabase
          .from('schemes')
          .update(schemeData)
          .eq('id', editingScheme.id);

        if (error) throw error;
        toast.success('Scheme updated successfully!');
      } else {
        const { error } = await supabase
          .from('schemes')
          .insert([schemeData]);

        if (error) throw error;
        toast.success('Scheme created successfully!');
      }

      setShowModal(false);
      setEditingScheme(null);
      resetForm();
      fetchSchemes();
    } catch (error) {
      console.error('Error saving scheme:', error);
      toast.error('Failed to save scheme');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    
    // Use safe parsing for documents
    const docs = safeParseDocuments(scheme.documents);
    const documentsText = docs.join('\n');
    
    setFormData({
      title: scheme.title,
      description: scheme.description,
      eligibility: scheme.eligibility,
      documents: documentsText,
      government_link: scheme.government_link || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (schemeId) => {
    if (!confirm('Are you sure you want to delete this scheme?')) return;

    try {
      const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', schemeId);

      if (error) throw error;
      toast.success('Scheme deleted successfully!');
      fetchSchemes();
    } catch (error) {
      console.error('Error deleting scheme:', error);
      toast.error('Failed to delete scheme');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eligibility: '',
      documents: '',
      government_link: ''
    });
  };

  const filteredSchemes = schemes.filter(scheme =>
    scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scheme.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading schemes...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Schemes</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSchemes}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheme Management</h2>
          <p className="text-gray-600">Manage government agricultural schemes</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Scheme
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search schemes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schemes List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSchemes.map((scheme) => (
          <Card key={scheme.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{scheme.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(scheme.created_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {scheme.government_link && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(scheme.government_link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(scheme)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(scheme.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-700">{scheme.description}</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Eligibility:</h4>
                  <p className="text-sm text-gray-600">{scheme.eligibility}</p>
                </div>

                {(() => {
                  const docs = safeParseDocuments(scheme.documents);
                  if (docs.length > 0) {
                    return (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Required Documents:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {docs.map((doc, index) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
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
              {searchTerm ? 'Try adjusting your search criteria' : 'No schemes available'}
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
                {editingScheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingScheme(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Input
                label="Scheme Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter scheme title"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter scheme description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eligibility Criteria
                </label>
                <textarea
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter eligibility criteria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Documents (one per line)
                </label>
                <textarea
                  value={formData.documents}
                  onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Aadhaar Card&#10;Bank Account Details&#10;Land Records"
                />
              </div>

              <Input
                label="Government Link (optional)"
                type="url"
                value={formData.government_link}
                onChange={(e) => setFormData({ ...formData, government_link: e.target.value })}
                placeholder="https://example.gov.in"
              />

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingScheme(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingScheme ? 'Update Scheme' : 'Create Scheme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeManager;