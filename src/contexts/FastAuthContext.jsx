import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable, environmentStatus } from '../supabase/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (email, password) => {
        try {
            setLoading(true);
            
            if (!isSupabaseAvailable()) {
                throw new Error('Authentication service is not available. Please check your configuration.');
            }
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            toast.success('Successfully logged in!');
            return data;
        } catch (error) {
            toast.error(error.message || 'Failed to login');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, userData = {}) => {
        try {
            setLoading(true);
            
            if (!isSupabaseAvailable()) {
                throw new Error('Authentication service is not available. Please check your configuration.');
            }
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: userData.name || '',
                        role: userData.role || 'farmer'
                    }
                }
            });

            if (authError) throw authError;
            toast.success('Account created successfully!');
            return authData;
        } catch (error) {
            toast.error(error.message || 'Failed to create account');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            
            if (!isSupabaseAvailable()) {
                // If Supabase is not available, just clear local state
                setCurrentUser(null);
                setUserProfile(null);
                toast.success('Successfully logged out!');
                return;
            }
            
            // Check if there's an active session before attempting logout
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) {
                console.warn('No active session found, clearing local state');
                setCurrentUser(null);
                setUserProfile(null);
                toast.success('Successfully logged out!');
                return;
            }
            
            const { error } = await supabase.auth.signOut();
            if (error) {
                // Handle specific auth errors gracefully
                if (error.message.includes('Auth session missing') || error.message.includes('session_not_found')) {
                    console.warn('Session already expired, clearing local state');
                } else {
                    console.error('Logout error:', error.message);
                    toast.error('Logout failed, but clearing local session');
                }
            }

            // Always clear local state regardless of API response
            setCurrentUser(null);
            setUserProfile(null);
            toast.success('Successfully logged out!');
        } catch (error) {
            console.error('Logout error:', error.message);
            // Always clear local state even if logout API fails
            setCurrentUser(null);
            setUserProfile(null);
            toast.success('Logged out (session cleared)');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email) => {
        try {
            if (!isSupabaseAvailable()) {
                throw new Error('Authentication service is not available. Please check your configuration.');
            }
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            toast.success('Password reset email sent!');
        } catch (error) {
            toast.error(error.message || 'Failed to send reset email');
            throw error;
        }
    };

    const updateUserProfile = async (updates) => {
        try {
            if (!currentUser) throw new Error('No user logged in');

            // Update the local profile immediately for better UX
            const updatedProfile = { ...userProfile, ...updates };
            setUserProfile(updatedProfile);

            toast.success('Profile updated successfully!');
            return updatedProfile;
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
            throw error;
        }
    };

    const isAdmin = () => {
        return userProfile?.role === 'admin' || 
               userProfile?.isSystemAdmin === true ||
               userProfile?.email === 'admin@farmtech.com';
    };

    const isSuperAdmin = () => {
        return userProfile?.email === 'admin@farmtech.com' ||
               userProfile?.isSystemAdmin === true;
    };

    const isFarmer = () => {
        return userProfile?.role === 'farmer';
    };

    const hasPermission = (permission) => {
        if (!userProfile) return false;
        // admin@farmtech.com has ALL permissions
        if (userProfile.email === 'admin@farmtech.com') return true;
        if (userProfile.role === 'admin' || userProfile.isSystemAdmin) return true;
        return userProfile.permissions?.[permission] === true;
    };

    const canManageUsers = () => {
        return userProfile?.email === 'admin@farmtech.com' || 
               userProfile?.isSystemAdmin === true;
    };

    const canDeleteData = () => {
        return userProfile?.email === 'admin@farmtech.com' || 
               userProfile?.isSystemAdmin === true;
    };

    const canModifySystem = () => {
        return userProfile?.email === 'admin@farmtech.com';
    };

    useEffect(() => {
        let mounted = true;

        // Optimized initialization with better error handling
        const initAuth = async () => {
            try {
                // Check if Supabase is available before attempting to get session
                if (!isSupabaseAvailable()) {
                    console.warn('Supabase is not available, skipping auth initialization');
                    if (mounted) {
                        setLoading(false);
                    }
                    return;
                }
                
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.warn('Session retrieval error:', error.message);
                    return;
                }

                if (session?.user && mounted) {
                    setCurrentUser(session.user);

                    // Enhanced profile with metadata and proper admin detection
                    const metadata = session.user.user_metadata || {};
                    const email = session.user.email;
                    
                    // Detect admin users by email or metadata
                    const isAdminEmail = email.includes('@farmtech.com') || 
                                       email === 'manas28prabhu@gmail.com' ||
                                       metadata.role === 'admin';
                    
                    const detectedRole = metadata.role || (isAdminEmail ? 'admin' : 'farmer');
                    
                    setUserProfile({
                        id: session.user.id,
                        email: session.user.email,
                        name: metadata.name || session.user.email.split('@')[0],
                        role: detectedRole,
                        isSystemAdmin: metadata.isSystemAdmin || false,
                        isSuperAdmin: metadata.isSuperAdmin || email === 'admin@farmtech.com',
                        permissions: metadata.permissions || {}
                    });
                }
            } catch (error) {
                console.error('Auth initialization error:', error.message);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth changes only if Supabase is available
        let subscription = null;
        
        if (isSupabaseAvailable()) {
            try {
                const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
                    if (!mounted) return;

                    if (session?.user) {
                        setCurrentUser(session.user);
                        setUserProfile({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                            role: 'farmer' // Default role, can be updated through admin panel
                        });
                    } else {
                        setCurrentUser(null);
                        setUserProfile(null);
                    }

                    setLoading(false);
                });
                
                subscription = authSubscription;
            } catch (error) {
                console.error('Failed to set up auth state listener:', error);
                // If we can't set up the listener, just finish loading
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        return () => {
            mounted = false;
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        login,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        isAdmin,
        isSuperAdmin,
        isFarmer,
        hasPermission,
        canManageUsers,
        canDeleteData,
        canModifySystem
    };

    // Simple loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};