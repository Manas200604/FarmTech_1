/**
 * Order Storage Utilities
 * Handles local storage and synchronization of order data
 */

import { Order } from '../models/Order.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';

const STORAGE_KEY = 'farmtech_orders';

export class OrderStorage {
  constructor() {
    this.cache = new Map();
  }

  async getAllOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const orders = JSON.parse(stored);
        return orders.map(data => Order.fromJSON(data));
      }
      return [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  async getOrdersByFarmer(farmerId) {
    const orders = await this.getAllOrders();
    return orders.filter(order => order.farmerId === farmerId);
  }

  async getOrderById(id) {
    const orders = await this.getAllOrders();
    return orders.find(order => order.id === id);
  }

  async saveOrders(orders) {
    try {
      const ordersData = orders.map(order => 
        order instanceof Order ? order.toJSON() : order
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersData));
      return true;
    } catch (error) {
      console.error('Error saving orders:', error);
      return false;
    }
  }

  async createOrder(orderData) {
    try {
      const orders = await this.getAllOrders();
      const newOrder = new Order(orderData);
      
      const validation = newOrder.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Save to local storage (existing functionality)
      orders.push(newOrder);
      await this.saveOrders(orders);

      // Also save to database for admin panel
      try {
        const { supabase } = await import('../supabase/client');
        const { error: dbError } = await supabase
          .from('orders')
          .insert({
            id: newOrder.id,
            user_id: newOrder.farmerId,
            farmer_name: orderData.shippingAddress?.fullName || 'Unknown',
            farmer_email: orderData.shippingAddress?.email || 'unknown@example.com',
            farmer_phone: orderData.shippingAddress?.phone || 'N/A',
            crop_type: orderData.items?.[0]?.productName || 'Mixed Items',
            farm_location: orderData.shippingAddress?.address || 'Not specified',
            order_type: orderData.paymentMethod || 'online',
            order_date: newOrder.createdAt,
            status: newOrder.status,
            total_amount: newOrder.totalAmount,
            transaction_id: newOrder.paymentDetails?.transactionId || null,
            payment_method: newOrder.paymentMethod,
            items: JSON.stringify(newOrder.items)
          });

        if (dbError) {
          console.error('Error saving order to database:', dbError);
          // Still return success since local storage worked
        }
      } catch (dbError) {
        console.error('Database save failed, order saved locally:', dbError);
      }

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id, updateData) {
    try {
      const orders = await this.getAllOrders();
      const orderIndex = orders.findIndex(order => order.id === id);
      
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && key !== 'createdAt') {
          orders[orderIndex][key] = updateData[key];
        }
      });
      
      orders[orderIndex].updatedAt = new Date();
      await this.saveOrders(orders);
      return orders[orderIndex];
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async submitPayment(orderId, paymentDetails) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.submitPayment(
        paymentDetails.transactionId,
        paymentDetails.farmerName,
        paymentDetails.screenshotUrl
      );

      await this.updateOrder(orderId, order.toJSON());
      return order;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  }

  async verifyPayment(orderId, verifiedBy, approved = true) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.verifyPayment(verifiedBy, approved);
      await this.updateOrder(orderId, order.toJSON());
      return order;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status) {
    const orders = await this.getAllOrders();
    return orders.filter(order => order.status === status);
  }

  async getPendingVerifications() {
    return await this.getOrdersByStatus(ORDER_STATUS.PAYMENT_SUBMITTED);
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.status = newStatus;
      order.updatedAt = new Date();
      
      // If marking as verified, set verification details
      if (newStatus === 'verified' && order.paymentDetails) {
        order.paymentDetails.verifiedAt = new Date();
      }

      await this.updateOrder(orderId, order.toJSON());
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async deleteOrder(orderId) {
    try {
      const orders = await this.getAllOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      
      if (orders.length === filteredOrders.length) {
        throw new Error('Order not found');
      }

      await this.saveOrders(filteredOrders);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const orderStorage = new OrderStorage();
export default orderStorage;
export { orderStorage };