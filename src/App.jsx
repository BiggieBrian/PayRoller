import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Existing Pages & Guards
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeePortal from "./pages/EmployeePortal";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// New Onboarding Pages
import LandingPage from "./pages/LandingPage";
import RestaurantSetup from "./pages/RestaurantSetup";

// Standalone Owner Panel Component
import OwnerDashboard from "./pages/OwnerDasboard";

function App() {
  // Pull user, role, loading, and the newly exposed restaurant profile details
  const { user, role, restaurant, loading } = useAuth();

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
    if (!user) return "/";
    if (role === "admin") return "/admin";
    if (role === "employee") return "/employee";
    // If authenticated but has NO role/profile, send them to setup!
    return "/setup-restaurant";
  };

  // Evaluates billing structures against standard server time offsets
  const evaluateAccessStatus = (restaurantData) => {
    if (!restaurantData) return { isLocked: false, mode: "TRIAL" };

    const now = new Date();
    const trialEnd = new Date(restaurantData.trial_end_timestamp);

    // Condition 1: If subscription is manually turned off/inactive -> Engage Intercept Layout
    if (restaurantData.is_subscription_active === false) {
      return { isLocked: true, mode: "LOCKED" };
    }

    // Condition 2: Within the 2-month trial window -> Allow Entry
    if (now <= trialEnd) {
      return { isLocked: false, mode: "TRIAL" };
    }

    // Condition 3: Active premium fallback -> Allow Entry
    if (restaurantData.is_subscription_active === true) {
      return { isLocked: false, mode: "PREMIUM" };
    }

    // Condition 4: Deadlines missed -> Engage Intercept Layout
    return { isLocked: true, mode: "LOCKED" };
  };

  // Run the state verification dynamically straight from Supabase profile data
  const access = evaluateAccessStatus(restaurant);

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Master Owner Password-Protected Management Panel */}
        <Route path="/owner-hidden-tracker" element={<OwnerDashboard />} />

        {/* Onboarding Route */}
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
          element={!user ? <Login /> : <Navigate to={getHomePath()} replace />}
        />

        {/* Guarded Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              {/* We pass down whether the admin dashboard needs to overlay the manual payment model */}
              <AdminDashboard isPaywallLocked={access.isLocked} />
            </ProtectedRoute>
          }
        />

        {/* Guarded Employee/Waiter Portal */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              {access.isLocked ? (
                /* Immediate terminal lockout layout when the restaurant's system expires */
                <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 font-mono select-none">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
                  <div className="bg-[#121214] border border-[#1f1f23] max-w-sm w-full p-8 rounded-xl text-center relative z-10 shadow-2xl">
                    <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-950/20 border border-red-900/30 px-3 py-1.5 rounded inline-block mb-4">
                      Terminal Deactivated
                    </p>
                    <h2 className="text-lg text-zinc-200 font-serif font-light tracking-tight">
                      Workspace Suspended
                    </h2>
                    <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                      This business portal session has expired. Please notify
                      management to fulfill standard system renewal.
                    </p>
                  </div>
                </div>
              ) : (
                <EmployeePortal />
              )}
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to={getHomePath()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;