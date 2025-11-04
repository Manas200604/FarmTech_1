import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import orderStorage from '../../utils/orderStorage';
import { Order } from '../../models/Order';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

const OrderTracking = () => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    searchQuery: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadOrders();
  }, [userProfile]);

  useEffect(() => {
    filterOrders();
  }, [orders, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let userOrders = [];
      
      if (userProfile?.role === 'admin') {
        userOrders = await orderStorage.getAllOrders();
      } else if (userProfile?.id) {
        userOrders = await orderStorage.getOrdersByFarmer(userProfile.id);
      }
      
      setOrders(userOrders);
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      searchQuery: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case Order.STATUS.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case Order.STATUS.PAYMENT_SUBMITTED:
        return <Clock className="h-5 w-5 text-blue-500" />;
      case Order.STATUS.VERIFIED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case Order.STATUS.PROCESSING:
        return <Package className="h-5 w-5 text-blue-500" />;
      case Order.STATUS.SHIPPED:
        return <Truck className="h-5 w-5 text-purple-500" />;
      case Order.STATUS.DELIVERED:
        return <MapPin className="h-5 w-5 text-green-500" />;
      case Order.STATUS.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case Order.STATUS.CANCELLED:
      case Order.STATUS.REJECTED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case Order.STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case Order.STATUS.PAYMENT_SUBMITTED:
        return 'bg-blue-100 text-blue-800';
      case Order.STATUS.VERIFIED:
      case Order.STATUS.PROCESSING:
        return 'bg-green-100 text-green-800';
      case Order.STATUS.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case Order.STATUS.DELIVERED:
      case Order.STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case Order.STATUS.CANCELLED:
      case Order.STATUS.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status) => {
    const statusOrder = [
      Order.STATUS.PENDING,
      Order.STATUS.PAYMENT_SUBMITTED,
      Order.STATUS.VERIFIED,
      Order.STATUS.PROCESSING,
      Order.STATUS.SHIPPED,
      Order.STATUS.DELIVERED,
      Order.STATUS.COMPLETED
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) return 0;
    
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('orderHistory')}</h1>
        <button
          onClick={loadOrders}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('orderStatus')}</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value={Order.STATUS.PENDING}>Pending</option>
              <option value={Order.STATUS.PAYMENT_SUBMITTED}>Payment Submitted</option>
              <option value={Order.STATUS.VERIFIED}>Verified</option>
              <option value={Order.STATUS.PROCESSING}>Processing</option>
              <option value={Order.STATUS.SHIPPED}>Shipped</option>
              <option value={Order.STATUS.DELIVERED}>Delivered</option>
              <option value={Order.STATUS.COMPLETED}>Completed</option>
              <option value={Order.STATUS.CANCELLED}>Cancelled</option>
              <option value={Order.STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Order ID, Transaction ID..."
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
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your filters or place your first order.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              currentLanguage={currentLanguage}
              onViewDetails={() => viewOrderDetails(order)}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              getProgressPercentage={getProgressPercentage}
              t={t}
            />
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          currentLanguage={currentLanguage}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getProgressPercentage={getProgressPercentage}
          t={t}
        />
      )}
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  currentLanguage, 
  onViewDetails, 
  getStatusIcon, 
  getStatusColor, 
  getProgressPercentage,
  t 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.id.slice(-8)}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-2">
              {order.getStatusText ? order.getStatusText(currentLanguage) : order.status}
            </span>
          </span>
          
          <button
            onClick={onViewDetails}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Order Progress</span>
          <span>{Math.round(getProgressPercentage(order.status))}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage(order.status)}%` }}
          ></div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>Total: </span>
          <span className="font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
        </div>
        
        {order.paymentDetails?.transactionId && (
          <div className="text-sm text-gray-600">
            <span>Transaction: </span>
            <span className="font-mono">{order.paymentDetails.transactionId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ 
  order, 
  onClose, 
  currentLanguage, 
  getStatusIcon, 
  getStatusColor, 
  getProgressPercentage,
  t 
}) => {
  const getStatusTimeline = () => {
    const timeline = [
      { status: Order.STATUS.PENDING, label: 'Order Placed', completed: true },
      { status: Order.STATUS.PAYMENT_SUBMITTED, label: 'Payment Submitted', completed: false },
      { status: Order.STATUS.VERIFIED, label: 'Payment Verified', completed: false },
      { status: Order.STATUS.PROCESSING, label: 'Processing', completed: false },
      { status: Order.STATUS.SHIPPED, label: 'Shipped', completed: false },
      { status: Order.STATUS.DELIVERED, label: 'Delivered', completed: false },
      { status: Order.STATUS.COMPLETED, label: 'Completed', completed: false }
    ];

    const statusOrder = timeline.map(item => item.status);
    const currentIndex = statusOrder.indexOf(order.status);
    
    return timeline.map((item, index) => ({
      ...item,
      completed: index <= currentIndex && currentIndex !== -1
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Order Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-600">Order ID:</span> <span className="font-mono">{order.id}</span></div>
                <div><span className="text-gray-600">Date:</span> {new Date(order.createdAt).toLocaleString()}</div>
                <div><span className="text-gray-600">Items:</span> {order.items.length}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2">
                  {order.getStatusText ? order.getStatusText(currentLanguage) : order.status}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Total Amount</h3>
              <div className="text-2xl font-bold text-primary-600">
                ₹{order.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="font-semibold mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {getStatusTimeline().map((item, index) => (
                <div key={item.status} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          {order.paymentDetails && order.paymentDetails.transactionId && (
            <div>
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                <div><span className="text-gray-600">Customer:</span> {order.paymentDetails.farmerName}</div>
                <div><span className="text-gray-600">Transaction ID:</span> <span className="font-mono">{order.paymentDetails.transactionId}</span></div>
                <div><span className="text-gray-600">Submitted:</span> {new Date(order.paymentDetails.submittedAt).toLocaleString()}</div>
                {order.paymentDetails.verifiedAt && (
                  <div><span className="text-gray-600">Verified:</span> {new Date(order.paymentDetails.verifiedAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Quantity</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Unit Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{item.materialName}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm font-medium">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;