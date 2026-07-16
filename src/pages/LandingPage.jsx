import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black tracking-wider text-emerald-400">PayRoller</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/setup-restaurant" className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-all">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <span className="bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Payroll management made simple
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Streamline your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">restaurant payroll</span> without the headache.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Manage employees, track monthly advances, process deductions, and generate secure login credentials for your entire kitchen and floor staff. 
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center w-full max-w-md mb-16">
          <Link to="/setup-restaurant" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-emerald-950/40 transition-all text-center">
            Register Restaurant
          </Link>
          <Link to="/login" className="bg-slate-905 border border-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-lg transition-all text-center">
            Admin Login
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left mt-4 border-t border-slate-900 pt-16">
          <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-xl">
            <div className="text-emerald-400 text-2xl mb-3">📋</div>
            <h3 className="font-bold text-lg mb-2">Flexible Setup</h3>
            <p className="text-sm text-slate-400">Quickly onboard your restaurant and customize basic salaries, system deductions, and monthly schedules.</p>
          </div>
          <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-xl">
            <div className="text-emerald-400 text-2xl mb-3">🔐</div>
            <h3 className="font-bold text-lg mb-2">Staff Credentials</h3>
            <p className="text-sm text-slate-400">Generate secure portal logins automatically for all staff members so they can view their pay slips and work schedules.</p>
          </div>
          <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-xl">
            <div className="text-emerald-400 text-2xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2">Real-Time Adjustments</h3>
            <p className="text-sm text-slate-400">Easily deduct for breakages, update advances, and log shortfalls dynamically as the busy month progresses.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} PayRoller. All rights reserved.</p>
      </footer>
    </div>
  );
}