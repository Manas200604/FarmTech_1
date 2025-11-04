/**
 * Analytics Tracking Hook
 * Provides analytics tracking functionality for components
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import { AnalyticsData } from '../models/AnalyticsData';
import analyticsStorage from '../utils/analyticsStorage';

export const useAnalyticsTracking = () => {
  const { userProfile } = useAuth();
  const trackingQueue = useRef([]);
  const flushTimer = useRef(null);

  // Track event
  const trackEvent = useCallback(async (eventType, value = 1, metadata = {}) => {
    try {
      const eventData = {
        metricType: eventType,
        value: value,
        date: new Date(),
        metadata: {
          ...metadata,
          userId: userProfile?.id,
          userRole: userProfile?.role,
          timestamp: Date.now()
        },
        aggregationType: 'daily',
        category: getCategoryForEventType(eventType)
      };

      // Add to queue for batch processing
      trackingQueue.current.push(eventData);

      // Schedule flush if not already scheduled
      if (!flushTimer.current) {
        flushTimer.current = setTimeout(flushQueue, 5000); // Flush after 5 seconds
      }

      // If queue is getting large, flush immediately
      if (trackingQueue.current.length >= 10) {
        flushQueue();
      }

    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }, [userProfile]);

  // Flush queue to storage
  const flushQueue = useCallback(async () => {
    if (trackingQueue.current.length === 0) return;

    const events = trackingQueue.current.splice(0);
    
    try {
      for (const event of events) {
        await analyticsStorage.addAnalyticsData(event);
      }
    } catch (error) {
      console.error('Error flushing analytics queue:', error);
      // Re-add events to queue for retry
      trackingQueue.current.unshift(...events);
    }

    // Clear timer
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  // Track page view
  const trackPageView = useCallback((pageName, additionalData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.ACTIVE_USERS, 1, {
      page: pageName,
      ...additionalData
    });
  }, [trackEvent]);

  // Track user registration
  const trackUserRegistration = useCallback((userData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS, 1, {
      userRole: userData.role,
      registrationMethod: userData.method || 'form'
    });
  }, [trackEvent]);

  // Track order creation
  const trackOrderCreated = useCallback((orderData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.ORDERS_COUNT, 1, {
      orderId: orderData.id,
      orderValue: orderData.totalAmount,
      itemCount: orderData.items?.length || 0
    });

    if (orderData.totalAmount) {
      trackEvent(AnalyticsData.METRIC_TYPES.ORDERS_VALUE, orderData.totalAmount, {
        orderId: orderData.id
      });
    }
  }, [trackEvent]);

  // Track material purchase
  const trackMaterialPurchase = useCallback((materialData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.MATERIALS_SOLD, materialData.quantity || 1, {
      materialId: materialData.id,
      materialName: materialData.name,
      category: materialData.category,
      unitPrice: materialData.price
    });

    if (materialData.revenue) {
      trackEvent(AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE, materialData.revenue, {
        materialId: materialData.id,
        materialName: materialData.name
      });
    }
  }, [trackEvent]);

  // Track upload submission
  const trackUploadSubmission = useCallback((uploadData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.UPLOADS_COUNT, 1, {
      uploadId: uploadData.id,
      cropType: uploadData.cropType,
      fileSize: uploadData.fileSize,
      fileType: uploadData.fileType
    });
  }, [trackEvent]);

  // Track upload approval
  const trackUploadApproval = useCallback((uploadData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED, 1, {
      uploadId: uploadData.id,
      cropType: uploadData.cropType,
      reviewedBy: uploadData.reviewedBy
    });
  }, [trackEvent]);

  // Track payment submission
  const trackPaymentSubmission = useCallback((paymentData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS, 1, {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod
    });
  }, [trackEvent]);

  // Track payment approval
  const trackPaymentApproval = useCallback((paymentData = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS, 1, {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      reviewedBy: paymentData.reviewedBy
    });
  }, [trackEvent]);

  // Track revenue
  const trackRevenue = useCallback((amount, source = 'general', metadata = {}) => {
    trackEvent(AnalyticsData.METRIC_TYPES.REVENUE, amount, {
      source,
      ...metadata
    });
  }, [trackEvent]);

  // Calculate and track conversion rate
  const trackConversionRate = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get today's active users and orders
      const analytics = await analyticsStorage.getAnalyticsByDateRange(today, today);
      
      const activeUsers = analytics.find(a => 
        a.metricType === AnalyticsData.METRIC_TYPES.ACTIVE_USERS &&
        a.date.toISOString().split('T')[0] === todayStr
      );
      
      const orders = analytics.find(a => 
        a.metricType === AnalyticsData.METRIC_TYPES.ORDERS_COUNT &&
        a.date.toISOString().split('T')[0] === todayStr
      );

      if (activeUsers && orders && activeUsers.value > 0) {
        const conversionRate = (orders.value / activeUsers.value) * 100;
        trackEvent(AnalyticsData.METRIC_TYPES.CONVERSION_RATE, conversionRate);
      }
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
    }
  }, [trackEvent]);

  // Calculate and track average order value
  const trackAverageOrderValue = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get today's orders and revenue
      const analytics = await analyticsStorage.getAnalyticsByDateRange(today, today);
      
      const ordersCount = analytics.find(a => 
        a.metricType === AnalyticsData.METRIC_TYPES.ORDERS_COUNT &&
        a.date.toISOString().split('T')[0] === todayStr
      );
      
      const ordersValue = analytics.find(a => 
        a.metricType === AnalyticsData.METRIC_TYPES.ORDERS_VALUE &&
        a.date.toISOString().split('T')[0] === todayStr
      );

      if (ordersCount && ordersValue && ordersCount.value > 0) {
        const averageOrderValue = ordersValue.value / ordersCount.value;
        trackEvent(AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE, averageOrderValue);
      }
    } catch (error) {
      console.error('Error calculating average order value:', error);
    }
  }, [trackEvent]);

  // Flush queue on unmount
  useEffect(() => {
    return () => {
      flushQueue();
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
      }
    };
  }, [flushQueue]);

  return {
    trackEvent,
    trackPageView,
    trackUserRegistration,
    trackOrderCreated,
    trackMaterialPurchase,
    trackUploadSubmission,
    trackUploadApproval,
    trackPaymentSubmission,
    trackPaymentApproval,
    trackRevenue,
    trackConversionRate,
    trackAverageOrderValue,
    flushQueue
  };
};

// Helper function to get category for event type
function getCategoryForEventType(eventType) {
  const categoryMap = {
    [AnalyticsData.METRIC_TYPES.USER_REGISTRATIONS]: 'users',
    [AnalyticsData.METRIC_TYPES.ACTIVE_USERS]: 'users',
    [AnalyticsData.METRIC_TYPES.USER_GROWTH]: 'users',
    [AnalyticsData.METRIC_TYPES.REVENUE]: 'financial',
    [AnalyticsData.METRIC_TYPES.ORDERS_VALUE]: 'financial',
    [AnalyticsData.METRIC_TYPES.MATERIALS_REVENUE]: 'financial',
    [AnalyticsData.METRIC_TYPES.AVERAGE_ORDER_VALUE]: 'financial',
    [AnalyticsData.METRIC_TYPES.ORDERS_COUNT]: 'orders',
    [AnalyticsData.METRIC_TYPES.UPLOADS_COUNT]: 'uploads',
    [AnalyticsData.METRIC_TYPES.UPLOADS_APPROVED]: 'uploads',
    [AnalyticsData.METRIC_TYPES.MATERIALS_SOLD]: 'materials',
    [AnalyticsData.METRIC_TYPES.PAYMENT_SUBMISSIONS]: 'payments',
    [AnalyticsData.METRIC_TYPES.PAYMENT_APPROVALS]: 'payments',
    [AnalyticsData.METRIC_TYPES.CONVERSION_RATE]: 'conversion'
  };
  
  return categoryMap[eventType] || 'general';
}

export default useAnalyticsTracking;