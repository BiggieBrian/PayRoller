import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Fetch the profile associated with the authenticated user ID
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Changing to maybeSingle prevents the 406 / coercion crash

      if (error) throw error;
      setProfile(data); // Will be null if no profile exists, which is perfect
    } catch (err) {
      console.error('Error fetching user profile:', err.message);
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
          // Wait for the profile fetch, but catch any unexpected issues
          await fetchProfile(session.user.id).catch(err => 
            console.error("Failed to fetch initial profile:", err)
          );
        }
      } catch (err) {
        console.error('Session check failed:', err.message);
      } finally {
        if (isMounted) setLoading(false); // ALWAYS runs, avoiding infinite loading
      }
    };

    checkSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // If they logged out, quickly clean up state and stop loading
        if (!session) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // If they logged in or refreshed
        setUser(session.user);
        try {
          await fetchProfile(session.user.id);
        } catch (err) {
          console.error("Profile fetch error during auth state change:", err);
        } finally {
          if (isMounted) setLoading(false); // Safety net: ALWAYS stop loading
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Standard email/password login wrapper
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // Sign out wrapper
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
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

// Custom hook to consume the AuthContext cleanly in child components
export const useAuth = () => {
  return useContext(AuthContext);
};