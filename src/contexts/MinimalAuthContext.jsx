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
  const [initialized, setInitialized] = useState(false);

  // Fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user doesn't exist in database, create profile
        if (error.code === 'PGRST116') {
          console.log('User profile not found, will be created by trigger');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in database
  const createUserProfile = async (user, additionalData = {}) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        name: additionalData.name || user.user_metadata?.name || user.email.split('@')[0],
        role: additionalData.role || 'farmer'
      };

      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Return a default profile if database creation fails
      return {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0],
        role: 'farmer'
      };
    }
  };

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

      // If user is immediately available (email confirmation disabled)
      if (authData.user && !authData.user.email_confirmed_at) {
        toast.success('Account created! Please check your email to confirm your account.');
      } else if (authData.user) {
        toast.success('Account created successfully!');
      }

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

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      toast.success('Profile updated successfully!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  // Check if user is farmer
  const isFarmer = () => {
    return userProfile?.role === 'farmer';
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state with timeout protection
    const initializeAuth = async () => {
      try {
        // Set a maximum timeout for initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000);
        });

        const authPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise]);
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          setCurrentUser(session.user);
          
          // Try to fetch user profile with timeout
          try {
            const profilePromise = fetchUserProfile(session.user.id);
            const profileTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
            });
            
            let profile = await Promise.race([profilePromise, profileTimeoutPromise]);
            
            if (!profile) {
              // Create a basic profile without waiting
              profile = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.email.split('@')[0],
                role: 'farmer'
              };
            }
            
            if (mounted) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Profile fetch failed, using default:', profileError);
            if (mounted) {
              setUserProfile({
                id: session.user.id,
                email: session.user.email,
                name: session.user.email.split('@')[0],
                role: 'farmer'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Start initialization immediately
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        setCurrentUser(session.user);
        
        // Fetch user profile with fallback
        try {
          let profile = await fetchUserProfile(session.user.id);
          
          if (!profile) {
            profile = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.email.split('@')[0],
              role: 'farmer'
            };
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.warn('Profile fetch failed in auth change:', error);
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.email.split('@')[0],
            role: 'farmer'
          });
        }
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
    initialized,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    isAdmin,
    isFarmer
  };

  // Show loading screen only during initial load with timeout
  if (loading && !initialized) {
    // Force initialization after 3 seconds to prevent infinite loading
    setTimeout(() => {
      if (loading && !initialized) {
        console.warn('Force completing auth initialization due to timeout');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FarmTech...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing authentication...</p>
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