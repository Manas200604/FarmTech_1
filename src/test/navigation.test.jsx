import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabNavigation from '../components/navigation/TabNavigation';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock language context
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key
  }),
  LanguageProvider: ({ children }) => children
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

describe('TabNavigation Component', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render materials and cart tabs', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const materialsTab = screen.getByText('Materials').closest('button');
    const cartTab = screen.getByText('Cart').closest('button');

    expect(materialsTab).toHaveClass('border-primary-500', 'text-primary-600');
    expect(cartTab).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('should show cart item count badge when items exist', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={5} 
        />
      </TestWrapper>
    );

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500', 'text-white');
  });

  it('should not show cart badge when no items', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('should call onTabChange when tab is clicked', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const cartTab = screen.getByText('Cart').closest('button');
    fireEvent.click(cartTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('cart');
  });

  it('should switch active tab correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    // Initially materials tab is active
    expect(screen.getByText('Materials').closest('button')).toHaveClass('border-primary-500');

    // Switch to cart tab
    rerender(
      <TestWrapper>
        <TabNavigation 
          activeTab="cart" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Cart').closest('button')).toHaveClass('border-primary-500');
    expect(screen.getByText('Materials').closest('button')).toHaveClass('border-transparent');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Tabs');

    const activeTab = screen.getByText('Materials').closest('button');
    expect(activeTab).toHaveAttribute('aria-current', 'page');

    const inactiveTab = screen.getByText('Cart').closest('button');
    expect(inactiveTab).not.toHaveAttribute('aria-current');
  });

  it('should display icons for tabs', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    // Check if icons are rendered (they should be SVG elements)
    const materialsTab = screen.getByText('Materials').closest('button');
    const cartTab = screen.getByText('Cart').closest('button');

    expect(materialsTab.querySelector('svg')).toBeInTheDocument();
    expect(cartTab.querySelector('svg')).toBeInTheDocument();
  });

  it('should be sticky positioned', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const container = screen.getByRole('navigation').closest('div');
    expect(container).toHaveClass('sticky', 'top-0', 'z-10');
  });

  it('should handle large cart item counts', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={99} 
        />
      </TestWrapper>
    );

    const badge = screen.getByText('99');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('min-w-[20px]'); // Ensures badge is properly sized
  });

  it('should maintain responsive design classes', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={5} 
        />
      </TestWrapper>
    );

    const container = screen.getByRole('navigation').closest('div');
    expect(container).toHaveClass('container', 'mx-auto', 'px-4');

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex', 'space-x-8');
  });
});

describe('TabNavigation Mobile Responsiveness', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain proper spacing on mobile', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={3} 
        />
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('space-x-8'); // Proper spacing between tabs
  });

  it('should position badge correctly on mobile', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={1} 
        />
      </TestWrapper>
    );

    const cartTab = screen.getByText('Cart').closest('button');
    const badge = cartTab.querySelector('span');
    
    expect(badge).toHaveClass('absolute', '-top-1', '-right-1');
  });

  it('should handle touch interactions properly', () => {
    render(
      <TestWrapper>
        <TabNavigation 
          activeTab="materials" 
          onTabChange={mockOnTabChange} 
          cartItemCount={0} 
        />
      </TestWrapper>
    );

    const cartTab = screen.getByText('Cart').closest('button');
    
    // Simulate touch event
    fireEvent.touchStart(cartTab);
    fireEvent.touchEnd(cartTab);
    fireEvent.click(cartTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('cart');
  });
});