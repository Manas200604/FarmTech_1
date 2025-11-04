/**
 * Payment Service
 * Handles payment submission, review, and approval workflows
 */

import BaseAdminService from './BaseAdminService.js';
import { PaymentSubmission } from '../models/PaymentSubmission.js';
import paymentSubmissionStorage from '../utils/paymentSubmissionStorage.js';
import { createOperationError, createValidationError, createNotFoundError } from './AdminServiceError.js';

export class PaymentService extends BaseAdminService {
  constructor(options = {}) {
    super({ ...options, serviceName: 'PaymentService' });
    this.storage = paymentSubmissionStorage;
  }

  // Submit payment for review
  async submitPayment(paymentData, userProfile) {
    try {
      const paymentSchema = {
        required: ['orderId', 'farmerName', 'transactionId', 'amount'],
        fields: {
          orderId: { type: 'string', minLength: 1 },
          farmerName: { type: 'string', minLength: 2 },
          transactionId: { type: 'string', minLength: 5 },
          amount: { type: 'number', min: 0.01 },
          phoneNumber: { type: 'string', pattern: /^\+?[\d\s\-\(\)]{10,15}$/ },
          paymentMethod: { type: 'string' }
        }
      };

      this.validateInput(paymentData, paymentSchema);

      const enhancedData = {
        ...paymentData,
        farmerId: userProfile?.id || paymentData.farmerId,
        status: PaymentSubmission.STATUS.PENDING,
        submittedAt: new Date()
      };

      const submission = await this.storage.addSubmission(enhancedData);
      this.logInfo('Payment submitted', { submissionId: submission.id, farmerId: userProfile?.id });
      
      return this.formatResponse(submission, 'Payment submitted successfully');
    } catch (error) {
      this.logError('Error submitting payment', error);
      throw createOperationError('Failed to submit payment', { error: error.message });
    }
  }

  // Review payment (admin action)
  async reviewPayment(paymentId, action, notes, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (!['approve', 'reject'].includes(action)) {
        throw createValidationError('Action must be either "approve" or "reject"');
      }

      const submission = await this.storage.getSubmissionById(paymentId);
      if (!submission) {
        throw createNotFoundError('Payment submission');
      }

      if (submission.status !== PaymentSubmission.STATUS.PENDING) {
        throw createValidationError('Payment has already been reviewed');
      }

      const newStatus = action === 'approve' ? 
        PaymentSubmission.STATUS.APPROVED : 
        PaymentSubmission.STATUS.REJECTED;

      const updatedSubmission = await this.storage.updateSubmissionStatus(
        paymentId, 
        newStatus, 
        userProfile.id, 
        notes
      );

      this.logInfo('Payment reviewed', { 
        submissionId: paymentId, 
        action, 
        reviewedBy: userProfile.id 
      });
      
      return this.formatResponse(updatedSubmission, `Payment ${action}d successfully`);
    } catch (error) {
      this.logError('Error reviewing payment', error);
      throw createOperationError('Failed to review payment', { error: error.message });
    }
  }

  // Bulk review payments
  async bulkReviewPayments(paymentIds, action, notes, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
        throw createValidationError('Payment IDs must be a non-empty array');
      }

      if (!['approve', 'reject'].includes(action)) {
        throw createValidationError('Action must be either "approve" or "reject"');
      }

      const results = [];
      
      for (const paymentId of paymentIds) {
        try {
          const result = await this.reviewPayment(paymentId, action, notes, userProfile);
          results.push({ id: paymentId, status: 'success', data: result.data });
        } catch (error) {
          results.push({ id: paymentId, status: 'failed', error: error.message });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      
      return this.formatResponse(results, `Bulk ${action} completed: ${successCount}/${paymentIds.length} successful`);
    } catch (error) {
      this.logError('Error in bulk payment review', error);
      throw createOperationError('Failed to bulk review payments', { error: error.message });
    }
  }

  // Get payment history with filters
  async getPaymentHistory(filters = {}, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      let submissions = await this.storage.getAllSubmissions();

      // Apply filters
      if (filters.status) {
        submissions = submissions.filter(s => s.status === filters.status);
      }

      if (filters.paymentMethod) {
        submissions = submissions.filter(s => s.paymentMethod === filters.paymentMethod);
      }

      if (filters.farmerId) {
        submissions = submissions.filter(s => s.farmerId === filters.farmerId);
      }

      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        submissions = submissions.filter(s => {
          const submissionDate = new Date(s.submittedAt);
          return submissionDate >= start && submissionDate <= end;
        });
      }

      if (filters.amountRange) {
        submissions = submissions.filter(s => 
          s.amount >= filters.amountRange.min && 
          s.amount <= filters.amountRange.max
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        submissions = submissions.filter(s =>
          s.farmerName.toLowerCase().includes(searchTerm) ||
          s.transactionId.toLowerCase().includes(searchTerm) ||
          s.phoneNumber?.includes(searchTerm)
        );
      }

      // Apply sorting
      submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      // Apply pagination
      const pagination = this.validatePagination(filters.page, filters.limit);
      const startIndex = pagination.offset;
      const endIndex = startIndex + pagination.limit;
      const paginatedSubmissions = submissions.slice(startIndex, endIndex);

      return this.createPaginatedResponse(paginatedSubmissions, submissions.length, pagination.page, pagination.limit);
    } catch (error) {
      this.logError('Error getting payment history', error);
      throw createOperationError('Failed to get payment history', { error: error.message });
    }
  }

  // Get pending payments
  async getPendingPayments(userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const pendingSubmissions = await this.storage.getPendingSubmissions();
      
      return this.formatResponse(pendingSubmissions, `Found ${pendingSubmissions.length} pending payments`);
    } catch (error) {
      this.logError('Error getting pending payments', error);
      throw createOperationError('Failed to get pending payments', { error: error.message });
    }
  }

  // Generate payment report
  async generatePaymentReport(dateRange, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);
      this.validateDateRange(dateRange.start, dateRange.end);

      const submissions = await this.storage.getSubmissionsByDateRange(dateRange.start, dateRange.end);
      const stats = await this.storage.getSubmissionStatistics(dateRange);
      const methodStats = await this.storage.getPaymentMethodStats(dateRange);

      const report = {
        dateRange,
        summary: stats,
        paymentMethods: methodStats,
        submissions: submissions.map(s => ({
          id: s.id,
          farmerName: s.farmerName,
          amount: s.amount,
          status: s.status,
          paymentMethod: s.paymentMethod,
          submittedAt: s.submittedAt,
          reviewedAt: s.reviewedAt
        })),
        generatedAt: new Date(),
        generatedBy: userProfile.name
      };

      this.logInfo('Payment report generated', { 
        dateRange, 
        submissionsCount: submissions.length,
        generatedBy: userProfile.id 
      });
      
      return this.formatResponse(report, 'Payment report generated successfully');
    } catch (error) {
      this.logError('Error generating payment report', error);
      throw createOperationError('Failed to generate payment report', { error: error.message });
    }
  }

  // Get payment statistics
  async getPaymentStatistics(dateRange, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const stats = await this.storage.getSubmissionStatistics(dateRange);
      const methodStats = await this.storage.getPaymentMethodStats(dateRange);

      const enhancedStats = {
        ...stats,
        approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
        rejectionRate: stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0,
        pendingRate: stats.total > 0 ? (stats.pending / stats.total) * 100 : 0,
        paymentMethods: methodStats,
        averageProcessingTimeHours: stats.averageProcessingTime
      };

      return this.formatResponse(enhancedStats, 'Payment statistics retrieved successfully');
    } catch (error) {
      this.logError('Error getting payment statistics', error);
      throw createOperationError('Failed to get payment statistics', { error: error.message });
    }
  }

  // Send notification (placeholder for notification system)
  async sendPaymentNotification(paymentId, type, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const submission = await this.storage.getSubmissionById(paymentId);
      if (!submission) {
        throw createNotFoundError('Payment submission');
      }

      // Placeholder for actual notification implementation
      const notification = {
        type,
        recipient: submission.farmerId,
        message: this.getNotificationMessage(type, submission),
        sentAt: new Date(),
        sentBy: userProfile.id
      };

      this.logInfo('Payment notification sent', { 
        paymentId, 
        type, 
        recipient: submission.farmerId 
      });
      
      return this.formatResponse(notification, 'Notification sent successfully');
    } catch (error) {
      this.logError('Error sending payment notification', error);
      throw createOperationError('Failed to send notification', { error: error.message });
    }
  }

  // Get notification message based on type
  getNotificationMessage(type, submission) {
    const messages = {
      approved: `Your payment of ₹${submission.amount} has been approved. Transaction ID: ${submission.transactionId}`,
      rejected: `Your payment of ₹${submission.amount} has been rejected. Please contact support for assistance.`,
      pending: `Your payment of ₹${submission.amount} is under review. We'll notify you once it's processed.`
    };

    return messages[type] || 'Payment status update';
  }

  // Delete payment submission
  async deletePaymentSubmission(paymentId, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const submission = await this.storage.getSubmissionById(paymentId);
      if (!submission) {
        throw createNotFoundError('Payment submission');
      }

      await this.storage.deleteSubmission(paymentId);
      
      this.logInfo('Payment submission deleted', { 
        paymentId, 
        deletedBy: userProfile.id 
      });
      
      return this.formatResponse(null, 'Payment submission deleted successfully');
    } catch (error) {
      this.logError('Error deleting payment submission', error);
      throw createOperationError('Failed to delete payment submission', { error: error.message });
    }
  }

  // Export payment data
  async exportPayments(format = 'json', filters = {}, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const exportData = await this.storage.exportSubmissions(format, filters);
      
      this.logInfo('Payments exported', { 
        format, 
        count: exportData.totalRecords, 
        exportedBy: userProfile.id 
      });
      
      return this.formatResponse(exportData, `Payments exported successfully in ${format} format`);
    } catch (error) {
      this.logError('Error exporting payments', error);
      throw createOperationError('Failed to export payments', { error: error.message });
    }
  }

  // Get recent payment activity
  async getRecentActivity(limit = 10, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const recentActivity = await this.storage.getRecentActivity(limit);
      
      return this.formatResponse(recentActivity, `Retrieved ${recentActivity.length} recent activities`);
    } catch (error) {
      this.logError('Error getting recent activity', error);
      throw createOperationError('Failed to get recent activity', { error: error.message });
    }
  }

  // Health check
  async healthCheck() {
    try {
      const submissions = await this.storage.getAllSubmissions();
      const stats = await this.storage.getSubmissionStatistics();
      
      return {
        status: 'healthy',
        details: {
          totalSubmissions: submissions.length,
          pendingSubmissions: stats.pending,
          processingBacklog: stats.pending > 50,
          averageProcessingTime: stats.averageProcessingTime
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}

export default PaymentService;