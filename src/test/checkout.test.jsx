import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutProcess from '../components/checkout/CheckoutProcess';
import { LanguageProvider } from '../contexts/LanguageContext';
import { CartProvider } from '../contexts/CartContext';

// Mock auth context
const mockUserProfile = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890'
};

vi.mock('../contexts/FastAuthContext', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile
  })
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </LanguageProvider>
);

// Mock cart data
const mockCartItems = [
  {
    id: 'item1',
    productId: 'mat1',
    productName: 'Test Pesticide',
    quantity: 2,
    unitPrice: 100,
    subtotal: 200
  },
  {
    id: 'item2',
    productId: 'mat2',
    productName: 'Test Tool',
    quantity: 1,
    unitPrice: 500,
    subtotal: 500
  }
];

const mockCartContext = {
  cartItems: mockCartItems,
  subtotal: 700,
  tax: 35,
  totalAmount: 735,
  clearCart: vi.fn()
};

vi.mock('../contexts/CartContext', () => ({
  useCart: () => mockCartContext,
  CartProvider: ({ children }) => children
}));

describe('CheckoutProcess Component', () => {
  const mockOnBack = vi.fn();
  const mockOnOrderComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment step initially', () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
  });

  it('should display order summary correctly', () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Pesticide x 2')).toBeInTheDocument();
    expect(screen.getByText('Test Tool x 1')).toBeInTheDocument();
    expect(screen.getByText('₹700.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('₹35.00')).toBeInTheDocument(); // tax
    expect(screen.getByText('₹735.00')).toBeInTheDocument(); // total
  });

  it('should pre-fill shipping address with user profile data', () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    const nameInput = screen.getByDisplayValue('Test User');
    const phoneInput = screen.getByDisplayValue('1234567890');

    expect(nameInput).toBeInTheDocument();
    expect(phoneInput).toBeInTheDocument();
  });

  it('should show payment method options', () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    expect(screen.getByText('UPI Payment')).toBeInTheDocument();
    expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
    expect(screen.getByText('Cash on Delivery')).toBeInTheDocument();
  });

  it('should select payment method', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    const cardPaymentOption = screen.getByText('Credit/Debit Card').closest('div');
    fireEvent.click(cardPaymentOption);

    // Should select card payment method
    await waitFor(() => {
      expect(cardPaymentOption).toHaveClass('border-primary-500');
    });
  });

  it('should validate required shipping address fields', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Clear required fields
    const addressInput = screen.getByLabelText(/Address/);
    fireEvent.change(addressInput, { target: { value: '' } });

    const proceedButton = screen.getByText('Proceed to Payment');
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill all required fields')).toBeInTheDocument();
    });
  });

  it('should proceed to verification step for UPI payment', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    // Select UPI payment (default)
    const proceedButton = screen.getByText('Proceed to Payment');
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(screen.getByText('Payment Verification')).toBeInTheDocument();
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    });
  });

  it('should skip verification for COD payment', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    // Select COD payment
    const codOption = screen.getByText('Cash on Delivery').closest('div');
    fireEvent.click(codOption);

    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(screen.getByText('Order Submitted Successfully!')).toBeInTheDocument();
    });
  });

  it('should handle payment verification submission', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Navigate to verification step
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('Payment Verification')).toBeInTheDocument();
    });

    // Fill verification details
    fireEvent.change(screen.getByLabelText(/Farmer Name/), { target: { value: 'Test Farmer' } });
    fireEvent.change(screen.getByLabelText(/Transaction ID/), { target: { value: 'TXN123456' } });

    // Mock file upload
    const fileInput = screen.getByLabelText(/Payment Screenshot/);
    const file = new File(['screenshot'], 'payment.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByText('Submit Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Order Submitted Successfully!')).toBeInTheDocument();
    });
  });

  it('should validate verification form fields', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Navigate to verification step
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('Payment Verification')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Submit Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill all verification fields')).toBeInTheDocument();
    });
  });

  it('should call onBack when back button is clicked', () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should call onOrderComplete when order is submitted', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Fill required fields and select COD
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    const codOption = screen.getByText('Cash on Delivery').closest('div');
    fireEvent.click(codOption);

    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(mockOnOrderComplete).toHaveBeenCalled();
    });
  });

  it('should clear cart after successful order', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Complete COD order
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    const codOption = screen.getByText('Cash on Delivery').closest('div');
    fireEvent.click(codOption);

    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(mockCartContext.clearCart).toHaveBeenCalled();
    });
  });

  it('should display QR code information for UPI payment', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Navigate to verification step
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('UPI ID: manas28prabhu@okaxis')).toBeInTheDocument();
      expect(screen.getByText('Amount: ₹735.00')).toBeInTheDocument();
    });
  });

  it('should show different confirmation messages for different payment methods', async () => {
    render(
      <TestWrapper>
        <CheckoutProcess onBack={mockOnBack} onOrderComplete={mockOnOrderComplete} />
      </TestWrapper>
    );

    // Test COD confirmation
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: '123 Test Street' } });
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/Pincode/), { target: { value: '123456' } });

    const codOption = screen.getByText('Cash on Delivery').closest('div');
    fireEvent.click(codOption);

    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(screen.getByText(/Your order has been confirmed/)).toBeInTheDocument();
    });
  });
});