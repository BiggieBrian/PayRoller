import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  restaurant: null, // Initialized placeholder
  loading: true,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Fetch the profile AND associated restaurant subscription state dynamically
  const fetchProfile = async (userId) => {
    try {
      // Performs a clean relational query to pull both records in one network request
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          restaurants (
            id,
            trial_start_timestamp,
            trial_end_timestamp,
            is_subscription_active
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data); 
    } catch (err) {
      console.error('Error fetching user profile & restaurant details:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check on App Mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          setUser(session.user);
          await fetchProfile(session.user.id).catch(err => 
            console.error("Failed to fetch initial profile:", err)
          );
        }
      } catch (err) {
        console.error('Session check failed:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Clean up state immediately if user logs out
        if (!session) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Re-engage loading state immediately when user authenticates.
        setLoading(true);
        
        setUser(session.user);
        try {
          await fetchProfile(session.user.id);
        } catch (err) {
          console.error("Profile fetch error during auth state change:", err);
        } finally {
          if (isMounted) setLoading(false); // Safe to unlock routing now
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    restaurant: profile?.restaurants || null, // Safely exposes the nested restaurant object globally
    loading,
    role: profile?.role || null,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};