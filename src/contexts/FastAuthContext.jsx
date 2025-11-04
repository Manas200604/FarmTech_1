import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
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
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setCurrentUser(null);
            setUserProfile(null);
            toast.success('Successfully logged out!');
        } catch (error) {
            toast.error(error.message || 'Failed to logout');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email) => {
        try {
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
        return userProfile?.role === 'admin';
    };

    const isFarmer = () => {
        return userProfile?.role === 'farmer';
    };

    useEffect(() => {
        let mounted = true;

        // Simple initialization - no complex profile fetching
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && mounted) {
                    setCurrentUser(session.user);

                    // Simple profile - just use basic info
                    setUserProfile({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                        role: 'farmer' // Default role, can be updated through admin panel
                    });
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

        return () => {
            mounted = false;
            subscription.unsubscribe();
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
        isFarmer
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