import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const SimpleAdminDashboard = () => {
    const { userProfile, currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalFarmers: 0,
        totalAdmins: 0
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            // Get all users
            const { data: allUsers, error } = await supabase.auth.admin.listUsers();
            if (error) throw error;

            const totalUsers = allUsers.users.length;
            const admins = allUsers.users.filter(user =>
                user.user_metadata?.role === 'admin' ||
                user.email.includes('@farmtech.com')
            );
            const totalAdmins = admins.length;
            const totalFarmers = totalUsers - totalAdmins;

            setStats({ totalUsers, totalFarmers, totalAdmins });
            setUsers(allUsers.users);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px'
        }}>
            {/* Admin Header */}
            <div style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>🛡️ ADMIN DASHBOARD</h1>
                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                    Welcome {userProfile?.name} - You have ADMIN privileges
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                    Email: {userProfile?.email} | Role: {userProfile?.role}
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#3b82f6', margin: '0 0 10px 0' }}>👥 Total Users</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
                        {stats.totalUsers}
                    </p>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>🌾 Farmers</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
                        {stats.totalFarmers}
                    </p>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#8b5cf6', margin: '0 0 10px 0' }}>🛡️ Admins</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
                        {stats.totalAdmins}
                    </p>
                </div>
            </div>

            {/* Admin Controls */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>🎛️ Admin Controls</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }}>
                    <button
                        onClick={() => navigate('/materials')}
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        📦 Manage Materials
                    </button>

                    <button
                        onClick={() => navigate('/schemes')}
                        style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        📋 Manage Schemes
                    </button>

                    <button
                        onClick={() => navigate('/contacts')}
                        style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        📞 Manage Contacts
                    </button>

                    <button
                        onClick={loadAdminData}
                        style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            padding: '15px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            {/* User Management */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>👥 User Management</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    Name
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    Email
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    Role
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    Joined
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    Last Login
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.slice(0, 10).map((user, index) => {
                                const isAdmin = user.user_metadata?.role === 'admin' || user.email.includes('@farmtech.com');
                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px' }}>
                                            {user.user_metadata?.name || user.email.split('@')[0]}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                backgroundColor: isAdmin ? '#ddd6fe' : '#dbeafe',
                                                color: isAdmin ? '#7c3aed' : '#2563eb',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {isAdmin ? '🛡️ Admin' : '🌾 Farmer'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {users.length > 10 && (
                    <p style={{ marginTop: '15px', color: '#6b7280', fontSize: '14px' }}>
                        Showing first 10 users out of {users.length} total users
                    </p>
                )}
            </div>

            {/* Admin Info */}
            <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '20px'
            }}>
                <h3 style={{ color: '#92400e', margin: '0 0 10px 0' }}>🔑 Admin Privileges Active</h3>
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>
                    You are logged in as an administrator with full system access.
                    You can manage materials, schemes, contacts, and view all user data.
                </p>
            </div>
        </div>
    );
};

export default SimpleAdminDashboard;