import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Make sure this points to your client setup

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
      // We grab the first element of the returned array [0] instead of using .single()
      const { data: insertedRestaurants, error: restError } = await supabase
        .from('restaurants')
        .insert([{ 
          name: formData.restaurantName,
          // If your restaurants table has an owner_id or created_by column, uncomment below:
          // owner_id: userId 
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

      // 4. Force a quick sign-out so they have to log in cleanly, 
      // or redirect them. Since we turned off email confirmations, 
      // they can log in instantly!
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-emerald-400">PayRoller</span>
          <h2 className="text-xl font-bold mt-3 text-slate-200">Register Your Restaurant</h2>
          <p className="text-sm text-slate-400 mt-1">Set up your workspace and your owner/admin account.</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Restaurant Name</label>
            <input
              required
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              placeholder="e.g., The Grill House"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Admin / Owner Name</label>
            <input
              required
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Admin Email Address</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@restaurant.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating workspace...' : 'Complete Registration'}</span>
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}