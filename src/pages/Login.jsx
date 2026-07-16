'use client'

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
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative flex items-center justify-center p-6 selection:bg-emerald-500/30">
      
      {/* Structural Gridlines & Dot Matrix Blueprint (Brillance Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Modern Card Container with Precise Corner Accents */}
      <div className="bg-[#121214]/60 w-full max-w-md p-10 rounded-xl border border-[#1f1f23] backdrop-blur-md relative z-10 shadow-2xl">
        
        {/* Subtle Decorative Accent Lines in the Corners */}
        <div className="hidden sm:block absolute -top-3 -left-3 w-6 h-6 border-t border-l border-zinc-700"></div>
        <div className="hidden sm:block absolute -top-3 -right-3 w-6 h-6 border-t border-r border-zinc-700"></div>
        <div className="hidden sm:block absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-zinc-700"></div>
        <div className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-zinc-700"></div>

        {/* Header/Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 font-mono tracking-widest text-lg font-bold mb-2">
            <span className="text-white">PAY</span>
            <span className="text-emerald-400">ROLLER</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-serif tracking-tight font-light text-zinc-100">Welcome Back</h1>
          <p className="text-xs text-zinc-400 font-mono tracking-wide mt-1 uppercase">Secure Gate Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error Message Display */}
          {error && (
            <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded text-xs font-mono">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., your.name@payroller.co.ke"
              required
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3.5 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#09090b] border border-[#1f1f23] text-zinc-200 px-4 py-3.5 rounded text-sm outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-white hover:bg-emerald-400 text-[#09090b] font-bold py-3.5 px-4 rounded text-xs font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Authenticating...' : 'Establish Session'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-10 text-[10px] font-mono tracking-wider text-zinc-500 border-t border-[#1f1f23] pt-6 uppercase">
          Need system access? Contact your administrator.
        </div>

      </div>
    </div>
  );
};

export default Login;