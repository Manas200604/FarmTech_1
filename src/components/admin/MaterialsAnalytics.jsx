import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/FastAuthContext';
import MaterialsService from '../../services/materialsService';
import { 
  BarChart3, TrendingUp, Package, DollarSign, AlertTriangle, 
  Download, RefreshCw, Calendar, Filter, Eye
} from 'lucide-react';

const MaterialsAnalytics = () => {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const materialsService = new MaterialsService();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedCategory]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await materialsService.getMaterialAnalytics(userProfile);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading materials analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        analytics,
        dateRange,
        category: selectedCategory,
        generatedAt: new Date().toISOString(),
        generatedBy: userProfile.name
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materials Analytics</h2>
          <p className="text-gray-600">Inventory insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                <option value="pesticides">Pesticides</option>
                <option value="tools">Tools</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Materials"
          value={analytics.totalMaterials}
          icon={Package}
          color="blue"
          subtitle={`${analytics.activeMaterials} active`}
        />
        
        <MetricCard
          title="Total Inventory Value"
          value={`₹${analytics.totalValue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          subtitle={`Avg: ₹${analytics.averagePrice.toFixed(0)}`}
        />
        
        <MetricCard
          title="Low Stock Items"
          value={analytics.lowStockItems}
          icon={AlertTriangle}
          color="orange"
          subtitle={`${analytics.needsReorderItems} need reorder`}
        />
        
        <MetricCard
          title="Out of Stock"
          value={analytics.outOfStockItems}
          icon={Package}
          color="red"
          subtitle="Immediate attention needed"
        />
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{category}</h4>
                    <p className="text-sm text-gray-600">{data.count} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{data.totalValue.toLocaleString()}</p>
                    {data.lowStock > 0 && (
                      <p className="text-sm text-orange-600">{data.lowStock} low stock</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topSellingMaterials.map((material, index) => (
                <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{material.name}</h4>
                      <p className="text-sm text-gray-600">{material.salesCount} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{material.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Added Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.recentlyAdded.map((material) => (
              <div key={material.id} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{material.name}</h4>
                <p className="text-sm text-gray-600">
                  Added {new Date(material.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Health */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-600">Healthy Stock</h3>
              <p className="text-2xl font-bold text-green-600">
                {analytics.totalMaterials - analytics.lowStockItems - analytics.outOfStockItems}
              </p>
              <p className="text-sm text-gray-600">Materials in good stock</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-600">Low Stock</h3>
              <p className="text-2xl font-bold text-orange-600">{analytics.lowStockItems}</p>
              <p className="text-sm text-gray-600">Need restocking soon</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-red-600">Out of Stock</h3>
              <p className="text-2xl font-bold text-red-600">{analytics.outOfStockItems}</p>
              <p className="text-sm text-gray-600">Immediate action needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Inventory Efficiency</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stock Turnover Rate</span>
                  <span className="font-medium">Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inventory Accuracy</span>
                  <span className="font-medium">95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reorder Efficiency</span>
                  <span className="font-medium">Excellent</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Recommendations</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Consider increasing stock for top-selling materials
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    {analytics.lowStockItems} materials need immediate restocking
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Overall inventory health is good
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialsAnalytics;