import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      // NOTE: Our AuthContext handles the state update automatically.
      // We don't need to manually redirect; our router will react to the role change.
    } catch (err) {
      console.error('Login error:', err);
      // Simplify common Supabase auth errors for the UI
      if (err.message === 'Invalid login credentials') {
        setError('The email or password you entered is incorrect.');
      } else {
        setError(err.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      {/* Modern Card Container */}
      <div className="bg-slate-900 w-full max-w-md p-10 rounded-2xl border border-slate-800 shadow-2xl">
        
        {/* Header/Branding */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-emerald-400 tracking-tighter">PayRoller</h1>
          <p className="text-slate-400 mt-2 font-medium">Please sign in to access your portal.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error Message Display */}
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 p-4 rounded-lg text-sm font-medium animate-pulse">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., your.name@payroller.co.ke"
              required
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 p-4 rounded-xl font-bold text-lg tracking-tight transition duration-200 focus:ring-4 focus:ring-emerald-400/30 outline-none active:scale-[0.98]"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Optional: Footer Links */}
        <div className="text-center mt-12 text-sm text-slate-500 border-t border-slate-800 pt-8">
          Need access to PayRoller? Contact your administrator.
        </div>

      </div>
    </div>
  );
};

export default Login;