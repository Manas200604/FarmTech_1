/**
 * Order Model
 * Represents customer orders with payment verification
 */

export class Order {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.farmerId = data.farmerId || '';
        this.items = data.items || [];
        this.totalAmount = data.totalAmount || 0;
        this.status = data.status || 'pending';
        this.paymentDetails = data.paymentDetails || {
            transactionId: '',
            farmerName: '',
            screenshotUrl: '',
            submittedAt: null,
            verifiedAt: null,
            verifiedBy: ''
        };
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.notes = data.notes || '';
    }

    generateId() {
        return 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    // Order status constants
    static STATUS = {
        PENDING: 'pending',
        PAYMENT_SUBMITTED: 'payment_submitted',
        VERIFIED: 'verified',
        REJECTED: 'rejected',
        PROCESSING: 'processing',
        SHIPPED: 'shipped',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed'
    };

    // Add item to order
    addItem(materialId, quantity, unitPrice, materialName = '') {
        const existingItem = this.items.find(item => item.materialId === materialId);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
        } else {
            this.items.push({
                materialId,
                materialName,
                quantity,
                unitPrice,
                subtotal: quantity * unitPrice
            });
        }

        this.calculateTotal();
        this.updatedAt = new Date();
    }

    // Remove item from order
    removeItem(materialId) {
        this.items = this.items.filter(item => item.materialId !== materialId);
        this.calculateTotal();
        this.updatedAt = new Date();
    }

    // Update item quantity
    updateItemQuantity(materialId, quantity) {
        const item = this.items.find(item => item.materialId === materialId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(materialId);
            } else {
                item.quantity = quantity;
                item.subtotal = item.quantity * item.unitPrice;
                this.calculateTotal();
                this.updatedAt = new Date();
            }
        }
    }

    // Calculate total amount
    calculateTotal() {
        this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
        return this.totalAmount;
    }

    // Submit payment details
    submitPayment(transactionId, farmerName, screenshotUrl) {
        this.paymentDetails = {
            transactionId,
            farmerName,
            screenshotUrl,
            submittedAt: new Date(),
            verifiedAt: null,
            verifiedBy: ''
        };
        this.status = Order.STATUS.PAYMENT_SUBMITTED;
        this.updatedAt = new Date();
    }

    // Verify payment (admin action)
    verifyPayment(verifiedBy, approved = true) {
        this.paymentDetails.verifiedAt = new Date();
        this.paymentDetails.verifiedBy = verifiedBy;
        this.status = approved ? Order.STATUS.VERIFIED : Order.STATUS.REJECTED;
        this.updatedAt = new Date();
    }

    // Update order status
    updateStatus(newStatus, notes = '') {
        if (Object.values(Order.STATUS).includes(newStatus)) {
            this.status = newStatus;
            if (notes) {
                this.notes = notes;
            }
            this.updatedAt = new Date();
        }
    }

    // Check if order can be cancelled
    canBeCancelled() {
        return [Order.STATUS.PENDING, Order.STATUS.PAYMENT_SUBMITTED].includes(this.status);
    }

    // Cancel order
    cancel(reason = '') {
        if (this.canBeCancelled()) {
            this.status = Order.STATUS.CANCELLED;
            this.notes = reason;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Get order summary
    getSummary() {
        return {
            id: this.id,
            itemCount: this.items.length,
            totalAmount: this.totalAmount,
            status: this.status,
            createdAt: this.createdAt,
            hasPaymentDetails: !!this.paymentDetails.transactionId
        };
    }

    // Get status display text
    getStatusText(language = 'en') {
        const statusTexts = {
            en: {
                [Order.STATUS.PENDING]: 'Pending',
                [Order.STATUS.PAYMENT_SUBMITTED]: 'Payment Submitted',
                [Order.STATUS.VERIFIED]: 'Payment Verified',
                [Order.STATUS.REJECTED]: 'Payment Rejected',
                [Order.STATUS.PROCESSING]: 'Processing',
                [Order.STATUS.SHIPPED]: 'Shipped',
                [Order.STATUS.DELIVERED]: 'Delivered',
                [Order.STATUS.CANCELLED]: 'Cancelled',
                [Order.STATUS.COMPLETED]: 'Completed'
            },
            hi: {
                [Order.STATUS.PENDING]: 'लंबित',
                [Order.STATUS.PAYMENT_SUBMITTED]: 'भुगतान जमा किया गया',
                [Order.STATUS.VERIFIED]: 'भुगतान सत्यापित',
                [Order.STATUS.REJECTED]: 'भुगतान अस्वीकृत',
                [Order.STATUS.PROCESSING]: 'प्रसंस्करण',
                [Order.STATUS.SHIPPED]: 'भेजा गया',
                [Order.STATUS.DELIVERED]: 'वितरित',
                [Order.STATUS.CANCELLED]: 'रद्द',
                [Order.STATUS.COMPLETED]: 'पूर्ण'
            },
            mr: {
                [Order.STATUS.PENDING]: 'प्रलंबित',
                [Order.STATUS.PAYMENT_SUBMITTED]: 'पेमेंट सबमिट केले',
                [Order.STATUS.VERIFIED]: 'पेमेंट पडताळले',
                [Order.STATUS.REJECTED]: 'पेमेंट नाकारले',
                [Order.STATUS.PROCESSING]: 'प्रक्रिया',
                [Order.STATUS.SHIPPED]: 'पाठवले',
                [Order.STATUS.DELIVERED]: 'वितरित',
                [Order.STATUS.CANCELLED]: 'रद्द',
                [Order.STATUS.COMPLETED]: 'पूर्ण'
            }
        };

        return statusTexts[language]?.[this.status] || statusTexts.en[this.status] || this.status;
    }

    // Convert to plain object for storage
    toJSON() {
        return {
            id: this.id,
            farmerId: this.farmerId,
            items: this.items,
            totalAmount: this.totalAmount,
            status: this.status,
            paymentDetails: this.paymentDetails,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            notes: this.notes
        };
    }

    // Create from plain object
    static fromJSON(data) {
        return new Order(data);
    }

    // Validate order data
    validate() {
        const errors = [];

        if (!this.farmerId) {
            errors.push('Farmer ID is required');
        }

        if (!this.items || this.items.length === 0) {
            errors.push('Order must have at least one item');
        }

        if (this.totalAmount <= 0) {
            errors.push('Order total must be greater than zero');
        }

        // Validate items
        this.items.forEach((item, index) => {
            if (!item.materialId) {
                errors.push(`Item ${index + 1}: Material ID is required`);
            }
            if (item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be greater than zero`);
            }
            if (item.unitPrice < 0) {
                errors.push(`Item ${index + 1}: Unit price cannot be negative`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default Order;