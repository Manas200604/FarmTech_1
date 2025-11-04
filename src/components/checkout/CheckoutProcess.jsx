import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import { useCart } from '../../contexts/CartContext';
import { orderStorage } from '../../utils/orderStorage';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Truck, 
  ArrowLeft, 
  CheckCircle,
  Upload,
  QrCode
} from 'lucide-react';

const CheckoutProcess = ({ onBack, onOrderComplete }) => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { cartItems, subtotal, tax, totalAmount, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState('payment'); // payment, verification, confirmation
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [shippingAddress, setShippingAddress] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [paymentVerification, setPaymentVerification] = useState({
    transactionId: '',
    farmerName: userProfile?.name || '',
    screenshot: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: t('payment.upi', 'UPI Payment'),
      icon: Smartphone,
      description: t('payment.upiDesc', 'Pay using UPI apps like PhonePe, GPay, Paytm')
    },
    {
      id: 'card',
      name: t('payment.card', 'Credit/Debit Card'),
      icon: CreditCard,
      description: t('payment.cardDesc', 'Pay using your credit or debit card')
    },
    {
      id: 'cod',
      name: t('payment.cod', 'Cash on Delivery'),
      icon: Truck,
      description: t('payment.codDesc', 'Pay when your order is delivered')
    }
  ];

  const handleAddressChange = React.useCallback((field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProceedToVerification = () => {
    // Validate shipping address
    const requiredFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      toast.error(t('checkout.fillAllFields', 'Please fill all required fields'));
      return;
    }

    if (selectedPaymentMethod === 'cod') {
      // For COD, skip verification and go directly to confirmation
      handleSubmitOrder();
    } else {
      setCurrentStep('verification');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(t('checkout.fileTooLarge', 'File size should be less than 5MB'));
        return;
      }
      setPaymentVerification(prev => ({
        ...prev,
        screenshot: file
      }));
    } else {
      toast.error(t('checkout.invalidFile', 'Please select a valid image file'));
    }
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    
    try {
      // Create order object
      const orderData = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        farmerId: userProfile?.id || userProfile?.uid,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        subtotal,
        tax,
        shipping: 0, // Free shipping for now
        totalAmount,
        status: selectedPaymentMethod === 'cod' ? 'confirmed' : 'payment_submitted',
        paymentMethod: selectedPaymentMethod,
        paymentDetails: selectedPaymentMethod !== 'cod' ? {
          transactionId: paymentVerification.transactionId,
          farmerName: paymentVerification.farmerName,
          screenshotUrl: paymentVerification.screenshot ? URL.createObjectURL(paymentVerification.screenshot) : null,
          submittedAt: new Date()
        } : null,
        shippingAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save order to storage - THIS IS CRITICAL FOR ADMIN TO SEE ORDERS
      const savedOrder = await orderStorage.createOrder(orderData);
      console.log('Order saved successfully:', savedOrder);

      // Clear cart and show success
      clearCart();
      setCurrentStep('confirmation');
      
      // Call parent callback with saved order
      if (onOrderComplete) {
        onOrderComplete(savedOrder);
      }

      toast.success(
        selectedPaymentMethod === 'cod' 
          ? t('checkout.orderConfirmed', 'Order confirmed! We will contact you soon.')
          : t('checkout.orderSubmitted', 'Order submitted! Awaiting payment verification.')
      );

    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(t('checkout.orderFailed', 'Failed to submit order. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = () => {
    if (!paymentVerification.transactionId || !paymentVerification.farmerName) {
      toast.error(t('checkout.fillVerificationFields', 'Please fill all verification fields'));
      return;
    }

    if (selectedPaymentMethod !== 'cod' && !paymentVerification.screenshot) {
      toast.error(t('checkout.uploadScreenshot', 'Please upload payment screenshot'));
      return;
    }

    handleSubmitOrder();
  };

  // Payment Step
  const PaymentStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('checkout.paymentMethod', 'Payment Method')}</h2>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.back', 'Back')}</span>
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">{t('checkout.orderSummary', 'Order Summary')}</h3>
        <div className="space-y-2 text-sm">
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.productName} x {item.quantity}</span>
              <span>₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>{t('checkout.subtotal', 'Subtotal')}:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkout.tax', 'Tax (5%)')}:</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkout.shipping', 'Shipping')}:</span>
              <span className="text-green-600">{t('checkout.free', 'Free')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>{t('checkout.total', 'Total')}:</span>
              <span className="text-primary-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">{t('checkout.shippingAddress', 'Shipping Address')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.fullName', 'Full Name')} *</label>
            <input
              key="shipping-name"
              type="text"
              value={shippingAddress.name || ''}
              onChange={(e) => handleAddressChange('name', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.phone', 'Phone Number')} *</label>
            <input
              key="shipping-phone"
              type="tel"
              value={shippingAddress.phone || ''}
              onChange={(e) => handleAddressChange('phone', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">{t('checkout.address', 'Address')} *</label>
            <textarea
              key="shipping-address"
              value={shippingAddress.address || ''}
              onChange={(e) => handleAddressChange('address', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.city', 'City')} *</label>
            <input
              key="shipping-city"
              type="text"
              value={shippingAddress.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.state', 'State')} *</label>
            <input
              key="shipping-state"
              type="text"
              value={shippingAddress.state || ''}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.pincode', 'Pincode')} *</label>
            <input
              key="shipping-pincode"
              type="text"
              value={shippingAddress.pincode || ''}
              onChange={(e) => handleAddressChange('pincode', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">{t('checkout.selectPaymentMethod', 'Select Payment Method')}</h3>
        <div className="space-y-3">
          {paymentMethods.map(method => {
            const Icon = method.icon;
            return (
              <div
                key={method.id}
                onClick={() => handlePaymentMethodSelect(method.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                  <div className="ml-auto">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleProceedToVerification}
        className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 font-medium"
      >
        {selectedPaymentMethod === 'cod' 
          ? t('checkout.placeOrder', 'Place Order')
          : t('checkout.proceedToPayment', 'Proceed to Payment')
        }
      </button>
    </div>
  );

  // Payment Verification Step
  const VerificationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('checkout.paymentVerification', 'Payment Verification')}</h2>
        <button
          onClick={() => setCurrentStep('payment')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.back', 'Back')}</span>
        </button>
      </div>

      {/* QR Code for UPI */}
      {selectedPaymentMethod === 'upi' && (
        <div className="bg-blue-50 p-6 rounded-lg border text-center">
          <h3 className="text-lg font-semibold mb-4">{t('checkout.scanQR', 'Scan QR Code to Pay')}</h3>
          <div className="bg-white p-4 rounded-lg inline-block border-2 border-dashed border-blue-300">
            <QrCode className="w-48 h-48 mx-auto text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mt-2">UPI ID: manas28prabhu@okaxis</p>
          <p className="text-lg font-bold text-primary-600 mt-2">
            {t('checkout.amount', 'Amount')}: ₹{totalAmount.toFixed(2)}
          </p>
        </div>
      )}

      {/* Card Payment Instructions */}
      {selectedPaymentMethod === 'card' && (
        <div className="bg-yellow-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">{t('checkout.cardPayment', 'Card Payment')}</h3>
          <p className="text-gray-700">
            {t('checkout.cardInstructions', 'Please make the payment using your preferred card payment method and upload the transaction screenshot below.')}
          </p>
          <p className="text-lg font-bold text-primary-600 mt-2">
            {t('checkout.amount', 'Amount')}: ₹{totalAmount.toFixed(2)}
          </p>
        </div>
      )}

      {/* Verification Form */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">{t('checkout.verificationDetails', 'Verification Details')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('checkout.farmerName', 'Farmer Name')} *</label>
            <input
              key="farmer-name"
              type="text"
              value={paymentVerification.farmerName || ''}
              onChange={(e) => setPaymentVerification(prev => ({...prev, farmerName: e.target.value}))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('checkout.transactionId', 'Transaction ID')} *</label>
            <input
              key="transaction-id"
              type="text"
              value={paymentVerification.transactionId || ''}
              onChange={(e) => setPaymentVerification(prev => ({...prev, transactionId: e.target.value}))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={t('checkout.enterTransactionId', 'Enter UPI/Card transaction ID')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('checkout.paymentScreenshot', 'Payment Screenshot')} *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors relative">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{t('checkout.uploadScreenshot', 'Click to upload payment screenshot')}</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
            </div>
            {paymentVerification.screenshot && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {paymentVerification.screenshot.name} uploaded
              </p>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>{t('checkout.note', 'Note')}:</strong> {t('checkout.verificationNote', 'After submitting, our team will manually verify your payment within 24 hours.')}
          </p>
        </div>

        <button
          onClick={handleVerificationSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('checkout.submitting', 'Submitting...')}</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>{t('checkout.submitOrder', 'Submit Order')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Confirmation Step
  const ConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="bg-green-50 p-8 rounded-lg">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('checkout.orderSuccess', 'Order Submitted Successfully!')}
        </h2>
        <p className="text-gray-600">
          {selectedPaymentMethod === 'cod'
            ? t('checkout.codConfirmation', 'Your order has been confirmed. We will contact you soon for delivery.')
            : t('checkout.paymentConfirmation', 'Your payment verification has been submitted. We will verify and process your order within 24 hours.')
          }
        </p>
      </div>

      <div className="bg-white p-6 border rounded-lg">
        <h3 className="font-semibold mb-3">{t('checkout.orderDetails', 'Order Details')}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('checkout.orderTotal', 'Order Total')}:</span>
            <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('checkout.paymentMethod', 'Payment Method')}:</span>
            <span>{paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('checkout.status', 'Status')}:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              selectedPaymentMethod === 'cod' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedPaymentMethod === 'cod' 
                ? t('checkout.confirmed', 'Confirmed')
                : t('checkout.pendingVerification', 'Pending Verification')
              }
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600"
      >
        {t('checkout.continueShopping', 'Continue Shopping')}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {currentStep === 'payment' && <PaymentStep />}
      {currentStep === 'verification' && <VerificationStep />}
      {currentStep === 'confirmation' && <ConfirmationStep />}
    </div>
  );
};

export default CheckoutProcess;