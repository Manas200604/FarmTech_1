import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import { toast } from 'react-hot-toast';
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, X, CreditCard } from 'lucide-react';

const ShoppingCart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onClearCart }) => {
  const { t, currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  const TAX_RATE = 0.05;

  useEffect(() => {
    calculateTotals();
  }, [cartItems]);

  const calculateTotals = () => {
    const subtotalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotalAmount * TAX_RATE;
    const totalAmount = subtotalAmount + taxAmount;

    setSubtotal(subtotalAmount);
    setTax(taxAmount);
    setTotal(totalAmount);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error(t('cartEmpty') || 'Cart is empty');
      return;
    }
    
    const orderData = {
      items: cartItems.map(item => ({
        materialId: item.id,
        materialName: item.getLocalizedName ? item.getLocalizedName(currentLanguage) : item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal,
      tax,
      totalAmount: total,
      farmerId: userProfile?.id
    };

    onCheckout(orderData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <CartIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {t('shoppingCart')} ({cartItems.length})
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('cartEmpty')}</h3>
              <p className="text-gray-600 text-center">{t('browseProducts')}</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-white border rounded-lg">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.getLocalizedName ? item.getLocalizedName(currentLanguage) : item.name}
                    </h4>
                    <p className="text-sm text-gray-600">₹{item.price} per {item.unit}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1 mt-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{t('remove')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t bg-gray-50 p-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('subtotal')}:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('tax')} (5%):</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t('total')}:</span>
                <span className="text-primary-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClearCart}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
{t('clearCart')}
              </button>
              <button
                onClick={handleCheckout}
                className="flex-2 flex items-center justify-center space-x-2 bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600"
              >
                <CreditCard className="h-4 w-4" />
                <span>{t('proceedToCheckout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;