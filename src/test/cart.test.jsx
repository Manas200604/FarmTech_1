import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../contexts/CartContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Material } from '../models/Material';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Test component to interact with cart
const TestCartComponent = () => {
  const { 
    cartItems, 
    itemCount, 
    subtotal, 
    tax, 
    totalAmount,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();

  const testMaterial = new Material({
    id: 'test-material-1',
    name: { en: 'Test Pesticide', mr: 'टेस्ट कीटकनाशक', hi: 'टेस्ट कीटनाशक' },
    price: 100,
    unit: 'liter',
    stock: 50
  });

  return (
    <div>
      <div data-testid="cart-count">{itemCount}</div>
      <div data-testid="cart-subtotal">{subtotal.toFixed(2)}</div>
      <div data-testid="cart-tax">{tax.toFixed(2)}</div>
      <div data-testid="cart-total">{totalAmount.toFixed(2)}</div>
      
      <button 
        data-testid="add-to-cart" 
        onClick={() => addToCart(testMaterial)}
      >
        Add to Cart
      </button>
      
      <button 
        data-testid="update-quantity" 
        onClick={() => updateQuantity('test-material-1', 3)}
      >
        Update Quantity
      </button>
      
      <button 
        data-testid="remove-item" 
        onClick={() => removeFromCart('test-material-1')}
      >
        Remove Item
      </button>
      
      <button 
        data-testid="clear-cart" 
        onClick={clearCart}
      >
        Clear Cart
      </button>

      <div data-testid="cart-items">
        {cartItems.map(item => (
          <div key={item.id} data-testid={`cart-item-${item.id}`}>
            {item.productName} - Qty: {item.quantity} - ₹{item.subtotal}
          </div>
        ))}
      </div>
    </div>
  );
};

const TestWrapper = ({ children }) => (
  <LanguageProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </LanguageProvider>
);

describe('Cart Context', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with empty cart', () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('0.00');
    expect(screen.getByTestId('cart-tax')).toHaveTextContent('0.00');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0.00');
  });

  it('should add item to cart', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('100.00');
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('5.00'); // 5% tax
      expect(screen.getByTestId('cart-total')).toHaveTextContent('105.00');
    });

    expect(screen.getByTestId('cart-item-test-material-1')).toHaveTextContent('Test Pesticide - Qty: 1 - ₹100');
  });

  it('should update item quantity', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    // Add item first
    fireEvent.click(screen.getByTestId('add-to-cart'));
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });

    // Update quantity
    fireEvent.click(screen.getByTestId('update-quantity'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('300.00');
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('15.00');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('315.00');
    });

    expect(screen.getByTestId('cart-item-test-material-1')).toHaveTextContent('Test Pesticide - Qty: 3 - ₹300');
  });

  it('should remove item from cart', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    // Add item first
    fireEvent.click(screen.getByTestId('add-to-cart'));
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });

    // Remove item
    fireEvent.click(screen.getByTestId('remove-item'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('0.00');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0.00');
    });

    expect(screen.queryByTestId('cart-item-test-material-1')).not.toBeInTheDocument();
  });

  it('should clear entire cart', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    // Add multiple items
    fireEvent.click(screen.getByTestId('add-to-cart'));
    fireEvent.click(screen.getByTestId('add-to-cart'));
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    });

    // Clear cart
    fireEvent.click(screen.getByTestId('clear-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('0.00');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0.00');
    });
  });

  it('should persist cart in localStorage', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });

    // Check if cart is saved in localStorage
    const savedCart = JSON.parse(localStorage.getItem('farmtech_cart'));
    expect(savedCart).toBeTruthy();
    expect(savedCart.items).toHaveLength(1);
    expect(savedCart.items[0].productName).toBe('Test Pesticide');
  });

  it('should load cart from localStorage on mount', () => {
    // Pre-populate localStorage
    const cartData = {
      items: [{
        id: 'test-material-1',
        productId: 'test-material-1',
        productName: 'Test Pesticide',
        quantity: 2,
        unitPrice: 100,
        subtotal: 200
      }],
      subtotal: 200,
      tax: 10,
      totalAmount: 210
    };
    localStorage.setItem('farmtech_cart', JSON.stringify(cartData));

    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('200.00');
    expect(screen.getByTestId('cart-item-test-material-1')).toHaveTextContent('Test Pesticide - Qty: 2 - ₹200');
  });
});

describe('Cart Integration with Materials', () => {
  it('should handle adding same material multiple times', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    // Add same material twice
    fireEvent.click(screen.getByTestId('add-to-cart'));
    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('200.00');
    });

    // Should have only one cart item with quantity 2
    expect(screen.getByTestId('cart-item-test-material-1')).toHaveTextContent('Test Pesticide - Qty: 2 - ₹200');
  });

  it('should calculate tax correctly', async () => {
    render(
      <TestWrapper>
        <TestCartComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      const subtotal = 100;
      const expectedTax = subtotal * 0.05; // 5% tax
      const expectedTotal = subtotal + expectedTax;

      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('100.00');
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('5.00');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('105.00');
    });
  });

  it('should handle zero quantity update as removal', async () => {
    const TestZeroQuantityComponent = () => {
      const { cartItems, addToCart, updateQuantity } = useCart();
      
      const testMaterial = new Material({
        id: 'test-material-1',
        name: { en: 'Test Material' },
        price: 100
      });

      return (
        <div>
          <button onClick={() => addToCart(testMaterial)}>Add</button>
          <button onClick={() => updateQuantity('test-material-1', 0)}>Set Zero</button>
          <div data-testid="items-count">{cartItems.length}</div>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestZeroQuantityComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => {
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByText('Set Zero'));
    await waitFor(() => {
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });
});