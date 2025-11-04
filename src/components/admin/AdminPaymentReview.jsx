import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import orderStorage from '../../utils/orderStorage';
import { Order } from '../../models/Order';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Filter,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  User,
  Hash,
  Calendar,
  DollarSign
} from 'lucide-react';

const AdminPaymentReview = () => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [filters, setFilters] = useState({
    status: 'payment_submitted',
    searchQuery: '',
    dateFrom: '',
    dateTo: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadOrders();
    }
  }, [userProfile]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderStorage.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.paymentDetails?.transactionId?.toLowerCase().includes(query) ||
        order.paymentDetails?.farmerName?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const pending = orders.filter(order => order.status === Order.STATUS.PAYMENT_SUBMITTED).length;
    const approved = orders.filter(order => order.status === Order.STATUS.VERIFIED).length;
    const rejected = orders.filter(order => order.status === Order.STATUS.REJECTED).length;
    const totalAmount = orders
      .filter(order => order.status === Order.STATUS.VERIFIED)
      .reduce((sum, order) => sum + order.totalAmount, 0);

    setStats({ pending, approved, rejected, totalAmount });
  };

  const handleVerifyPayment = async (orderId, approved) => {
    try {
      await orderStorage.verifyPayment(orderId, userProfile.id, approved);
      await loadOrders();
      
      const message = approved ? 
        (t('paymentApproved') || 'Payment approved successfully') :
        (t('paymentRejected') || 'Payment rejected');
      
      toast.success(message);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'payment_submitted',
      searchQuery: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const viewPaymentScreenshot = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [Order.STATUS.PENDING]: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      [Order.STATUS.PAYMENT_SUBMITTED]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      [Order.STATUS.VERIFIED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      [Order.STATUS.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig[Order.STATUS.PENDING];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
        <span className="ml-2">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('adminPaymentReview') || 'Payment Review Dashboard'}</h1>
        <button
          onClick={loadOrders}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value={Order.STATUS.PAYMENT_SUBMITTED}>Pending Review</option>
              <option value={Order.STATUS.VERIFIED}>Approved</option>
              <option value={Order.STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Order ID, Transaction ID, Name..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.paymentDetails?.farmerName || 'N/A'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.paymentDetails?.transactionId || 'N/A'}
                    </div>
                    {order.paymentDetails?.submittedAt && (
                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(order.paymentDetails.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {order.status === Order.STATUS.PAYMENT_SUBMITTED && (
                        <>
                          <button
                            onClick={() => handleVerifyPayment(order.id, true)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Payment"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(order.id, false)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject Payment"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onVerifyPayment={handleVerifyPayment}
          onViewScreenshot={viewPaymentScreenshot}
          t={t}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onVerifyPayment, onViewScreenshot, t }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Order Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div>
            <h3 className="font-semibold mb-2">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order ID:</span>
                <span className="ml-2 font-mono">{order.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2">{order.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-bold">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {order.paymentDetails && (
            <div>
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div>
                  <span className="text-gray-600">Customer Name:</span>
                  <span className="ml-2">{order.paymentDetails.farmerName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="ml-2 font-mono">{order.paymentDetails.transactionId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2">{new Date(order.paymentDetails.submittedAt).toLocaleString()}</span>
                </div>
                {order.paymentDetails.screenshotUrl && (
                  <div>
                    <span className="text-gray-600">Payment Screenshot:</span>
                    <button
                      onClick={() => onViewScreenshot(order.paymentDetails.screenshotUrl)}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      View Screenshot
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{item.materialName}</span>
                    <span className="text-gray-600 ml-2">x {item.quantity}</span>
                  </div>
                  <span className="font-semibold">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {order.status === Order.STATUS.PAYMENT_SUBMITTED && (
            <div className="flex space-x-4 pt-4 border-t">
              <button
                onClick={() => onVerifyPayment(order.id, false)}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Reject Payment
              </button>
              <button
                onClick={() => onVerifyPayment(order.id, true)}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Approve Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Image Modal Component
const ImageModal = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt="Payment Screenshot"
          className="max-w-full max-h-full object-contain rounded"
        />
      </div>
    </div>
  );
};

export default AdminPaymentReview;