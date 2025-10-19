import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  MessageCircle, 
  Reply, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Tag,
  Search,
  Filter,
  Send,
  X
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const InquiryManager = () => {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        // Since inquiries table doesn't exist in our schema, we'll use uploads as inquiries
        const { data: inquiriesData, error } = await supabase
          .from('uploads')
          .select('*')
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
      .channel('uploads_inquiry_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploads' }, fetchInquiries)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || inquiry.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const handleRespond = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setResponding(true);
    try {
      await updateDoc(doc(db, 'inquiries', selectedInquiry.id), {
        adminResponse: response.trim(),
        status: 'resolved',
        respondedAt: Timestamp.now(),
        respondedBy: 'admin', // In real app, use actual admin ID
        lastUpdated: Timestamp.now()
      });

      toast.success('Response sent successfully!');
      setShowResponseModal(false);
      setSelectedInquiry(null);
      setResponse('');
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  const markInProgress = async (inquiryId) => {
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: 'in_progress',
        lastUpdated: Timestamp.now()
      });
      toast.success('Inquiry marked as in progress');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
    switch (urgency) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material Requests</h2>
          <p className="text-gray-600">Respond to farmer material requests and provide expert recommendations</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Urgency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              <span>{filteredInquiries.length} inquiries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="space-y-4">
        {filteredInquiries.map((inquiry) => (
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
                      <User className="h-4 w-4 mr-1" />
                      <span>{inquiry.farmerName}</span>
                    </div>
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
                  <h4 className="font-medium text-gray-900 mb-2">Farmer's Question:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.description}</p>
                </div>

                {inquiry.adminResponse && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
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

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  {inquiry.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markInProgress(inquiry.id)}
                    >
                      Mark In Progress
                    </Button>
                  )}
                  
                  {inquiry.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setResponse(inquiry.adminResponse || '');
                        setShowResponseModal(true);
                      }}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      {inquiry.adminResponse ? 'Update Response' : 'Respond'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInquiries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No farmer inquiries yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Respond to: {selectedInquiry.subject}
              </h2>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedInquiry(null);
                  setResponse('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Inquiry Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">{selectedInquiry.farmerName}</span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{selectedInquiry.category}</span>
                  </div>
                  {selectedInquiry.cropType && (
                    <div className="flex items-center">
                      <span>🌾 {selectedInquiry.cropType}</span>
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Farmer's Question:</h4>
                <p className="text-gray-700">{selectedInquiry.description}</p>
              </div>

              {/* Response Form */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Expert Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide detailed expert advice including:
- Diagnosis of the problem
- Recommended solutions
- Specific products or treatments
- Application instructions
- Preventive measures
- Follow-up recommendations"
                />
              </div>

              {/* Response Templates */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Response Templates:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResponse(response + "\n\n🔍 Diagnosis: Based on your description, this appears to be [condition]. \n\n💊 Treatment: I recommend using [specific treatment] at [dosage]. \n\n⚠️ Precautions: [safety measures]. \n\n📅 Follow-up: Monitor for [timeframe] and contact if symptoms persist.")}
                  >
                    Disease Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResponse(response + "\n\n🌱 Recommendation: For your crop type, I suggest [specific fertilizer/pesticide]. \n\n📏 Application: Apply [amount] per [area] during [timing]. \n\n🛡️ Safety: Use protective equipment and follow label instructions. \n\n📈 Expected Results: You should see improvement within [timeframe].")}
                  >
                    Treatment Template
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedInquiry(null);
                    setResponse('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRespond}
                  loading={responding}
                  disabled={!response.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryManager;