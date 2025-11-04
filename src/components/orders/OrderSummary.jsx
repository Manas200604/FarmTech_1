import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/FastAuthContext';
import { toast } from 'react-hot-toast';
import { FileText, Download, CreditCard, QrCode, Copy, Check } from 'lucide-react';

const OrderSummary = ({ orderData, onConfirmOrder, onBack }) => {
    const { t, currentLanguage } = useLanguage();
    const { userProfile } = useAuth();
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [copied, setCopied] = useState(false);

    const upiId = 'manas28prabhu@okaxis';
    const qrCodeUrl = `upi://pay?pa=${upiId}&pn=FarmTech&am=${orderData.totalAmount}&cu=INR`;

    const generateOrderNumber = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    };

    const handleConfirmOrder = async () => {
        try {
            const newOrderNumber = generateOrderNumber();
            const completeOrderData = {
                ...orderData,
                orderNumber: newOrderNumber,
                status: 'pending',
                createdAt: new Date(),
                farmerId: userProfile?.id
            };

            await onConfirmOrder(completeOrderData);
            setOrderNumber(newOrderNumber);
            setOrderConfirmed(true);
            toast.success(t('orderPlaced') || 'Order placed successfully!');
        } catch (error) {
            console.error('Error confirming order:', error);
            toast.error('Failed to place order');
        }
    };

    const copyUpiId = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        toast.success('UPI ID copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadBill = () => {
        const billContent = generateBillContent();
        const blob = new Blob([billContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateBillContent = () => {
        return `
FARMTECH MATERIALS ORDER BILL
================================

Order Number: ${orderNumber}
Date: ${new Date().toLocaleDateString()}
Customer: ${userProfile?.name || 'N/A'}

ITEMS:
${orderData.items.map(item =>
            `${item.materialName} x ${item.quantity} @ ₹${item.unitPrice} = ₹${item.subtotal}`
        ).join('\n')}

SUMMARY:
Subtotal: ₹${orderData.subtotal.toFixed(2)}
Tax (5%): ₹${orderData.tax.toFixed(2)}
Total: ₹${orderData.totalAmount.toFixed(2)}

PAYMENT INSTRUCTIONS:
UPI ID: ${upiId}
Amount: ₹${orderData.totalAmount.toFixed(2)}

Please complete payment and submit verification details.
    `;
    };

    if (!orderConfirmed) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                            <FileText className="h-6 w-6 text-primary-600" />
                            <span>Order Summary</span>
                        </h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Customer Info */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p><strong>Name:</strong> {userProfile?.name || 'N/A'}</p>
                                <p><strong>Email:</strong> {userProfile?.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {userProfile?.phone || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                            <div className="space-y-2">
                                {orderData.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                            <span className="font-medium">{item.materialName}</span>
                                            <span className="text-gray-600 ml-2">x {item.quantity}</span>
                                        </div>
                                        <span className="font-semibold">₹{item.subtotal.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="border-t pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{orderData.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (5%):</span>
                                    <span>₹{orderData.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span className="text-primary-600">₹{orderData.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4">
                            <button
                                onClick={onBack}
                                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Back to Cart
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                className="flex-2 flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600"
                            >
                                <CreditCard className="h-5 w-5" />
                                <span>Confirm Order</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6 border-b bg-green-50">
                    <div className="flex items-center space-x-2 text-green-800">
                        <Check className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">Order Confirmed!</h2>
                    </div>
                    <p className="text-green-700 mt-2">Order Number: <strong>{orderNumber}</strong></p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Payment Instructions */}
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                            <QrCode className="h-5 w-5 text-blue-600" />
                            <span>Payment Instructions</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">1. Pay using UPI:</p>
                                <div className="flex items-center space-x-2 bg-white p-3 rounded border">
                                    <span className="font-mono text-sm flex-1">{upiId}</span>
                                    <button
                                        onClick={copyUpiId}
                                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-2">2. Amount to pay:</p>
                                <div className="bg-white p-3 rounded border">
                                    <span className="text-2xl font-bold text-primary-600">₹{orderData.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-2">3. QR Code for payment:</p>
                                <div className="bg-white p-4 rounded border text-center">
                                    <div className="w-48 h-48 mx-auto bg-white rounded border-2 border-dashed border-blue-300 flex items-center justify-center">
                                        <div className="text-center">
                                            <QrCode className="h-32 w-32 text-gray-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Scan to Pay</p>
                                            <p className="text-xs text-gray-500">UPI: {upiId}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Scan with any UPI app like PhonePe, Paytm, GPay</p>
                                </div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded border border-orange-200">
                                <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                                    📋 Manual Verification Required
                                </h4>
                                <div className="text-sm text-orange-800 space-y-2">
                                    <p><strong>After completing payment:</strong></p>
                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                        <li>Take a screenshot of successful payment</li>
                                        <li>Note your transaction ID</li>
                                        <li>Fill verification form with your name</li>
                                        <li>Upload payment screenshot</li>
                                        <li>Submit for manual verification</li>
                                    </ol>
                                    <p className="mt-2 font-medium">⏱️ Verification usually takes 2-24 hours</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            {orderData.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{item.materialName} x {item.quantity}</span>
                                    <span>₹{item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>₹{orderData.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <button
                            onClick={downloadBill}
                            className="flex-1 flex items-center justify-center space-x-2 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Bill</span>
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;