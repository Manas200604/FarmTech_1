/**
 * Payment Verification Storage Utilities
 * Handles storage and retrieval of payment verification submissions
 */

const PAYMENT_STORAGE_KEY = 'farmtech_payment_submissions';

class PaymentStorage {
  constructor() {
    this.submissions = this.loadSubmissions();
  }

  // Load all payment submissions from localStorage
  loadSubmissions() {
    try {
      const stored = localStorage.getItem(PAYMENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading payment submissions:', error);
      return [];
    }
  }

  // Save submissions to localStorage
  saveSubmissions() {
    try {
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(this.submissions));
      return true;
    } catch (error) {
      console.error('Error saving payment submissions:', error);
      return false;
    }
  }

  // Add new payment submission
  addSubmission(submissionData) {
    const submission = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      fullName: submissionData.fullName,
      phoneNumber: submissionData.phoneNumber,
      transactionId: submissionData.transactionId,
      paymentScreenshot: submissionData.paymentScreenshot, // base64 encoded image
      orderDetails: submissionData.orderDetails,
      totalAmount: submissionData.totalAmount,
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      reviewedAt: null,
      reviewedBy: null,
      notes: ''
    };

    this.submissions.unshift(submission); // Add to beginning of array
    this.saveSubmissions();
    return submission;
  }

  // Get all submissions
  getAllSubmissions() {
    return [...this.submissions];
  }

  // Get submission by ID
  getSubmissionById(id) {
    return this.submissions.find(submission => submission.id === id);
  }

  // Update submission status (for admin)
  updateSubmissionStatus(id, status, reviewedBy, notes = '') {
    const submissionIndex = this.submissions.findIndex(submission => submission.id === id);
    if (submissionIndex === -1) {
      throw new Error('Submission not found');
    }

    this.submissions[submissionIndex] = {
      ...this.submissions[submissionIndex],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      notes
    };

    this.saveSubmissions();
    return this.submissions[submissionIndex];
  }

  // Get submissions by status
  getSubmissionsByStatus(status) {
    return this.submissions.filter(submission => submission.status === status);
  }

  // Delete submission
  deleteSubmission(id) {
    const initialLength = this.submissions.length;
    this.submissions = this.submissions.filter(submission => submission.id !== id);
    
    if (this.submissions.length < initialLength) {
      this.saveSubmissions();
      return true;
    }
    return false;
  }

  // Get submission statistics
  getStatistics() {
    const total = this.submissions.length;
    const pending = this.submissions.filter(s => s.status === 'pending').length;
    const approved = this.submissions.filter(s => s.status === 'approved').length;
    const rejected = this.submissions.filter(s => s.status === 'rejected').length;

    return {
      total,
      pending,
      approved,
      rejected
    };
  }
}

// Create singleton instance
const paymentStorage = new PaymentStorage();

export default paymentStorage;
export { PaymentStorage };