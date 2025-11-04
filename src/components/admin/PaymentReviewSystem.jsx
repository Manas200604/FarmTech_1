import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/FastAuthContext';
import PaymentService from '../../services/paymentService';
import { PaymentSubmission } from '../../models/PaymentSubmission';
import toast from 'react-hot-toast';
import {
  Check, X, Eye, Search, Filter, Download, RefreshCw, 
  CreditCard, User, Calendar, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Clock, Grid, List, FileText
} from 'lucide-react';

const PaymentReviewSystem = () => {
  const { userProfile, isSuperAdmin, canDeleteData, canModifySystem } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    status: 'pending',
    paymentMethod: '',
    dateRange: null
  });
  const [statistics, setStatistics] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingPayment, setReviewingPayment] = useState(null);

  const paymentService = useMemo(() => new PaymentService(), []);

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const response = await paymentService.getPaymentHistory({
        ...filters,
        page: 1,
        limit: 100
      }, userProfile);
      
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await paymentService.getPaymentStatistics(null, userProfile);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleReviewPayment = async (paymentId, action, notes = '') => {
    try {
      await paymentService.reviewPayment(paymentId, action, notes, userProfile);
      toast.success(`Payment ${action}d successfully`);
      loadPayments();
      loadStatistics();
      setShowReviewModal(false);
      setReviewingPayment(null);
    } catch (error) {
      toast.error(error.message || `Failed to ${action} payment`);
    }
  };

  const handleBulkReview = async (action) => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to review');
      return;
    }

    try {
      await paymentService.bulkReviewPayments(selectedPayments, action, '', userProfile);
      toast.success(`${selectedPayments.length} payments ${action}d successfully`);
      setSelectedPayments([]);
      loadPayments();
      loadStatistics();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} payments`);
    }
  };

  const handleExport = async () => {
    try {
      const response = await paymentService.exportPayments('json', filters, userProfile);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Payments exported successfully');
    } catch (error) {
      toast.error('Failed to export payments');
    }
  };

  const togglePaymentSelection = (paymentId) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const selectAllPayments = () => {
    const pendingPayments = payments.filter(p => p.status === PaymentSubmission.STATUS.PENDING);
    setSelectedPayments(pendingPayments.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPayments([]);
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          payment.farmerName.toLowerCase().includes(searchTerm) ||
          payment.transactionId.toLowerCase().includes(searchTerm) ||
          payment.phoneNumber?.includes(searchTerm);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [payments, filters.search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Review System</h2>
          <p className="text-gray-600">Review and approve payment submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Submissions"
            value={statistics.total}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={statistics.pending}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Approved"
            value={statistics.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Rejected"
            value={statistics.rejected}
            icon={XCircle}
            color="red"
          />
        </div>
      )}

      {/* Additional Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{statistics.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.approvalRate?.toFixed(1) || 0}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.averageProcessingTimeHours?.toFixed(1) || 0}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by farmer name, transaction ID..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Methods</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>

            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedPayments.length} payment(s) selected
                </span>
                <Button variant="outline" size="sm" onClick={selectAllPayments}>
                  Select All Pending
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkReview('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Bulk Approve
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleBulkReview('reject')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Bulk Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              isSelected={selectedPayments.includes(payment.id)}
              onSelect={togglePaymentSelection}
              onReview={(action, notes) => handleReviewPayment(payment.id, action, notes)}
              onViewDetails={() => {
                setReviewingPayment(payment);
                setShowReviewModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <PaymentsList
          payments={filteredPayments}
          selectedPayments={selectedPayments}
          onSelect={togglePaymentSelection}
          onReview={handleReviewPayment}
          onViewDetails={(payment) => {
            setReviewingPayment(payment);
            setShowReviewModal(true);
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingPayment && (
        <PaymentReviewModal
          payment={reviewingPayment}
          onReview={handleReviewPayment}
          onClose={() => {
            setShowReviewModal(false);
            setReviewingPayment(null);
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Payment Card Component
const PaymentCard = ({ payment, isSelected, onSelect, onReview, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case PaymentSubmission.STATUS.PENDING:
        return 'text-orange-600 bg-orange-100';
      case PaymentSubmission.STATUS.APPROVED:
        return 'text-green-600 bg-green-100';
      case PaymentSubmission.STATUS.REJECTED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isPending = payment.status === PaymentSubmission.STATUS.PENDING;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {isPending && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(payment.id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{payment.farmerName}</h3>
              <p className="text-sm text-gray-600">{payment.phoneNumber}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
            {payment.getStatusText()}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-semibold">₹{payment.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Transaction ID:</span>
            <span className="text-sm font-mono">{payment.transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Method:</span>
            <span className="text-sm">{payment.getPaymentMethodText()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Submitted:</span>
            <span className="text-sm">{new Date(payment.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          {isPending && (
            <>
              <Button 
                size="sm" 
                onClick={() => onReview('approve')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                onClick={() => onReview('reject')}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Payments List Component
const PaymentsList = ({ payments, selectedPayments, onSelect, onReview, onViewDetails }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status === PaymentSubmission.STATUS.PENDING && (
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => onSelect(payment.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.farmerName}</div>
                      <div className="text-sm text-gray-500">{payment.phoneNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.getPaymentMethodText()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === PaymentSubmission.STATUS.PENDING ? 'bg-orange-100 text-orange-800' :
                      payment.status === PaymentSubmission.STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.getStatusText()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onViewDetails(payment)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === PaymentSubmission.STATUS.PENDING && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => onReview(payment.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => onReview(payment.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Payment Review Modal
const PaymentReviewModal = ({ payment, onReview, onClose }) => {
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!action) return;
    onReview(payment.id, action, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Review Payment</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Farmer:</span>
                <span className="ml-2 font-medium">{payment.farmerName}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{payment.phoneNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">₹{payment.amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Method:</span>
                <span className="ml-2 font-medium">{payment.getPaymentMethodText()}</span>
              </div>
              <div>
                <span className="text-gray-600">Transaction ID:</span>
                <span className="ml-2 font-mono">{payment.transactionId}</span>
              </div>
              <div>
                <span className="text-gray-600">Submitted:</span>
                <span className="ml-2">{new Date(payment.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Screenshot Placeholder */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Payment screenshot would be displayed here</p>
            <p className="text-sm text-gray-500 mt-1">Screenshot URL: {payment.screenshotUrl || 'Not provided'}</p>
          </div>

          {/* Review Form */}
          {payment.status === PaymentSubmission.STATUS.PENDING && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Decision
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approve"
                      checked={action === 'approve'}
                      onChange={(e) => setAction(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-green-600">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reject"
                      checked={action === 'reject'}
                      onChange={(e) => setAction(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-red-600">Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any notes about this review..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!action}>
                  Submit Review
                </Button>
              </div>
            </form>
          )}

          {/* Already Reviewed */}
          {payment.status !== PaymentSubmission.STATUS.PENDING && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Review Information</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium">{payment.getStatusText()}</span>
                </div>
                {payment.reviewedAt && (
                  <div>
                    <span className="text-gray-600">Reviewed:</span>
                    <span className="ml-2">{new Date(payment.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
                {payment.reviewedBy && (
                  <div>
                    <span className="text-gray-600">Reviewed by:</span>
                    <span className="ml-2">{payment.reviewedBy}</span>
                  </div>
                )}
                {payment.adminNotes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2">{payment.adminNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReviewSystem;