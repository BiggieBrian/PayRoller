import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function OwnerDashboard() {
  // 1. Password Protection State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState("");

  // 2. Data State
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Verification Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const targetPassword = import.meta.env.VITE_OWNER_PASSWORD || "AdminPass123";
    
    if (passwordInput === targetPassword) {
      setIsAuthenticated(true);
      setPassError("");
    } else {
      setPassError("Invalid owner access credential key.");
    }
  };

  // Fetch business accounts directly from the restaurants table
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, created_at, trial_start_timestamp, trial_end_timestamp, is_subscription_active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurants();
    }
  }, [isAuthenticated]);

  // Toggle subscription switch handler straight to Supabase
 // Toggle subscription switch handler with automatic 30-day extension logic
 const handleToggleSubscription = async (restaurantId, currentSubscriptionState) => {
    const nextSubscriptionState = !currentSubscriptionState;
    setUpdatingId(restaurantId);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // An old timestamp safely in the past to completely invalidate active grace periods
    const expiredTimestamp = new Date(0).toISOString(); 

    const originalRestaurant = restaurants.find(r => r.id === restaurantId);

    // Optimistic UI state update
    setRestaurants((prev) =>
      prev.map((r) => 
        r.id === restaurantId 
          ? { 
              ...r, 
              is_subscription_active: nextSubscriptionState,
              // Explicitly kill the timeline locally if we are suspending them
              trial_end_timestamp: nextSubscriptionState ? thirtyDaysFromNow : expiredTimestamp 
            } 
          : r
      )
    );

    try {
      // Build update payload dynamically
      const updateData = { 
        is_subscription_active: nextSubscriptionState,
        // Ensure database time updates accurately based on action type
        trial_end_timestamp: nextSubscriptionState ? thirtyDaysFromNow : expiredTimestamp
      };

      const { error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId);

      if (error) throw error;

      const restaurantName = originalRestaurant ? originalRestaurant.name : "Test Restaurant";
      const statusIcon = nextSubscriptionState ? "🟢 ACTIVE" : "🔴 SUSPENDED";
      const durationText = nextSubscriptionState ? "Extended for 30 Days." : "Access Cut Off.";
      
      sendFreeWhatsAppAlert(
        `🚨 *PayRoller System Update*\n\n*Workspace:* ${restaurantName}\n*Status:* ${statusIcon}\n*Action:* ${durationText}`
      );

    } catch (err) {
      alert("Failed to update workspace timeline: " + err.message);
      // Revert back safely if network breaks or RLS rejects the transaction
      if (originalRestaurant) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restaurantId ? originalRestaurant : r))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter matching accounts locally
  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendFreeWhatsAppAlert = async (messageText) => {
  const yourPhoneNumber = "254707178642"; // 👈 Put your number here (include country code, no + or spaces)
  const myApiKey = "6201505";         // 👈 Put your CallMeBot API key here
  const encodedMessage = encodeURIComponent(messageText);
  const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${yourPhoneNumber}&text=${encodedMessage}&apikey=${myApiKey}`;

  try {
    // CallMeBot uses a simple image request in the background, so we use 'no-cors' mode
    await fetch(apiUrl, { method: "GET", mode: "no-cors" });
    console.log("WhatsApp alert sent!");
  } catch (err) {
    console.error("Error sending WhatsApp notification:", err);
  }
};

  // --- PASSWORD WALL SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-[#121214] border border-[#1f1f23] rounded-xl p-6 space-y-4 shadow-2xl">
          <div className="text-center">
            <h2 className="text-md font-bold text-white tracking-tight">Owner Control Panel</h2>
            <p className="text-xs text-zinc-500 mt-1">Enter master token pass to manage subscription states.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-amber-500/50 rounded-lg p-2.5 text-white text-sm text-center font-mono outline-none tracking-widest transition-all"
            />
            {passError && <p className="text-[10px] text-red-400 font-medium text-center">{passError}</p>}
            
            <button
              type="submit"
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-2 rounded-lg text-xs transition-all"
            >
              Verify Passkey
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- PROTECTED TRACKER INTERFACE ---
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header section */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1f1f23] pb-5">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Manual Subscription Tracker</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Instant manual access status changes for client workspaces.</p>
          </div>
          <button
            onClick={fetchRestaurants}
            disabled={loading}
            className="bg-[#121214] hover:bg-zinc-900 text-zinc-400 hover:text-white border border-[#1f1f23] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all self-start"
          >
            {loading ? "Refreshing..." : "Sync Latest Feeds"}
          </button>
        </header>

        {/* Live Filter Search Input */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Filter by restaurant name or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-[#1f1f23] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Dashboard Grid */}
        {loading && restaurants.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono animate-pulse">
            RETRIEVING MASTER BUSINESS RECORDS...
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono">
            No dynamic workspace records match criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((res) => {
              const trialEnd = new Date(res.trial_end_timestamp);
              const isTrialActive = new Date() <= trialEnd;

              return (
                <div
                  key={res.id}
                  className="bg-[#121214] border border-[#1f1f23] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white text-sm tracking-tight truncate max-w-[150px]">
                        {res.name || "Unnamed Restaurant"}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                          res.is_subscription_active
                            ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                            : isTrialActive
                            ? "bg-amber-950/40 border-amber-900/50 text-amber-400"
                            : "bg-red-950/40 border-red-900/50 text-red-400"
                        }`}
                      >
                        {res.is_subscription_active ? "Premium Active" : isTrialActive ? "Free Trial" : "Expired"}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      ID: {res.id}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Trial Ends: {trialEnd.toLocaleDateString()}
                    </div>
                  </div>

                  {/* Switch Mechanism */}
                  <div className="pt-3 border-t border-[#1f1f23]/60 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-medium">Subscription Status</span>
                    <button
                      disabled={updatingId === res.id}
                      onClick={() => handleToggleSubscription(res.id, res.is_subscription_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        res.is_subscription_active
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-red-600 hover:bg-red-500 text-white"
                      }`}
                    >
                      {updatingId === res.id
                        ? "Saving..."
                        : res.is_subscription_active
                        ? "🟢 Active"
                        : "🔴 Suspended"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}