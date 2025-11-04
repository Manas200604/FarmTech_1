import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  CreditCard,
  Package,
  Truck,
  ArrowLeft,
  ShoppingBag,
  Calculator,
  Tag,
  AlertCircle,
  CheckCircle,
  Heart,
  Share2,
  Edit3
} from 'lucide-react';

const MaterialsCart = ({ isOpen, onClose, onCheckout }) => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const { 
    cartItems, 
    itemCount, 
    subtotal, 
    tax, 
    shipping, 
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    setShipping
  } = useCart();

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Delivery options
  const deliveryOptions = [
    {
      id: 'standard',
      name: t('standardDelivery', 'Standard Delivery'),
      description: t('standardDeliveryDesc', '5-7 business days'),
      price: 0,
      icon: Package
    },
    {
      id: 'express',
      name: t('expressDelivery', 'Express Delivery'),
      description: t('expressDeliveryDesc', '2-3 business days'),
      price: 50,
      icon: Truck
    }
  ];

  useEffect(() => {
    const selectedOption = deliveryOptions.find(option => option.id === deliveryOption);
    if (selectedOption) {
      setShipping(selectedOption.price);
    }
  }, [deliveryOption, setShipping]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach(itemId => {
      removeFromCart(itemId);
    });
    setSelectedItems(new Set());
    toast.success(t('selectedItemsRemoved', 'Selected items removed from cart'));
  };

  const handleApplyPromoCode = () => {
    // Simple promo code logic - in real app, this would call an API
    const validCodes = {
      'FARMER10': 0.1,
      'NEWUSER': 0.05,
      'BULK20': 0.2
    };

    if (validCodes[promoCode.toUpperCase()]) {
      const discountPercent = validCodes[promoCode.toUpperCase()];
      setDiscount(subtotal * discountPercent);
      toast.success(t('promoCodeApplied', `Promo code applied! ${discountPercent * 100}% discount`));
    } else {
      toast.error(t('invalidPromoCode', 'Invalid promo code'));
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error(t('cartEmpty', 'Cart is empty'));
      return;
    }

    const orderData = {
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      subtotal,
      tax,
      shipping,
      discount,
      totalAmount: totalAmount - discount,
      deliveryOption,
      promoCode,
      farmerId: userProfile?.id
    };

    onCheckout(orderData);
  };

  const finalTotal = totalAmount - discount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('materialsCart', 'Materials Cart')}
              </h2>
              <p className="text-sm text-gray-600">
                {itemCount} {t('itemsInCart', 'items in your cart')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Cart Items Section */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <ShoppingBag className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('cartEmpty', 'Your cart is empty')}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {t('cartEmptyDesc', 'Add some materials to get started with your order')}
                </p>
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('continueShopping', 'Continue Shopping')}</span>
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Cart Controls */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('selectAll', 'Select All')} ({cartItems.length})
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedItems.size > 0 && (
                      <button
                        onClick={handleRemoveSelected}
                        className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm">{t('removeSelected', 'Remove Selected')}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={clearCart}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span className="text-sm">{t('clearCart', 'Clear All')}</span>
                    </button>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-xl transition-all hover:shadow-md ${
                        selectedItems.has(item.id) ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Selection Checkbox */}
                        <label className="flex items-center mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </label>

                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.productName} 
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                {item.productName}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center space-x-1">
                                  <Tag className="h-4 w-4" />
                                  <span>{item.category}</span>
                                </span>
                                <span>₹{item.unitPrice} per {item.unit}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Quantity Controls and Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">{t('quantity', 'Quantity')}:</span>
                              <div className="flex items-center border rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-l-lg transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 text-center border-0 focus:ring-0 py-2"
                                  min="1"
                                />
                                
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-r-lg transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xl font-bold text-primary-600">
                                ₹{item.subtotal.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} × ₹{item.unitPrice}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {cartItems.length > 0 && (
            <div className="w-96 border-l bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>{t('orderSummary', 'Order Summary')}</span>
                </h3>

                {/* Delivery Options */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{t('deliveryOptions', 'Delivery Options')}</h4>
                  <div className="space-y-2">
                    {deliveryOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            deliveryOption === option.id 
                              ? 'border-primary-300 bg-primary-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            value={option.id}
                            checked={deliveryOption === option.id}
                            onChange={(e) => setDeliveryOption(e.target.value)}
                            className="sr-only"
                          />
                          <Icon className="h-5 w-5 text-gray-600 mr-3" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{option.name}</div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {option.price === 0 ? t('free', 'Free') : `₹${option.price}`}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{t('promoCode', 'Promo Code')}</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder={t('enterPromoCode', 'Enter promo code')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t('apply', 'Apply')}
                    </button>
                  </div>
                  {discount > 0 && (
                    <div className="mt-2 flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">{t('discountApplied', 'Discount applied!')}</span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 p-4 bg-white rounded-lg border">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('subtotal', 'Subtotal')} ({itemCount} items):</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('tax', 'Tax')} (5%):</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('shipping', 'Shipping')}:</span>
                    <span className="font-medium">
                      {shipping === 0 ? t('free', 'Free') : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('discount', 'Discount')}:</span>
                      <span className="font-medium">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">{t('total', 'Total')}:</span>
                      <span className="text-primary-600">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-4 rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>{t('proceedToCheckout', 'Proceed to Checkout')}</span>
                </button>

                {/* Security Notice */}
                <div className="mt-4 flex items-start space-x-2 text-xs text-gray-500">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {t('secureCheckout', 'Your payment information is secure and encrypted')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsCart;