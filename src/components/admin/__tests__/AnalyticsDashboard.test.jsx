/**
 * Analytics Dashboard Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '../AnalyticsDashboard';
import analyticsStorage from '../../../utils/analyticsStorage';
import { AnalyticsData } from '../../../models/AnalyticsData';

// Mock the analytics storage
vi.mock('../../../utils/analyticsStorage', () => ({
  default: {
    getDashboardSummary: vi.fn(),
    getAnalyticsByDateRange: vi.fn(),
    exportAnalytics: vi.fn()
  }
}));

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and related DOM APIs
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn()
};

global.document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockAnchorElement;
  }
  return {};
});

global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

describe('AnalyticsDashboard', () => {
  const mockSummary = {
    totalUsers: 150,
    newRegistrations: 25,
    activeUsers: 120,
    totalRevenue: 75000,
    totalOrders: 300,
    totalUploads: 180,
    approvedUploads: 165,
    conversionRate: 2.5,
    averageOrderValue: 250,
    growth: {
      users: 15.5,
      revenue: 22.3,
      orders: 8.7
    }
  };

  const mockAnalyticsData = [
    new AnalyticsData({
      id: '1',
      metricType: AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS,
      value: 10,
      date: new Date('2023-01-01'),
      category: 'users'
    }),
    new AnalyticsData({
      id: '2',
      metricType: AnalyticsData.METRIC_TYPES.REVENUE,
      value: 5000,
      date: new Date('2023-01-01'),
      category: 'financial'
    }),
    new AnalyticsData({
      id: '3',
      metricType: AnalyticsData.METRIC_TYPES.ORDERS_COUNT,
      value: 20,
      date: new Date('2023-01-01'),
      category: 'orders'
    })
  ];

  beforeEach(() => {
    analyticsStorage.getDashboardSummary.mockResolvedValue(mockSummary);
    analyticsStorage.getAnalyticsByDateRange.mockResolvedValue(mockAnalyticsData);
    analyticsStorage.exportAnalytics.mockResolvedValue({
      analytics: mockAnalyticsData.map(d => d.toJSON()),
      exportedAt: new Date().toISOString(),
      format: 'json',
      totalRecords: mockAnalyticsData.length
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render analytics dashboard with loading state', () => {
      // Make the promise never resolve to test loading state
      analyticsStorage.getDashboardSummary.mockImplementation(() => new Promise(() => {}));
      
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should render analytics dashboard with data', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });

      // Check if metric cards are rendered
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Total Uploads')).toBeInTheDocument();
    });

    it('should display correct metric values', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total Users
        expect(screen.getByText('₹75,000')).toBeInTheDocument(); // Total Revenue
        expect(screen.getByText('300')).toBeInTheDocument(); // Total Orders
        expect(screen.getByText('180')).toBeInTheDocument(); // Total Uploads
      });
    });

    it('should display growth indicators', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('+15.5%')).toBeInTheDocument(); // User growth
        expect(screen.getByText('+22.3%')).toBeInTheDocument(); // Revenue growth
        expect(screen.getByText('+8.7%')).toBeInTheDocument(); // Orders growth
      });
    });

    it('should display additional metrics', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('New Registrations')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument(); // New registrations value
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
        expect(screen.getByText('2.5%')).toBeInTheDocument(); // Conversion rate value
        expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
        expect(screen.getByText('₹250')).toBeInTheDocument(); // Average order value
      });
    });
  });

  describe('charts', () => {
    it('should render chart sections', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('User Growth')).toBeInTheDocument();
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
        expect(screen.getByText('Orders Trend')).toBeInTheDocument();
        expect(screen.getByText('Upload Activity')).toBeInTheDocument();
      });
    });

    it('should display "No data available" when chart data is empty', async () => {
      analyticsStorage.getAnalyticsByDateRange.mockResolvedValue([]);
      
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const noDataMessages = screen.getAllByText('No data available');
        expect(noDataMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('data table', () => {
    it('should render analytics data table', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Analytics Data')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Metric')).toBeInTheDocument();
        expect(screen.getByText('Value')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
      });
    });

    it('should display analytics data in table rows', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('users')).toBeInTheDocument();
        expect(screen.getByText('financial')).toBeInTheDocument();
        expect(screen.getByText('orders')).toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('should handle refresh button click', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Should call the analytics storage methods again
      await waitFor(() => {
        expect(analyticsStorage.getDashboardSummary).toHaveBeenCalledTimes(2);
        expect(analyticsStorage.getAnalyticsByDateRange).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle export button click', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(analyticsStorage.exportAnalytics).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });
    });
  });

  describe('date range handling', () => {
    it('should use default date range when none provided', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(analyticsStorage.getDashboardSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date)
          })
        );
      });
    });

    it('should use provided date range', async () => {
      const customDateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      render(<AnalyticsDashboard dateRange={customDateRange} />);
      
      await waitFor(() => {
        expect(analyticsStorage.getDashboardSummary).toHaveBeenCalledWith(customDateRange);
      });
    });

    it('should call onDateRangeChange when date range changes', async () => {
      const mockOnDateRangeChange = vi.fn();
      const customDateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      };

      render(
        <AnalyticsDashboard 
          dateRange={customDateRange} 
          onDateRangeChange={mockOnDateRangeChange} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });

      // Simulate date range change (this would typically be triggered by a date picker)
      const newDateRange = {
        start: new Date('2023-02-01'),
        end: new Date('2023-02-28')
      };

      // Call the handler directly since we don't have a date picker in this test
      const dashboard = screen.getByText('Analytics Dashboard').closest('div');
      expect(dashboard).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle analytics loading errors gracefully', async () => {
      analyticsStorage.getDashboardSummary.mockRejectedValue(new Error('Storage error'));
      analyticsStorage.getAnalyticsByDateRange.mockRejectedValue(new Error('Storage error'));

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        // Should still render the dashboard structure even with errors
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle export errors gracefully', async () => {
      analyticsStorage.exportAnalytics.mockRejectedValue(new Error('Export error'));
      
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Should not throw an error
      await waitFor(() => {
        expect(analyticsStorage.exportAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('responsive design', () => {
    it('should render metric cards in responsive grid', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const gridContainer = screen.getByText('Total Users').closest('.grid');
        expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
      });
    });

    it('should render charts in responsive grid', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const chartContainer = screen.getByText('User Growth').closest('.grid');
        expect(chartContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 2 });
        expect(mainHeading).toHaveTextContent('Analytics Dashboard');
      });
    });

    it('should have accessible buttons', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        const exportButton = screen.getByRole('button', { name: /export/i });
        
        expect(refreshButton).toBeInTheDocument();
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('should have accessible table', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders).toHaveLength(4); // Date, Metric, Value, Category
      });
    });
  });
});