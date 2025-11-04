import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/FastAuthContext';
import MaterialsService from '../../services/materialsService';
import { Material } from '../../models/Material';
import toast from 'react-hot-toast';
import {
  Plus, Edit, Trash2, Save, X, Package, DollarSign, AlertTriangle,
  TrendingUp, Search, Filter, Download, Upload, BarChart3, Tag,
  Truck, ShoppingCart, Eye, RefreshCw, Grid, List
} from 'lucide-react';

const EnhancedMaterialsManager = () => {
  const { userProfile, isSuperAdmin, canDeleteData, canModifySystem } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: false,
    needsReorder: false,
    active: true
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');

  const materialsService = useMemo(() => new MaterialsService(), []);

  useEffect(() => {
    loadData();
  }, [filters, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load materials with filters
      const materialsResponse = await materialsService.getMaterials({
        ...filters,
        sortBy,
        page: 1,
        limit: 100
      }, userProfile);
      
      setMaterials(materialsResponse.data.data || []);

      // Load analytics
      const analyticsResponse = await materialsService.getMaterialAnalytics(userProfile);
      setAnalytics(analyticsResponse.data);
      
    } catch (error) {
      console.error('Error loading materials data:', error);
      toast.error('Failed to load materials data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (materialData) => {
    try {
      await materialsService.createMaterial(materialData, userProfile);
      toast.success('Material created successfully');
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create material');
    }
  };

  const handleUpdateMaterial = async (id, updateData) => {
    try {
      await materialsService.updateMaterial(id, updateData, userProfile);
      toast.success('Material updated successfully');
      setEditingMaterial(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update material');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!canDeleteData()) {
      toast.error('You do not have permission to delete materials');
      return;
    }
    
    const confirmMessage = isSuperAdmin() 
      ? 'Are you sure you want to delete this material? This action cannot be undone.'
      : 'Are you sure you want to delete this material?';
      
    if (!confirm(confirmMessage)) return;
    
    try {
      await materialsService.deleteMaterial(id, userProfile);
      toast.success(isSuperAdmin() ? 'Material permanently deleted by Super Admin' : 'Material deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete material');
    }
  };

  const handleStockUpdate = async (id, quantity, operation) => {
    try {
      await materialsService.updateStock(id, quantity, operation, userProfile);
      toast.success('Stock updated successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update stock');
    }
  };

  const handlePriceUpdate = async (id, newPrice, reason) => {
    try {
      await materialsService.updatePricing(id, newPrice, reason, userProfile);
      toast.success('Price updated successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update price');
    }
  };

  const handleExport = async () => {
    try {
      const response = await materialsService.exportMaterials('json', userProfile);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Materials exported successfully');
    } catch (error) {
      toast.error('Failed to export materials');
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const name = material.getLocalizedName().toLowerCase();
        const description = material.getLocalizedDescription().toLowerCase();
        if (!name.includes(searchTerm) && !description.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [materials, filters.search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading materials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materials Management</h2>
          <p className="text-gray-600">Manage inventory, pricing, and stock levels</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Materials</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalMaterials}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.lowStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">₹{analytics.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Price</p>
                  <p className="text-2xl font-bold text-purple-600">₹{analytics.averagePrice.toFixed(0)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search materials..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="pesticides">Pesticides</option>
              <option value="tools">Tools</option>
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
              <option value="popularity">Sort by Popularity</option>
              <option value="created">Sort by Date Added</option>
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

      {/* Materials Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onEdit={setEditingMaterial}
              onDelete={handleDeleteMaterial}
              onStockUpdate={handleStockUpdate}
              onPriceUpdate={handlePriceUpdate}
            />
          ))}
        </div>
      ) : (
        <MaterialsList
          materials={filteredMaterials}
          onEdit={setEditingMaterial}
          onDelete={handleDeleteMaterial}
          onStockUpdate={handleStockUpdate}
          onPriceUpdate={handlePriceUpdate}
        />
      )}

      {/* Create Material Modal */}
      {showCreateForm && (
        <MaterialFormModal
          material={null}
          onSave={handleCreateMaterial}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <MaterialFormModal
          material={editingMaterial}
          onSave={(data) => handleUpdateMaterial(editingMaterial.id, data)}
          onClose={() => setEditingMaterial(null)}
        />
      )}
    </div>
  );
};

// Material Card Component
const MaterialCard = ({ material, onEdit, onDelete, onStockUpdate, onPriceUpdate }) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      case 'low_stock': return 'text-orange-600 bg-orange-100';
      case 'reorder_needed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {material.getLocalizedName()}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {material.getLocalizedDescription()}
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                {material.category}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${getStockStatusColor(material.getStockStatus())}`}>
                {material.getStockStatusText()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(material.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price:</span>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">₹{material.price}</span>
              <Button variant="outline" size="sm" onClick={() => setShowPriceModal(true)}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Stock:</span>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{material.stock} {material.unit}</span>
              <Button variant="outline" size="sm" onClick={() => setShowStockModal(true)}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sales:</span>
            <span className="font-semibold">{material.salesCount || 0}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Revenue:</span>
            <span className="font-semibold">₹{(material.revenue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Stock Update Modal */}
        {showStockModal && (
          <StockUpdateModal
            material={material}
            onUpdate={onStockUpdate}
            onClose={() => setShowStockModal(false)}
          />
        )}

        {/* Price Update Modal */}
        {showPriceModal && (
          <PriceUpdateModal
            material={material}
            onUpdate={onPriceUpdate}
            onClose={() => setShowPriceModal(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Materials List Component
const MaterialsList = ({ materials, onEdit, onDelete, onStockUpdate, onPriceUpdate }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {material.getLocalizedName()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {material.brand}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {material.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{material.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.stock} {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      material.getStockStatus() === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                      material.getStockStatus() === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {material.getStockStatusText()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDelete(material.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

// Material Form Modal Component
const MaterialFormModal = ({ material, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: { en: '', mr: '', hi: '' },
    description: { en: '', mr: '', hi: '' },
    price: 0,
    unit: '',
    category: '',
    subCategory: '',
    brand: '',
    stock: 0,
    lowStockThreshold: 10,
    reorderLevel: 20,
    ...material?.toJSON()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {material ? 'Edit Material' : 'Create Material'}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English)
              </label>
              <Input
                value={formData.name.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, en: e.target.value }
                }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select Category</option>
                <option value="pesticides">Pesticides</option>
                <option value="tools">Tools</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="kg, liter, piece, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <Input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level
              </label>
              <Input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (English)
            </label>
            <textarea
              value={formData.description.en}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: { ...prev.description, en: e.target.value }
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {material ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Update Modal
const StockUpdateModal = ({ material, onUpdate, onClose }) => {
  const [operation, setOperation] = useState('set');
  const [quantity, setQuantity] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(material.id, quantity, operation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Update Stock</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Current stock: {material.stock} {material.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="0"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Price Update Modal
const PriceUpdateModal = ({ material, onUpdate, onClose }) => {
  const [newPrice, setNewPrice] = useState(material.price);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(material.id, newPrice, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Update Price</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Current price: ₹{material.price}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Price (₹)
            </label>
            <Input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Change
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Market price change, Cost adjustment"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Price
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedMaterialsManager;