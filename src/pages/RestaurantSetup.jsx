'use client'

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Pointing to your client setup

export default function RestaurantSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    restaurantName: '',
    adminName: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.adminName,
            role: 'admin',
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Sign up failed, no user returned.");

      const userId = authData.user.id;

      // 2. Create the Restaurant record
      const { data: insertedRestaurants, error: restError } = await supabase
        .from('restaurants')
        .insert([{ 
          name: formData.restaurantName,
        }])
        .select();

      if (restError) throw restError;
      if (!insertedRestaurants || insertedRestaurants.length === 0) {
        throw new Error("Failed to retrieve the created restaurant.");
      }

      const createdRestaurant = insertedRestaurants[0];

      // 3. Create or Update the Admin's Profile linked to the restaurant
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: userId,
          full_name: formData.adminName,
          restaurant_id: createdRestaurant.id, // Linking verified!
          role: 'admin',
        }], { onConflict: 'id' }); // If the row already exists from a trigger, update it!

      if (profileError) throw profileError;

      // 4. Force a clean sign-out for clean login
      await supabase.auth.signOut();

      navigate('/login', { state: { message: "Account created successfully! Please sign in." } });

    } catch (err) {
      console.error("Signup process failed:", err);
      setError(err.message || 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative flex items-center justify-center p-6 selection:bg-emerald-500/30">
      
      {/* Structural Gridlines (Brillance Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Outer Card with Precise Corner Accents */}
      <div className="w-full max-w-md bg-[#121214]/60 border border-[#1f1f23] rounded-xl p-8 backdrop-blur-md relative z-10 shadow-2xl">
        
        {/* Subtle Decorative Accent Lines in the Corners */}
        <div className="hidden sm:block absolute -top-3 -left-3 w-6 h-6 border-t border-l border-zinc-700"></div>
        <div className="hidden sm:block absolute -top-3 -right-3 w-6 h-6 border-t border-r border-zinc-700"></div>
        <div className="hidden sm:block absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-zinc-700"></div>
        <div className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-zinc-700"></div>

        {/* Header Block */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center gap-1.5 font-mono tracking-widest text-lg font-bold mb-2">
            <span className="text-white">PAY</span>
            <span className="text-emerald-400">ROLLER</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-serif tracking-tight font-light text-zinc-100">Register Workspace</h2>
          <p className="text-xs text-zinc-400 font-mono tracking-wide mt-1 uppercase">Initialize Admin Profile</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-950/20 border border-red-900/50 text-red-400 text-xs font-mono rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Restaurant Name
            </label>
            <input
              required
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              placeholder="e.g., The Grill House"
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Admin Name */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Admin / Owner Name
            </label>
            <input
              required
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Admin Email Address
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@restaurant.com"
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Security Password
            </label>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-white hover:bg-emerald-400 text-[#09090b] font-bold py-3.5 px-4 rounded text-xs font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Initializing Workspace...' : 'Complete Registration'}</span>
          </button>
        </form>

        <p className="text-center text-xs font-mono tracking-wide text-zinc-500 mt-8">
          Existing Workspace?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}