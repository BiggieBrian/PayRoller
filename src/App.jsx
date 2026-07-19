import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Existing Pages & Guards
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeePortal from './pages/EmployeePortal';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// New Onboarding Pages
import LandingPage from './pages/LandingPage';
import RestaurantSetup from './pages/RestaurantSetup';

function App() {
  // Destructure 'loading' from your refactored AuthContext
  const { user, role, loading } = useAuth();

  // 1. Loading Guard: Prevents race conditions and early routing decisions 
  // while profile data is being fetched over the live network.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="flex items-center gap-1.5 font-mono tracking-widest text-sm font-bold mb-3">
          <span>PAY</span>
          <span className="text-emerald-400">ROLLER</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase animate-pulse">
          Synchronizing Secure Session...
        </p>
      </div>
    );
  }

  // Helper to determine home path based on role
  const getHomePath = () => {
    if (!user) return '/';
    if (role === 'admin') return '/admin';
    if (role === 'employee') return '/employee';
    // If authenticated but has NO role/profile, send them to setup!
    return '/setup-restaurant';
  };

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 
          Onboarding Route:
          - If NOT logged in: Show Setup page so they can sign up.
          - If logged in but NO role: Let them see Setup so they can finish onboarding.
          - If logged in WITH a role: Redirect to their dashboard.
        */}
        <Route 
          path="/setup-restaurant" 
          element={
            !user || !role ? (
              <RestaurantSetup />
            ) : (
              <Navigate to={getHomePath()} replace />
            )
          } 
        />

        <Route path="/register" element={<Register />} />

        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            !user ? (
              <Login />
            ) : (
              <Navigate to={getHomePath()} replace />
            )
          } 
        />

        {/* Guarded Admin Dashboard */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Guarded Employee Portal */}
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeePortal />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Catch-all Route */}
        <Route 
          path="*" 
          element={
            <Navigate to={getHomePath()} replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;