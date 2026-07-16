import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-400"></div>
      </div>
    );
  }

  // Not logged in -> redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role -> redirect to respective default dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/employee" replace />;
  }

  return children;
}