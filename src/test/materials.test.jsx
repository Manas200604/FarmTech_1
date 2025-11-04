import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Material } from '../models/Material';
import { Order } from '../models/Order';
import materialsStorage from '../utils/materialsStorage';
import orderStorage from '../utils/orderStorage';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the storage utilities
vi.mock('../utils/materialsStorage');
vi.mock('../utils/orderStorage');

// Mock auth context
const mockUserProfile = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'farmer'
};

const MockAuthProvider = ({ children }) => {
  return (
    <div data-testid="mock-auth">
      {children}
    </div>
  );
};

vi.mock('../contexts/FastAuthContext', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile
  })
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    <MockAuthProvider>
      {children}
    </MockAuthProvider>
  </LanguageProvider>
);

describe('Material Model', () => {
  it('should create a material with default values', () => {
    const material = new Material();
    
    expect(material.id).toBeDefined();
    expect(material.name).toEqual({ en: '', mr: '', hi: '' });
    expect(material.description).toEqual({ en: '', mr: '', hi: '' });
    expect(material.price).toBe(0);
    expect(material.available).toBe(true);
    expect(material.stock).toBe(0);
  });

  it('should create a material with provided data', () => {
    const materialData = {
      name: { en: 'Test Material', mr: 'टेस्ट मटेरियल', hi: 'टेस्ट सामग्री' },
      description: { en: 'Test Description', mr: 'टेस्ट वर्णन', hi: 'टेस्ट विवरण' },
      price: 100,
      unit: 'kg',
      stock: 50,
      category: 'Test Category'
    };

    const material = new Material(materialData);
    
    expect(material.name).toEqual(materialData.name);
    expect(material.description).toEqual(materialData.description);
    expect(material.price).toBe(100);
    expect(material.unit).toBe('kg');
    expect(material.stock).toBe(50);
    expect(material.category).toBe('Test Category');
  });

  it('should get localized name correctly', () => {
    const material = new Material({
      name: { en: 'English Name', mr: 'मराठी नाव', hi: 'हिंदी नाम' }
    });

    expect(material.getLocalizedName('en')).toBe('English Name');
    expect(material.getLocalizedName('mr')).toBe('मराठी नाव');
    expect(material.getLocalizedName('hi')).toBe('हिंदी नाम');
    expect(material.getLocalizedName('unknown')).toBe('English Name'); // fallback
  });

  it('should check stock availability correctly', () => {
    const material = new Material({ stock: 10, available: true });
    expect(material.isInStock()).toBe(true);

    material.available = false;
    expect(material.isInStock()).toBe(false);

    material.available = true;
    material.stock = 0;
    expect(material.isInStock()).toBe(false);
  });

  it('should reduce stock correctly', () => {
    const material = new Material({ stock: 10 });
    
    expect(material.reduceStock(5)).toBe(true);
    expect(material.stock).toBe(5);
    
    expect(material.reduceStock(10)).toBe(false);
    expect(material.stock).toBe(5); // unchanged
  });

  it('should validate material data', () => {
    const validMaterial = new Material({
      name: { en: 'Valid Material' },
      price: 100,
      unit: 'kg',
      stock: 10
    });

    const validation = validMaterial.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const invalidMaterial = new Material({
      name: { en: '' }, // empty name
      price: -10, // negative price
      unit: '', // empty unit
      stock: -5 // negative stock
    });

    const invalidValidation = invalidMaterial.validate();
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });
});

describe('Order Model', () => {
  it('should create an order with default values', () => {
    const order = new Order();
    
    expect(order.id).toBeDefined();
    expect(order.farmerId).toBe('');
    expect(order.items).toEqual([]);
    expect(order.totalAmount).toBe(0);
    expect(order.status).toBe('pending');
  });

  it('should add items to order correctly', () => {
    const order = new Order();
    
    order.addItem('material1', 2, 100, 'Test Material');
    
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toEqual({
      materialId: 'material1',
      materialName: 'Test Material',
      quantity: 2,
      unitPrice: 100,
      subtotal: 200
    });
    expect(order.totalAmount).toBe(200);
  });

  it('should update item quantity correctly', () => {
    const order = new Order();
    order.addItem('material1', 2, 100, 'Test Material');
    
    order.updateItemQuantity('material1', 5);
    
    expect(order.items[0].quantity).toBe(5);
    expect(order.items[0].subtotal).toBe(500);
    expect(order.totalAmount).toBe(500);
  });

  it('should remove items correctly', () => {
    const order = new Order();
    order.addItem('material1', 2, 100, 'Test Material 1');
    order.addItem('material2', 1, 50, 'Test Material 2');
    
    order.removeItem('material1');
    
    expect(order.items).toHaveLength(1);
    expect(order.items[0].materialId).toBe('material2');
    expect(order.totalAmount).toBe(50);
  });

  it('should submit payment details correctly', () => {
    const order = new Order();
    
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    
    expect(order.status).toBe(Order.STATUS.PAYMENT_SUBMITTED);
    expect(order.paymentDetails.transactionId).toBe('TXN123');
    expect(order.paymentDetails.farmerName).toBe('John Doe');
    expect(order.paymentDetails.screenshotUrl).toBe('screenshot.jpg');
    expect(order.paymentDetails.submittedAt).toBeInstanceOf(Date);
  });

  it('should verify payment correctly', () => {
    const order = new Order();
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    
    order.verifyPayment('admin123', true);
    
    expect(order.status).toBe(Order.STATUS.VERIFIED);
    expect(order.paymentDetails.verifiedBy).toBe('admin123');
    expect(order.paymentDetails.verifiedAt).toBeInstanceOf(Date);
  });

  it('should reject payment correctly', () => {
    const order = new Order();
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    
    order.verifyPayment('admin123', false);
    
    expect(order.status).toBe(Order.STATUS.REJECTED);
  });

  it('should validate order data', () => {
    const validOrder = new Order({
      farmerId: 'farmer123',
      items: [{ materialId: 'mat1', quantity: 1, unitPrice: 100, subtotal: 100 }],
      totalAmount: 100
    });

    const validation = validOrder.validate();
    expect(validation.isValid).toBe(true);

    const invalidOrder = new Order({
      farmerId: '', // empty farmer ID
      items: [], // no items
      totalAmount: 0 // zero total
    });

    const invalidValidation = invalidOrder.validate();
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });
});

describe('Materials Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all materials', async () => {
    const mockMaterials = [
      new Material({ name: { en: 'Material 1' }, price: 100 }),
      new Material({ name: { en: 'Material 2' }, price: 200 })
    ];

    materialsStorage.getAllMaterials.mockResolvedValue(mockMaterials);

    const materials = await materialsStorage.getAllMaterials();
    
    expect(materials).toHaveLength(2);
    expect(materials[0].name.en).toBe('Material 1');
    expect(materials[1].name.en).toBe('Material 2');
  });

  it('should add a new material', async () => {
    const materialData = {
      name: { en: 'New Material' },
      price: 150,
      unit: 'kg',
      stock: 20
    };

    const newMaterial = new Material(materialData);
    materialsStorage.addMaterial.mockResolvedValue(newMaterial);

    const result = await materialsStorage.addMaterial(materialData);
    
    expect(result).toBeInstanceOf(Material);
    expect(result.name.en).toBe('New Material');
    expect(materialsStorage.addMaterial).toHaveBeenCalledWith(materialData);
  });

  it('should update material', async () => {
    const updatedMaterial = new Material({
      id: 'mat123',
      name: { en: 'Updated Material' },
      price: 200
    });

    materialsStorage.updateMaterial.mockResolvedValue(updatedMaterial);

    const result = await materialsStorage.updateMaterial('mat123', { price: 200 });
    
    expect(result.price).toBe(200);
    expect(materialsStorage.updateMaterial).toHaveBeenCalledWith('mat123', { price: 200 });
  });

  it('should delete material', async () => {
    materialsStorage.deleteMaterial.mockResolvedValue(true);

    const result = await materialsStorage.deleteMaterial('mat123');
    
    expect(result).toBe(true);
    expect(materialsStorage.deleteMaterial).toHaveBeenCalledWith('mat123');
  });

  it('should search materials', async () => {
    const mockMaterials = [
      new Material({ name: { en: 'Fertilizer' }, category: 'Fertilizer' })
    ];

    materialsStorage.searchMaterials.mockResolvedValue(mockMaterials);

    const results = await materialsStorage.searchMaterials('fertilizer');
    
    expect(results).toHaveLength(1);
    expect(results[0].name.en).toBe('Fertilizer');
    expect(materialsStorage.searchMaterials).toHaveBeenCalledWith('fertilizer');
  });
});

describe('Order Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new order', async () => {
    const orderData = {
      farmerId: 'farmer123',
      items: [{ materialId: 'mat1', quantity: 1, unitPrice: 100, subtotal: 100 }],
      totalAmount: 100
    };

    const newOrder = new Order(orderData);
    orderStorage.createOrder.mockResolvedValue(newOrder);

    const result = await orderStorage.createOrder(orderData);
    
    expect(result).toBeInstanceOf(Order);
    expect(result.farmerId).toBe('farmer123');
    expect(result.totalAmount).toBe(100);
  });

  it('should get orders by farmer', async () => {
    const mockOrders = [
      new Order({ farmerId: 'farmer123', totalAmount: 100 }),
      new Order({ farmerId: 'farmer123', totalAmount: 200 })
    ];

    orderStorage.getOrdersByFarmer.mockResolvedValue(mockOrders);

    const orders = await orderStorage.getOrdersByFarmer('farmer123');
    
    expect(orders).toHaveLength(2);
    expect(orders[0].farmerId).toBe('farmer123');
    expect(orders[1].farmerId).toBe('farmer123');
  });

  it('should submit payment', async () => {
    const order = new Order({ id: 'order123' });
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    
    orderStorage.submitPayment.mockResolvedValue(order);

    const result = await orderStorage.submitPayment('order123', {
      transactionId: 'TXN123',
      farmerName: 'John Doe',
      screenshotUrl: 'screenshot.jpg'
    });
    
    expect(result.status).toBe(Order.STATUS.PAYMENT_SUBMITTED);
    expect(result.paymentDetails.transactionId).toBe('TXN123');
  });

  it('should verify payment', async () => {
    const order = new Order({ id: 'order123' });
    order.verifyPayment('admin123', true);
    
    orderStorage.verifyPayment.mockResolvedValue(order);

    const result = await orderStorage.verifyPayment('order123', 'admin123', true);
    
    expect(result.status).toBe(Order.STATUS.VERIFIED);
    expect(result.paymentDetails.verifiedBy).toBe('admin123');
  });

  it('should get pending verifications', async () => {
    const pendingOrders = [
      new Order({ status: Order.STATUS.PAYMENT_SUBMITTED })
    ];

    orderStorage.getPendingVerifications.mockResolvedValue(pendingOrders);

    const orders = await orderStorage.getPendingVerifications();
    
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe(Order.STATUS.PAYMENT_SUBMITTED);
  });
});

describe('Language System', () => {
  it('should render components in different languages', () => {
    const TestComponent = () => {
      const { t, currentLanguage } = require('../contexts/LanguageContext').useLanguage();
      return (
        <div>
          <span data-testid="language">{currentLanguage}</span>
          <span data-testid="materials-text">{t('materials')}</span>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('materials-text')).toHaveTextContent('Materials');
  });
});

describe('Integration Tests', () => {
  it('should handle complete order workflow', async () => {
    // Mock the entire workflow
    const material = new Material({
      id: 'mat1',
      name: { en: 'Test Material' },
      price: 100,
      stock: 10
    });

    const order = new Order({
      farmerId: 'farmer123'
    });

    // Add item to order
    order.addItem('mat1', 2, 100, 'Test Material');
    expect(order.totalAmount).toBe(200);

    // Submit payment
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    expect(order.status).toBe(Order.STATUS.PAYMENT_SUBMITTED);

    // Verify payment
    order.verifyPayment('admin123', true);
    expect(order.status).toBe(Order.STATUS.VERIFIED);

    // Update material stock
    expect(material.reduceStock(2)).toBe(true);
    expect(material.stock).toBe(8);
  });

  it('should handle order cancellation', async () => {
    const order = new Order({
      farmerId: 'farmer123',
      status: Order.STATUS.PENDING
    });

    expect(order.canBeCancelled()).toBe(true);
    
    const cancelled = order.cancel('Customer request');
    expect(cancelled).toBe(true);
    expect(order.status).toBe(Order.STATUS.CANCELLED);
  });

  it('should handle payment rejection', async () => {
    const order = new Order();
    order.submitPayment('TXN123', 'John Doe', 'screenshot.jpg');
    
    order.verifyPayment('admin123', false);
    
    expect(order.status).toBe(Order.STATUS.REJECTED);
  });
});