import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import materialsStorage from '../../utils/materialsStorage';
import { orderStorage } from '../../utils/orderStorage';
import paymentStorage from '../../utils/paymentStorage';
import cropFormsStorage from '../../utils/cropFormsStorage';
import uploadsStorage from '../../utils/uploadsStorage';
import { Material } from '../../models/Material';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  Hash,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  User,
  Phone,
  Image as ImageIcon,
  Calendar,
  Download,
  FileText,
  MapPin,
  Crop,
  Upload,
  File,
  Search,
  Grid,
  List,
  Eye
} from 'lucide-react';

const AdminMaterialsManager = () => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState([]);
  const [cropForms, setCropForms] = useState([]);
  const [allUploads, setAllUploads] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // materials, analytics, lowStock, payments, cropForms, uploads
  const [formData, setFormData] = useState({
    name: { en: '', mr: '', hi: '' },
    description: { en: '', mr: '', hi: '' },
    price: '',
    unit: '',
    stock: '',
    category: '',
    imageUrl: '',
    available: true
  });

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    await Promise.all([
      loadMaterials(),
      loadOrders(),
      loadPaymentSubmissions(),
      loadCropForms(),
      loadAllUploads(),
      calculateAnalytics()
    ]);
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const materialsData = await materialsStorage.getAllMaterials();
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await orderStorage.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadPaymentSubmissions = async () => {
    try {
      const submissions = paymentStorage.getAllSubmissions();
      setPaymentSubmissions(submissions);
    } catch (error) {
      console.error('Error loading payment submissions:', error);
    }
  };

  const loadCropForms = async () => {
    try {
      const forms = cropFormsStorage.getAllForms();
      setCropForms(forms);
    } catch (error) {
      console.error('Error loading crop forms:', error);
    }
  };

  const loadAllUploads = async () => {
    try {
      const uploads = uploadsStorage.getAllUploads();
      setAllUploads(uploads);
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  };

  const calculateAnalytics = async () => {
    try {
      const ordersData = await orderStorage.getAllOrders();
      const materialsData = await materialsStorage.getAllMaterials();

      // Calculate total sales
      const totalSales = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      // Calculate total orders
      const totalOrders = ordersData.length;

      // Calculate low stock items (stock < 10)
      const lowStockItems = materialsData.filter(material => material.stock < 10);

      // Calculate pending orders
      const pendingOrders = ordersData.filter(order =>
        order.status === 'pending' || order.status === 'payment_submitted'
      ).length;

      // Calculate top selling products
      const productSales = {};
      ordersData.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (productSales[item.productId]) {
              productSales[item.productId].quantity += item.quantity;
              productSales[item.productId].revenue += item.subtotal;
            } else {
              productSales[item.productId] = {
                name: item.productName,
                quantity: item.quantity,
                revenue: item.subtotal
              };
            }
          });
        }
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .slice(0, 5);

      setAnalytics({
        totalSales,
        totalOrders,
        lowStockItems: lowStockItems.length,
        pendingOrders,
        topProducts,
        lowStockProducts: lowStockItems
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: { en: '', mr: '', hi: '' },
      description: { en: '', mr: '', hi: '' },
      price: '',
      unit: '',
      stock: '',
      category: '',
      imageUrl: '',
      available: true
    });
    setEditingMaterial(null);
    setShowAddForm(false);
  };

  const handleInputChange = React.useCallback((field, value, language = null) => {
    if (language) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [language]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const materialData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        createdBy: userProfile.id
      };

      if (editingMaterial) {
        await materialsStorage.updateMaterial(editingMaterial.id, materialData);
        toast.success(t('materialUpdated') || 'Material updated successfully');
      } else {
        await materialsStorage.addMaterial(materialData);
        toast.success(t('materialAdded') || 'Material added successfully');
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error(error.message || 'Failed to save material');
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name || { en: '', mr: '', hi: '' },
      description: material.description || { en: '', mr: '', hi: '' },
      price: material.price.toString(),
      unit: material.unit,
      stock: material.stock.toString(),
      category: material.category,
      imageUrl: material.imageUrl,
      available: material.available
    });
    setShowAddForm(true);
  };

  const handleDelete = async (materialId) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this material?')) {
      try {
        await materialsStorage.deleteMaterial(materialId);
        toast.success(t('materialDeleted') || 'Material deleted successfully');
        await loadData();
      } catch (error) {
        console.error('Error deleting material:', error);
        toast.error('Failed to delete material');
      }
    }
  };

  const toggleAvailability = async (material) => {
    try {
      await materialsStorage.updateMaterial(material.id, {
        available: !material.available
      });
      await loadMaterials();
      toast.success(t('availabilityUpdated') || 'Availability updated');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderStorage.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      toast.success(t('orderStatusUpdated', 'Order status updated successfully'));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm(t('confirmDeleteOrder', 'Are you sure you want to delete this order? This action cannot be undone.'))) {
      try {
        await orderStorage.deleteOrder(orderId);
        await loadOrders();
        toast.success(t('orderDeleted', 'Order deleted successfully'));
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Failed to delete order');
      }
    }
  };

  const updatePaymentStatus = async (submissionId, status, notes = '') => {
    try {
      paymentStorage.updateSubmissionStatus(submissionId, status, userProfile.id, notes);
      await loadPaymentSubmissions();
      toast.success(`Payment ${status} successfully`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const deletePaymentSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this payment submission?')) {
      try {
        paymentStorage.deleteSubmission(submissionId);
        await loadPaymentSubmissions();
        toast.success('Payment submission deleted successfully');
      } catch (error) {
        console.error('Error deleting payment submission:', error);
        toast.error('Failed to delete payment submission');
      }
    }
  };

  const updateCropFormStatus = async (formId, status, adminNotes = '') => {
    try {
      cropFormsStorage.updateFormStatus(formId, status, userProfile.id, adminNotes);
      await loadCropForms();
      toast.success(`Crop form ${status} successfully`);
    } catch (error) {
      console.error('Error updating crop form status:', error);
      toast.error('Failed to update crop form status');
    }
  };

  const deleteCropForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this crop form? This action cannot be undone.')) {
      try {
        cropFormsStorage.deleteCropForm(formId);
        await loadCropForms();
        toast.success('Crop form deleted successfully');
      } catch (error) {
        console.error('Error deleting crop form:', error);
        toast.error('Failed to delete crop form');
      }
    }
  };

  const bulkDeleteCropForms = async (formIds) => {
    if (window.confirm(`Are you sure you want to delete ${formIds.length} crop forms? This action cannot be undone.`)) {
      try {
        const deletedCount = cropFormsStorage.bulkDeleteForms(formIds);
        await loadCropForms();
        toast.success(`${deletedCount} crop forms deleted successfully`);
      } catch (error) {
        console.error('Error bulk deleting crop forms:', error);
        toast.error('Failed to delete crop forms');
      }
    }
  };

  const deleteUpload = async (uploadId) => {
    if (window.confirm('Are you sure you want to delete this upload? This action cannot be undone.')) {
      try {
        uploadsStorage.deleteUpload(uploadId, userProfile.id);
        await loadAllUploads();
        toast.success('Upload deleted successfully');
      } catch (error) {
        console.error('Error deleting upload:', error);
        toast.error('Failed to delete upload');
      }
    }
  };

  const bulkDeleteUploads = async (uploadIds) => {
    if (window.confirm(`Are you sure you want to delete ${uploadIds.length} uploads? This action cannot be undone.`)) {
      try {
        const deletedCount = uploadsStorage.bulkDeleteUploads(uploadIds, userProfile.id);
        await loadAllUploads();
        toast.success(`${deletedCount} uploads deleted successfully`);
      } catch (error) {
        console.error('Error bulk deleting uploads:', error);
        toast.error('Failed to delete uploads');
      }
    }
  };

  const permanentlyDeleteUpload = async (uploadId) => {
    if (window.confirm('Are you sure you want to permanently delete this upload? This action cannot be undone and the file will be lost forever.')) {
      try {
        uploadsStorage.permanentlyDeleteUpload(uploadId);
        await loadAllUploads();
        toast.success('Upload permanently deleted');
      } catch (error) {
        console.error('Error permanently deleting upload:', error);
        toast.error('Failed to permanently delete upload');
      }
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('materialsManagement')}</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addMaterial')}</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Package className="inline h-4 w-4 mr-1" />
          {t('materials', 'Materials')}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Package className="inline h-4 w-4 mr-1" />
          {t('materialRequests', 'Material Requests')} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart3 className="inline h-4 w-4 mr-1" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('lowStock')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'lowStock'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Low Stock ({analytics.lowStockItems || 0})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <CreditCard className="inline h-4 w-4 mr-1" />
          Payment Submissions ({paymentSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('cropForms')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cropForms'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <FileText className="inline h-4 w-4 mr-1" />
          Crop Forms ({cropForms.length})
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'uploads'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Upload className="inline h-4 w-4 mr-1" />
          Upload Management ({allUploads.length})
        </button>
      </div>

      {/* Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹{analytics.totalSales?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.lowStockItems || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.pendingOrders || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {analytics.topProducts?.map(([productId, data], index) => (
                <div key={productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{data.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{data.revenue?.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{data.quantity} sold</div>
                  </div>
                </div>
              )) || (
                  <p className="text-gray-500 text-center py-4">No sales data available</p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {activeTab === 'lowStock' && (
        <div className="space-y-4">
          {analytics.lowStockProducts?.length > 0 ? (
            analytics.lowStockProducts.map((material) => (
              <div key={material.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {material.getLocalizedName(currentLanguage)}
                    </h3>
                    <p className="text-sm text-gray-600">{material.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{material.stock} {material.unit}</div>
                    <div className="text-sm text-gray-500">Stock remaining</div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Update Stock</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All items are well stocked</h3>
              <p className="text-gray-600">No items with low stock (below 10 units)</p>
            </div>
          )}
        </div>
      )}

      {/* Material Requests */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{t('materialRequests', 'Material Requests')}</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadOrders}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Package className="h-4 w-4" />
                <span>{t('refresh', 'Refresh')}</span>
              </button>
              <div className="text-sm text-gray-600">
                {orders.length} {t('totalRequests', 'total requests')}
              </div>
            </div>
          </div>

          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('order', 'Order')} #{order.id.toString().slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('farmer', 'Farmer')}: {order.shippingAddress?.name || order.farmerId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('orderDate', 'Order Date')}: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary-600">
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'payment_submitted' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'verified' ? 'bg-green-100 text-green-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {order.status === 'pending_verification' ? t('pendingVerification', 'Pending Verification') :
                        order.status === 'payment_submitted' ? t('paymentSubmitted', 'Payment Submitted') :
                          order.status === 'verified' ? t('verified', 'Verified') :
                            order.status === 'completed' ? t('completed', 'Completed') :
                              order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{t('orderedItems', 'Ordered Items')}:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-600 ml-2">x {item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">₹{item.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                {order.shippingAddress && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">{t('contactInfo', 'Contact Information')}:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>{t('phone', 'Phone')}:</strong> {order.shippingAddress.phone}</p>
                      <p><strong>{t('address', 'Address')}:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {order.paymentDetails && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">{t('paymentInfo', 'Payment Information')}:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>{t('paymentMethod', 'Payment Method')}:</strong> {order.paymentMethod?.toUpperCase()}</p>
                      {order.paymentDetails.transactionId && (
                        <p><strong>{t('transactionId', 'Transaction ID')}:</strong> {order.paymentDetails.transactionId}</p>
                      )}
                      {order.paymentDetails.submittedAt && (
                        <p><strong>{t('submittedAt', 'Submitted At')}:</strong> {new Date(order.paymentDetails.submittedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {order.status === 'payment_submitted' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'verified')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('approvePayment', 'Approve Payment')}</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'rejected')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                        <span>{t('rejectPayment', 'Reject Payment')}</span>
                      </button>
                    </>
                  )}
                  {order.status === 'verified' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <Package className="h-4 w-4" />
                      <span>{t('markCompleted', 'Mark as Completed')}</span>
                    </button>
                  )}

                  {/* Delete Order Button - Available for all orders */}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('deleteOrder', 'Delete Order')}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noOrdersFound', 'No material requests found')}</h3>
              <p className="text-gray-600">{t('noOrdersDescription', 'Farmers haven\'t placed any material orders yet')}</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Submissions */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Payment Submissions</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadPaymentSubmissions}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <CreditCard className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <div className="text-sm text-gray-600">
                {paymentSubmissions.length} total submissions
              </div>
            </div>
          </div>

          {paymentSubmissions.length > 0 ? (
            paymentSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Submission #{submission.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary-600">
                      ₹{submission.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Full Name:</span>
                      <span className="font-medium">{submission.fullName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-medium">{submission.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Transaction ID:</span>
                      <span className="font-medium">{submission.transactionId}</span>
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Payment Screenshot:</span>
                    </div>
                    {submission.paymentScreenshot ? (
                      <div className="relative">
                        <img
                          src={submission.paymentScreenshot}
                          alt="Payment screenshot"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border cursor-pointer"
                          onClick={() => window.open(submission.paymentScreenshot, '_blank')}
                        />
                        <button
                          onClick={() => window.open(submission.paymentScreenshot, '_blank')}
                          className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-xs h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No screenshot</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {submission.orderDetails?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-600 ml-2">x {item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Information */}
                {submission.reviewedAt && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">Review Information:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Reviewed At:</strong> {new Date(submission.reviewedAt).toLocaleString()}</p>
                      <p><strong>Reviewed By:</strong> {submission.reviewedBy}</p>
                      {submission.notes && (
                        <p><strong>Notes:</strong> {submission.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {submission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updatePaymentStatus(submission.id, 'approved', 'Payment verified and approved')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve Payment</span>
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter rejection reason (optional):');
                          updatePaymentStatus(submission.id, 'rejected', notes || 'Payment rejected');
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                        <span>Reject Payment</span>
                      </button>
                    </>
                  )}

                  {/* Delete Submission Button */}
                  <button
                    onClick={() => deletePaymentSubmission(submission.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Submission</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment submissions found</h3>
              <p className="text-gray-600">Payment verification submissions will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Crop Forms Management */}
      {activeTab === 'cropForms' && (
        <CropFormsManagement
          cropForms={cropForms}
          onUpdateStatus={updateCropFormStatus}
          onDeleteForm={deleteCropForm}
          onBulkDelete={bulkDeleteCropForms}
          onRefresh={loadCropForms}
        />
      )}

      {/* Upload Management */}
      {activeTab === 'uploads' && (
        <AdminUploadManagement
          uploads={allUploads}
          onDeleteUpload={deleteUpload}
          onBulkDelete={bulkDeleteUploads}
          onPermanentDelete={permanentlyDeleteUpload}
          onRefresh={loadAllUploads}
        />
      )}

      {/* Materials Grid */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div key={material.id} className="card p-6">
              {material.imageUrl && (
                <img
                  src={material.imageUrl}
                  alt={material.getLocalizedName(currentLanguage)}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">
                  {material.getLocalizedName(currentLanguage)}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-3 text-sm">
                {material.getLocalizedDescription(currentLanguage)}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{t('price')}</span>
                  </div>
                  <span className="font-semibold">₹{material.price}/{material.unit}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{t('materialStock')}</span>
                  </div>
                  <span className={`font-semibold ${material.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {material.stock}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{t('materialCategory')}</span>
                  </div>
                  <span className="text-sm">{material.category}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(material)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${material.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                >
                  {material.available ? t('available') : t('outOfStock')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingMaterial ? t('editMaterial') : t('addMaterial')}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Multi-language Name Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('materialName')}</label>
                <div className="space-y-2">
                  <input
                    key="name-en"
                    type="text"
                    placeholder="English Name"
                    value={formData.name.en || ''}
                    onChange={(e) => handleInputChange('name', e.target.value, 'en')}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    key="name-mr"
                    type="text"
                    placeholder="मराठी नाव"
                    value={formData.name.mr || ''}
                    onChange={(e) => handleInputChange('name', e.target.value, 'mr')}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    key="name-hi"
                    type="text"
                    placeholder="हिंदी नाम"
                    value={formData.name.hi || ''}
                    onChange={(e) => handleInputChange('name', e.target.value, 'hi')}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              {/* Multi-language Description Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('materialDescription')}</label>
                <div className="space-y-2">
                  <textarea
                    key="desc-en"
                    placeholder="English Description"
                    value={formData.description.en || ''}
                    onChange={(e) => handleInputChange('description', e.target.value, 'en')}
                    className="w-full p-3 border rounded-lg"
                    rows="3"
                  />
                  <textarea
                    key="desc-mr"
                    placeholder="मराठी वर्णन"
                    value={formData.description.mr || ''}
                    onChange={(e) => handleInputChange('description', e.target.value, 'mr')}
                    className="w-full p-3 border rounded-lg"
                    rows="3"
                  />
                  <textarea
                    key="desc-hi"
                    placeholder="हिंदी विवरण"
                    value={formData.description.hi || ''}
                    onChange={(e) => handleInputChange('description', e.target.value, 'hi')}
                    className="w-full p-3 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('price')}</label>
                  <input
                    key="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('materialUnit')}</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="liter">Liter</option>
                    <option value="piece">Piece</option>
                    <option value="packet">Packet</option>
                    <option value="bag">Bag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('materialStock')}</label>
                  <input
                    key="stock"
                    type="number"
                    min="0"
                    value={formData.stock || ''}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('materialCategory')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    <optgroup label="Pesticides">
                      <option value="Insecticides">Insecticides</option>
                      <option value="Herbicides">Herbicides</option>
                      <option value="Fungicides">Fungicides</option>
                      <option value="Fertilizers">Fertilizers</option>
                    </optgroup>
                    <optgroup label="Agricultural Tools">
                      <option value="Hand Tools">Hand Tools</option>
                      <option value="Power Tools">Power Tools</option>
                      <option value="Irrigation Equipment">Irrigation Equipment</option>
                      <option value="Harvesting Tools">Harvesting Tools</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Seeds">Seeds</option>
                      <option value="Equipment">Equipment</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('materialImage')} URL</label>
                <input
                  key="imageUrl"
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => handleInputChange('available', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  {t('available')}
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingMaterial ? t('save') : t('add')}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Crop Forms Management Component
const CropFormsManagement = ({ cropForms, onUpdateStatus, onDeleteForm, onBulkDelete, onRefresh }) => {
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [showBulkActions, setShowBulkActions] = React.useState(false);

  const handleSelectForm = (formId) => {
    setSelectedForms(prev => {
      const newSelection = prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedForms.length === cropForms.length) {
      setSelectedForms([]);
      setShowBulkActions(false);
    } else {
      setSelectedForms(cropForms.map(form => form.id));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedForms);
    setSelectedForms([]);
    setShowBulkActions(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Farmer Crop Forms</h2>
        <div className="flex items-center space-x-4">
          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected ({selectedForms.length})</span>
              </button>
            </div>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <FileText className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="text-sm text-gray-600">
            {cropForms.length} total forms
          </div>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {cropForms.length > 0 && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedForms.length === cropForms.length && cropForms.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({cropForms.length})
            </span>
          </label>
          {selectedForms.length > 0 && (
            <span className="text-sm text-primary-600 font-medium">
              {selectedForms.length} forms selected
            </span>
          )}
        </div>
      )}

      {cropForms.length > 0 ? (
        cropForms.map((form) => (
          <div key={form.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <label className="flex items-center mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedForms.includes(form.id)}
                  onChange={() => handleSelectForm(form.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Crop Form #{form.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(form.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${form.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      form.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Farmer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Farmer:</span>
                      <span className="font-medium">{form.farmerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-medium">{form.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="font-medium">{form.location}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Crop className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Crop:</span>
                      <span className="font-medium">{form.cropType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Land Size:</span>
                      <span className="font-medium">{form.landSize} acres</span>
                    </div>
                    {form.expectedYield && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Expected Yield:</span>
                        <span className="font-medium">{form.expectedYield} tons</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                {(form.plantingDate || form.harvestDate) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {form.plantingDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Planting Date:</span>
                        <span className="font-medium">{new Date(form.plantingDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {form.harvestDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Harvest Date:</span>
                        <span className="font-medium">{new Date(form.harvestDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {form.description && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {form.requirements && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{form.requirements}</p>
                  </div>
                )}

                {/* Crop Images */}
                {form.cropImages && form.cropImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Crop Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {form.cropImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Crop ${index + 1}`}
                            className="w-full h-20 object-cover rounded border cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                          <button
                            onClick={() => window.open(image, '_blank')}
                            className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Review Information */}
                {form.reviewedAt && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">Admin Review:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Reviewed At:</strong> {new Date(form.reviewedAt).toLocaleString()}</p>
                      <p><strong>Reviewed By:</strong> {form.reviewedBy}</p>
                      {form.adminNotes && (
                        <p><strong>Notes:</strong> {form.adminNotes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {form.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(form.id, 'approved', 'Crop form approved by admin')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter rejection reason (optional):');
                          onUpdateStatus(form.id, 'rejected', notes || 'Crop form rejected');
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {/* Delete Form Button */}
                  <button
                    onClick={() => onDeleteForm(form.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No crop forms found</h3>
          <p className="text-gray-600">Farmer crop form submissions will appear here</p>
        </div>
      )}
    </div>
  );
};

// Admin Upload Management Component
const AdminUploadManagement = ({ uploads, onDeleteUpload, onBulkDelete, onPermanentDelete, onRefresh }) => {
  const [selectedUploads, setSelectedUploads] = React.useState([]);
  const [viewMode, setViewMode] = React.useState('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [filteredUploads, setFilteredUploads] = React.useState(uploads);

  React.useEffect(() => {
    filterUploads();
  }, [uploads, searchQuery, selectedCategory]);

  const filterUploads = () => {
    let filtered = [...uploads];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(upload =>
        upload.fileName.toLowerCase().includes(query) ||
        upload.uploaderName.toLowerCase().includes(query) ||
        upload.description.toLowerCase().includes(query) ||
        upload.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(upload => upload.category === selectedCategory);
    }

    setFilteredUploads(filtered);
  };

  const handleSelectUpload = (uploadId) => {
    setSelectedUploads(prev => {
      const newSelection = prev.includes(uploadId)
        ? prev.filter(id => id !== uploadId)
        : [...prev, uploadId];
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedUploads.length === filteredUploads.length) {
      setSelectedUploads([]);
    } else {
      setSelectedUploads(filteredUploads.map(upload => upload.id));
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedUploads);
    setSelectedUploads([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return ImageIcon;
    return File;
  };

  const handleDownload = (upload) => {
    try {
      const link = document.createElement('a');
      link.href = upload.fileData;
      link.download = upload.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const categories = ['general', 'crop', 'payment', 'document'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Upload Management</h2>
        <div className="flex items-center space-x-4">
          {selectedUploads.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected ({selectedUploads.length})</span>
              </button>
            </div>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <Upload className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="text-sm text-gray-600">
            {uploads.length} total uploads
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploads by filename, uploader, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {filteredUploads.length > 0 && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUploads.length === filteredUploads.length && filteredUploads.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({filteredUploads.length})
            </span>
          </label>
          {selectedUploads.length > 0 && (
            <span className="text-sm text-primary-600 font-medium">
              {selectedUploads.length} uploads selected
            </span>
          )}
        </div>
      )}

      {/* Uploads Display */}
      {filteredUploads.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
        }>
          {filteredUploads.map((upload) => {
            const FileIcon = getFileIcon(upload.fileType);

            if (viewMode === 'list') {
              return (
                <div key={upload.id} className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center space-x-4">
                    {/* Selection Checkbox */}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUploads.includes(upload.id)}
                        onChange={() => handleSelectUpload(upload.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>

                    {/* File Preview */}
                    <div className="flex-shrink-0">
                      {upload.fileType?.startsWith('image/') ? (
                        <img
                          src={upload.fileData}
                          alt={upload.fileName}
                          className="w-16 h-16 object-cover rounded border cursor-pointer"
                          onClick={() => window.open(upload.fileData, '_blank')}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          <FileIcon className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {upload.fileName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>Uploaded by: <strong>{upload.uploaderName}</strong></span>
                          <span>Role: <strong>{upload.uploaderRole}</strong></span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Size: {formatFileSize(upload.fileSize)}</span>
                          <span>Category: {upload.category}</span>
                          <span>Downloads: {upload.downloadCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Uploaded: {new Date(upload.uploadedAt).toLocaleString()}</span>
                        </div>
                        {upload.description && (
                          <p className="text-gray-600 mt-2">{upload.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(upload.fileData, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(upload)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteUpload(upload.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onPermanentDelete && (
                        <button
                          onClick={() => onPermanentDelete(upload.id)}
                          className="p-2 text-red-800 hover:bg-red-100 rounded-lg"
                          title="Permanent Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Grid view
            return (
              <div key={upload.id} className="bg-white rounded-lg shadow-sm border overflow-hidden relative">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUploads.includes(upload.id)}
                      onChange={() => handleSelectUpload(upload.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>

                {/* File Preview */}
                <div className="relative h-48 bg-gray-100">
                  {upload.fileType?.startsWith('image/') ? (
                    <img
                      src={upload.fileData}
                      alt={upload.fileName}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(upload.fileData, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-2">
                    {upload.fileName}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{upload.uploaderName} ({upload.uploaderRole})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size: {formatFileSize(upload.fileSize)}</span>
                      <span>Downloads: {upload.downloadCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(upload.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {upload.description && (
                      <p className="text-gray-600 text-xs line-clamp-2">{upload.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {upload.category}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(upload.fileData, '_blank')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(upload)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteUpload(upload.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onPermanentDelete && (
                        <button
                          onClick={() => onPermanentDelete(upload.id)}
                          className="p-1 text-red-800 hover:bg-red-100 rounded"
                          title="Permanent Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads found</h3>
          <p className="text-gray-600">User uploads will appear here</p>
        </div>
      )}
    </div>
  );
};

export default AdminMaterialsManager;