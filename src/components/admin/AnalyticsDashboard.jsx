import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Upload,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import analyticsStorage from '../../utils/analyticsStorage';
import { AnalyticsData } from '../../models/AnalyticsData';

const AnalyticsDashboard = ({ dateRange, onDateRangeChange }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [chartData, setChartData] = useState({});

  // Default date range (last 30 days)
  const defaultDateRange = useMemo(() => ({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  }), []);

  const currentDateRange = dateRange || defaultDateRange;

  useEffect(() => {
    loadAnalyticsData();
  }, [currentDateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard summary
      const summaryData = await analyticsStorage.getDashboardSummary(currentDateRange);
      setSummary(summaryData);

      // Load detailed analytics
      const analyticsData = await analyticsStorage.getAnalyticsByDateRange(
        currentDateRange.start,
        currentDateRange.end
      );
      setAnalytics(analyticsData);

      // Prepare chart data
      await prepareChartData(analyticsData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async (analyticsData) => {
    const chartData = {};

    // Group data by metric type
    const groupedData = analyticsData.reduce((acc, item) => {
      if (!acc[item.metricType]) {
        acc[item.metricType] = [];
      }
      acc[item.metricType].push(item);
      return acc;
    }, {});

    // Prepare chart data for each metric type
    Object.keys(groupedData).forEach(metricType => {
      const data = groupedData[metricType]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          value: item.value,
          formattedValue: item.getFormattedValue()
        }));
      
      chartData[metricType] = data;
    });

    setChartData(chartData);
  };

  const handleDateRangeChange = (newRange) => {
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = async () => {
    try {
      const exportData = await analyticsStorage.exportAnalytics('json', currentDateRange);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            {currentDateRange.start.toLocaleDateString()} - {currentDateRange.end.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={summary.totalUsers}
            change={summary.growth?.users || 0}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${summary.totalRevenue.toLocaleString()}`}
            change={summary.growth?.revenue || 0}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Total Orders"
            value={summary.totalOrders}
            change={summary.growth?.orders || 0}
            icon={ShoppingCart}
            color="purple"
          />
          <MetricCard
            title="Total Uploads"
            value={summary.totalUploads}
            change={0} // Calculate upload growth if needed
            icon={Upload}
            color="orange"
          />
        </div>
      )}

      {/* Additional Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.newRegistrations}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.conversionRate.toFixed(2)}%</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summary.averageOrderValue.toFixed(0)}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData[AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS] || []}
              color="#3B82F6"
              label="New Users"
            />
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData[AnalyticsData.METRIC_TYPES.REVENUE] || []}
              color="#10B981"
              label="Revenue"
            />
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData[AnalyticsData.METRIC_TYPES.ORDERS_COUNT] || []}
              color="#8B5CF6"
              label="Orders"
            />
          </CardContent>
        </Card>

        {/* Uploads Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData[AnalyticsData.METRIC_TYPES.UPLOADS_COUNT] || []}
              color="#F59E0B"
              label="Uploads"
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analytics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.getMetricDisplayName()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.getFormattedValue()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== 0 && (
              <div className="flex items-center mt-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
              </div>
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

// Simple Line Chart Component (using SVG)
const SimpleLineChart = ({ data, color, label }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const width = 400;
  const height = 200;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-64">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{`${d.date}: ${d.formattedValue || d.value}`}</title>
            </circle>
          );
        })}
        
        {/* Y-axis labels */}
        <text x="10" y={padding} className="text-xs fill-gray-500">{maxValue}</text>
        <text x="10" y={height - padding} className="text-xs fill-gray-500">{minValue}</text>
        
        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text x={padding} y={height - 10} className="text-xs fill-gray-500">{data[0].date}</text>
            <text x={width - padding} y={height - 10} className="text-xs fill-gray-500 text-end">{data[data.length - 1].date}</text>
          </>
        )}
      </svg>
    </div>
  );
};

export default AnalyticsDashboard;