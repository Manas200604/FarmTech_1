/**
 * Payment Submission Model
 * Represents payment submissions from farmers for order verification
 */

export class PaymentSubmission {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.orderId = data.orderId || '';
    this.farmerId = data.farmerId || '';
    this.farmerName = data.farmerName || '';
    this.phoneNumber = data.phoneNumber || '';
    this.transactionId = data.transactionId || '';
    this.paymentMethod = data.paymentMethod || 'upi'; // 'upi', 'bank_transfer', 'cash'
    this.amount = data.amount || 0;
    this.screenshotUrl = data.screenshotUrl || '';
    this.status = data.status || 'pending'; // 'pending', 'approved', 'rejected'
    this.submittedAt = data.submittedAt || new Date();
    this.reviewedAt = data.reviewedAt || null;
    this.reviewedBy = data.reviewedBy || '';
    this.adminNotes = data.adminNotes || '';
    this.rejectionReason = data.rejectionReason || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'payment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Payment status constants
  static STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    UNDER_REVIEW: 'under_review'
  };

  // Payment method constants
  static PAYMENT_METHODS = {
    UPI: 'upi',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    CARD: 'card'
  };

  // Update payment status
  updateStatus(newStatus, reviewedBy = '', notes = '') {
    if (Object.values(PaymentSubmission.STATUS).includes(newStatus)) {
      this.status = newStatus;
      this.reviewedAt = new Date();
      this.reviewedBy = reviewedBy;
      this.adminNotes = notes;
      this.updatedAt = new Date();
    }
  }

  // Approve payment
  approve(reviewedBy, notes = '') {
    this.updateStatus(PaymentSubmission.STATUS.APPROVED, reviewedBy, notes);
  }

  // Reject payment
  reject(reviewedBy, reason = '', notes = '') {
    this.updateStatus(PaymentSubmission.STATUS.REJECTED, reviewedBy, notes);
    this.rejectionReason = reason;
  }

  // Check if payment is pending
  isPending() {
    return this.status === PaymentSubmission.STATUS.PENDING;
  }

  // Check if payment is approved
  isApproved() {
    return this.status === PaymentSubmission.STATUS.APPROVED;
  }

  // Check if payment is rejected
  isRejected() {
    return this.status === PaymentSubmission.STATUS.REJECTED;
  }

  // Get status display text
  getStatusText(language = 'en') {
    const statusTexts = {
      en: {
        [PaymentSubmission.STATUS.PENDING]: 'Pending Review',
        [PaymentSubmission.STATUS.APPROVED]: 'Approved',
        [PaymentSubmission.STATUS.REJECTED]: 'Rejected',
        [PaymentSubmission.STATUS.UNDER_REVIEW]: 'Under Review'
      },
      hi: {
        [PaymentSubmission.STATUS.PENDING]: 'समीक्षा लंबित',
        [PaymentSubmission.STATUS.APPROVED]: 'स्वीकृत',
        [PaymentSubmission.STATUS.REJECTED]: 'अस्वीकृत',
        [PaymentSubmission.STATUS.UNDER_REVIEW]: 'समीक्षाधीन'
      },
      mr: {
        [PaymentSubmission.STATUS.PENDING]: 'पुनरावलोकन प्रलंबित',
        [PaymentSubmission.STATUS.APPROVED]: 'मंजूर',
        [PaymentSubmission.STATUS.REJECTED]: 'नाकारले',
        [PaymentSubmission.STATUS.UNDER_REVIEW]: 'पुनरावलोकनाधीन'
      }
    };

    return statusTexts[language]?.[this.status] || statusTexts.en[this.status] || this.status;
  }

  // Get payment method display text
  getPaymentMethodText(language = 'en') {
    const methodTexts = {
      en: {
        [PaymentSubmission.PAYMENT_METHODS.UPI]: 'UPI Payment',
        [PaymentSubmission.PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
        [PaymentSubmission.PAYMENT_METHODS.CASH]: 'Cash Payment',
        [PaymentSubmission.PAYMENT_METHODS.CARD]: 'Card Payment'
      },
      hi: {
        [PaymentSubmission.PAYMENT_METHODS.UPI]: 'UPI भुगतान',
        [PaymentSubmission.PAYMENT_METHODS.BANK_TRANSFER]: 'बैंक ट्रांसफर',
        [PaymentSubmission.PAYMENT_METHODS.CASH]: 'नकद भुगतान',
        [PaymentSubmission.PAYMENT_METHODS.CARD]: 'कार्ड भुगतान'
      },
      mr: {
        [PaymentSubmission.PAYMENT_METHODS.UPI]: 'UPI पेमेंट',
        [PaymentSubmission.PAYMENT_METHODS.BANK_TRANSFER]: 'बँक ट्रान्सफर',
        [PaymentSubmission.PAYMENT_METHODS.CASH]: 'रोख पेमेंट',
        [PaymentSubmission.PAYMENT_METHODS.CARD]: 'कार्ड पेमेंट'
      }
    };

    return methodTexts[language]?.[this.paymentMethod] || methodTexts.en[this.paymentMethod] || this.paymentMethod;
  }

  // Get submission summary
  getSummary() {
    return {
      id: this.id,
      orderId: this.orderId,
      farmerName: this.farmerName,
      amount: this.amount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      submittedAt: this.submittedAt,
      hasScreenshot: !!this.screenshotUrl
    };
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      farmerId: this.farmerId,
      farmerName: this.farmerName,
      phoneNumber: this.phoneNumber,
      transactionId: this.transactionId,
      paymentMethod: this.paymentMethod,
      amount: this.amount,
      screenshotUrl: this.screenshotUrl,
      status: this.status,
      submittedAt: this.submittedAt,
      reviewedAt: this.reviewedAt,
      reviewedBy: this.reviewedBy,
      adminNotes: this.adminNotes,
      rejectionReason: this.rejectionReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new PaymentSubmission(data);
  }

  // Validate payment submission data
  validate() {
    const errors = [];

    if (!this.orderId) {
      errors.push('Order ID is required');
    }

    if (!this.farmerId) {
      errors.push('Farmer ID is required');
    }

    if (!this.farmerName || this.farmerName.trim().length < 2) {
      errors.push('Farmer name is required and must be at least 2 characters');
    }

    if (!this.transactionId || this.transactionId.trim().length < 5) {
      errors.push('Transaction ID is required and must be at least 5 characters');
    }

    if (this.amount <= 0) {
      errors.push('Amount must be greater than zero');
    }

    if (!Object.values(PaymentSubmission.PAYMENT_METHODS).includes(this.paymentMethod)) {
      errors.push('Invalid payment method');
    }

    if (this.phoneNumber && !/^\+?[\d\s\-\(\)]{10,15}$/.test(this.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PaymentSubmission;