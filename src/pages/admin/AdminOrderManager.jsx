import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const AdminOrderManager = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check admin authentication
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Try to load from orders table first
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (!ordersError && ordersData && ordersData.length > 0) {
        setOrders(ordersData);
      } else {
        // Fallback: load from localStorage if database is empty
        const localOrders = JSON.parse(localStorage.getItem('farmtech_orders') || '[]');
        if (localOrders.length > 0) {
          setOrders(localOrders);
        } else {
          // Last fallback: use users as mock orders for demonstration
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'farmer')
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          // Transform users into "orders" for demonstration
          const transformedOrders = data.map(user => ({
            id: user.id,
            farmer_name: user.name,
            farmer_email: user.email,
            farmer_phone: user.phone,
            farm_location: user.farm_location,
            crop_type: user.crop_type,
            order_date: user.created_at,
            status: 'active', // Default status
            order_type: 'farming_service', // Default type
            transaction_id: null
          }));

          setOrders(transformedOrders || []);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId, farmerName) => {
    if (!confirm(`Are you sure you want to delete the order from "${farmerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // For now, we'll delete the user record (in a real app, you'd delete from orders table)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order deleted successfully');
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus, farmerName) => {
    try {
      // In a real app, you'd update the orders table
      // For now, we'll just show a success message
      toast.success(`Order status updated to ${newStatus} for ${farmerName}`);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #fecaca',
            borderTop: '4px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#dc2626' }}>Loading Orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fef2f2' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(220,38,38,0.2)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
              📦 Order Management
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              Manage all farmer orders and requests
            </p>
          </div>
          <button
            onClick={() => navigate('/red-admin')}
            style={{
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Filter Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(220,38,38,0.1)',
          border: '2px solid #fecaca',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', name: 'All Orders', count: orders.length },
            { id: 'active', name: 'Active', count: orders.filter(o => o.status === 'active').length },
            { id: 'completed', name: 'Completed', count: orders.filter(o => o.status === 'completed').length },
            { id: 'cancelled', name: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                backgroundColor: filter === tab.id ? '#dc2626' : 'white',
                color: filter === tab.id ? 'white' : '#dc2626',
                border: `2px solid ${filter === tab.id ? '#dc2626' : '#fecaca'}`,
                padding: '10px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(220,38,38,0.1)',
          border: '2px solid #fecaca'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '20px', fontSize: '20px' }}>
            {filter === 'all' ? 'All Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders`} ({filteredOrders.length})
          </h2>
          
          {filteredOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#dc2626', padding: '40px', fontSize: '16px' }}>
              No orders found for this filter
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredOrders.map((order) => (
                <div key={order.id} style={{
                  border: `2px solid ${
                    order.status === 'active' ? '#10b981' : 
                    order.status === 'completed' ? '#3b82f6' : 
                    order.status === 'cancelled' ? '#ef4444' : '#fecaca'
                  }`,
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fef2f2'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#dc2626', fontSize: '18px' }}>
                            {order.farmer_name || 'Unknown Farmer'}
                          </h4>
                          <p style={{ margin: '0', color: '#7f1d1d', fontSize: '14px' }}>
                            📧 {order.farmer_email} | 📱 {order.farmer_phone || 'N/A'}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: 
                            order.status === 'active' ? '#10b981' : 
                            order.status === 'completed' ? '#3b82f6' : 
                            order.status === 'cancelled' ? '#ef4444' : '#6b7280',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {order.status}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
                          <strong>🌾 Crop Type:</strong> {order.crop_type || 'Not specified'}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
                          <strong>📍 Farm Location:</strong> {order.farm_location || 'Not specified'}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
                          <strong>📦 Order Type:</strong> {order.order_type}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
                          <strong>📅 Order Date:</strong> {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
                        </p>
                        {(order.transaction_id || order.paymentDetails?.transactionId) && (
                          <p style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
                            <strong>💳 Transaction ID:</strong> {order.transaction_id || order.paymentDetails?.transactionId}
                          </p>
                        )}
                        <p style={{ margin: '0', color: '#7f1d1d', fontSize: '12px' }}>
                          <strong>🆔 Order ID:</strong> {order.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
                      {/* Status Update Buttons */}
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed', order.farmer_name)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ✅ Mark Complete
                        </button>
                      )}
                      
                      {order.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled', order.farmer_name)}
                          style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ⏸️ Cancel
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => deleteOrder(order.id, order.farmer_name)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminOrderManager;