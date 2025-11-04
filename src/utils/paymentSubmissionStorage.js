/**
 * Payment Submission Storage Utilities
 * Handles storage and retrieval of payment submission data
 */

import { PaymentSubmission } from '../models/PaymentSubmission.js';

const STORAGE_KEY = 'farmtech_payment_submissions';

class PaymentSubmissionStorage {
  constructor() {
    this.cache = new Map();
  }

  // Load all payment submissions from storage
  async getAllSubmissions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const submissions = JSON.parse(stored);
        return submissions.map(data => PaymentSubmission.fromJSON(data));
      }
      return [];
    } catch (error) {
      console.error('Error loading payment submissions:', error);
      return [];
    }
  }

  // Save payment submissions to storage
  async saveSubmissions(submissions) {
    try {
      const submissionsData = submissions.map(submission => 
        submission instanceof PaymentSubmission ? submission.toJSON() : submission
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissionsData));
      return true;
    } catch (error) {
      console.error('Error saving payment submissions:', error);
      return false;
    }
  }

  // Add new payment submission
  async addSubmission(submissionData) {
    try {
      const submissions = await this.getAllSubmissions();
      const newSubmission = new PaymentSubmission(submissionData);
      
      // Validate submission
      const validation = newSubmission.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      submissions.push(newSubmission);
      await this.saveSubmissions(submissions);
      return newSubmission;
    } catch (error) {
      console.error('Error adding payment submission:', error);
      throw error;
    }
  }

  // Get submission by ID
  async getSubmissionById(id) {
    const submissions = await this.getAllSubmissions();
    return submissions.find(submission => submission.id === id);
  }

  // Update submission
  async updateSubmission(id, updateData) {
    try {
      const submissions = await this.getAllSubmissions();
      const submissionIndex = submissions.findIndex(submission => submission.id === id);
      
      if (submissionIndex === -1) {
        throw new Error('Payment submission not found');
      }

      // Update the submission
      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && key !== 'createdAt') {
          submissions[submissionIndex][key] = updateData[key];
        }
      });
      
      submissions[submissionIndex].updatedAt = new Date();
      await this.saveSubmissions(submissions);
      return submissions[submissionIndex];
    } catch (error) {
      console.error('Error updating payment submission:', error);
      throw error;
    }
  }

  // Get submissions by status
  async getSubmissionsByStatus(status) {
    const submissions = await this.getAllSubmissions();
    return submissions.filter(submission => submission.status === status);
  }

  // Get pending submissions
  async getPendingSubmissions() {
    return await this.getSubmissionsByStatus(PaymentSubmission.STATUS.PENDING);
  }

  // Get submissions by farmer
  async getSubmissionsByFarmer(farmerId) {
    const submissions = await this.getAllSubmissions();
    return submissions.filter(submission => submission.farmerId === farmerId);
  }

  // Get submissions by date range
  async getSubmissionsByDateRange(startDate, endDate) {
    const submissions = await this.getAllSubmissions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return submissions.filter(submission => {
      const submissionDate = new Date(submission.submittedAt);
      return submissionDate >= start && submissionDate <= end;
    });
  }

  // Approve payment submission
  async approveSubmission(id, reviewedBy, notes = '') {
    try {
      const submission = await this.getSubmissionById(id);
      if (!submission) {
        throw new Error('Payment submission not found');
      }

      submission.approve(reviewedBy, notes);
      await this.updateSubmission(id, submission.toJSON());
      return submission;
    } catch (error) {
      console.error('Error approving payment submission:', error);
      throw error;
    }
  }

  // Reject payment submission
  async rejectSubmission(id, reviewedBy, reason = '', notes = '') {
    try {
      const submission = await this.getSubmissionById(id);
      if (!submission) {
        throw new Error('Payment submission not found');
      }

      submission.reject(reviewedBy, reason, notes);
      await this.updateSubmission(id, submission.toJSON());
      return submission;
    } catch (error) {
      console.error('Error rejecting payment submission:', error);
      throw error;
    }
  }

  // Bulk approve submissions
  async bulkApproveSubmissions(submissionIds, reviewedBy, notes = '') {
    const results = [];
    
    for (const id of submissionIds) {
      try {
        const result = await this.approveSubmission(id, reviewedBy, notes);
        results.push({ id, status: 'approved', submission: result });
      } catch (error) {
        results.push({ id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  // Bulk reject submissions
  async bulkRejectSubmissions(submissionIds, reviewedBy, reason = '', notes = '') {
    const results = [];
    
    for (const id of submissionIds) {
      try {
        const result = await this.rejectSubmission(id, reviewedBy, reason, notes);
        results.push({ id, status: 'rejected', submission: result });
      } catch (error) {
        results.push({ id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  // Get submission statistics
  async getSubmissionStatistics(dateRange = null) {
    let submissions = await this.getAllSubmissions();
    
    if (dateRange) {
      submissions = await this.getSubmissionsByDateRange(dateRange.start, dateRange.end);
    }
    
    const stats = {
      total: submissions.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      underReview: 0,
      totalAmount: 0,
      averageAmount: 0,
      averageProcessingTime: 0
    };
    
    let processingTimes = [];
    
    submissions.forEach(submission => {
      stats.totalAmount += submission.amount;
      
      switch (submission.status) {
        case PaymentSubmission.STATUS.PENDING:
          stats.pending++;
          break;
        case PaymentSubmission.STATUS.APPROVED:
          stats.approved++;
          break;
        case PaymentSubmission.STATUS.REJECTED:
          stats.rejected++;
          break;
        case PaymentSubmission.STATUS.UNDER_REVIEW:
          stats.underReview++;
          break;
      }
      
      // Calculate processing time for reviewed submissions
      if (submission.reviewedAt && submission.submittedAt) {
        const processingTime = new Date(submission.reviewedAt) - new Date(submission.submittedAt);
        processingTimes.push(processingTime);
      }
    });
    
    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;
    stats.averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;
    
    // Convert processing time from milliseconds to hours
    stats.averageProcessingTime = Math.round(stats.averageProcessingTime / (1000 * 60 * 60) * 100) / 100;
    
    return stats;
  }

  // Get payment method statistics
  async getPaymentMethodStats(dateRange = null) {
    let submissions = await this.getAllSubmissions();
    
    if (dateRange) {
      submissions = await this.getSubmissionsByDateRange(dateRange.start, dateRange.end);
    }
    
    const methodStats = {};
    
    submissions.forEach(submission => {
      const method = submission.paymentMethod;
      if (!methodStats[method]) {
        methodStats[method] = {
          count: 0,
          totalAmount: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }
      
      methodStats[method].count++;
      methodStats[method].totalAmount += submission.amount;
      
      switch (submission.status) {
        case PaymentSubmission.STATUS.APPROVED:
          methodStats[method].approved++;
          break;
        case PaymentSubmission.STATUS.REJECTED:
          methodStats[method].rejected++;
          break;
        case PaymentSubmission.STATUS.PENDING:
          methodStats[method].pending++;
          break;
      }
    });
    
    return methodStats;
  }

  // Search submissions
  async searchSubmissions(query, filters = {}) {
    const submissions = await this.getAllSubmissions();
    const searchTerm = query.toLowerCase();
    
    let filtered = submissions.filter(submission => {
      const matchesSearch = 
        submission.farmerName.toLowerCase().includes(searchTerm) ||
        submission.transactionId.toLowerCase().includes(searchTerm) ||
        submission.phoneNumber.includes(searchTerm) ||
        submission.amount.toString().includes(searchTerm);
      
      return matchesSearch;
    });
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(submission => submission.status === filters.status);
    }
    
    if (filters.paymentMethod) {
      filtered = filtered.filter(submission => submission.paymentMethod === filters.paymentMethod);
    }
    
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(submission => {
        const submissionDate = new Date(submission.submittedAt);
        return submissionDate >= start && submissionDate <= end;
      });
    }
    
    if (filters.amountRange) {
      filtered = filtered.filter(submission => 
        submission.amount >= filters.amountRange.min && 
        submission.amount <= filters.amountRange.max
      );
    }
    
    return filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  // Delete submission
  async deleteSubmission(id) {
    try {
      const submissions = await this.getAllSubmissions();
      const filteredSubmissions = submissions.filter(submission => submission.id !== id);
      
      if (submissions.length === filteredSubmissions.length) {
        throw new Error('Payment submission not found');
      }

      await this.saveSubmissions(filteredSubmissions);
      return true;
    } catch (error) {
      console.error('Error deleting payment submission:', error);
      throw error;
    }
  }

  // Export submissions
  async exportSubmissions(format = 'json', filters = {}) {
    let submissions = await this.getAllSubmissions();
    
    // Apply filters
    if (filters.status) {
      submissions = submissions.filter(s => s.status === filters.status);
    }
    
    if (filters.dateRange) {
      submissions = await this.getSubmissionsByDateRange(filters.dateRange.start, filters.dateRange.end);
    }
    
    const exportData = {
      submissions: submissions.map(submission => submission.toJSON()),
      exportedAt: new Date().toISOString(),
      format,
      totalRecords: submissions.length,
      filters
    };
    
    return exportData;
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const submissions = await this.getAllSubmissions();
    return submissions
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);
  }
}

// Create singleton instance
const paymentSubmissionStorage = new PaymentSubmissionStorage();

export default paymentSubmissionStorage;
export { PaymentSubmissionStorage };