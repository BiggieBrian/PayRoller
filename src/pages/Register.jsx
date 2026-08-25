import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getAccessForJobTitle } from "../utils/roles";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract onboarding data passed from the Admin's invitation link
  const restaurantId = searchParams.get("restaurant_id");
  const assignedRole = searchParams.get("role") || "employee";
  const baseSalary = searchParams.get("basic_salary") || "0";

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Custom Employee Details (from your database schema)
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Upsert the profile row with ALL custom inputs (overwrites the trigger's blank row)
        const { role: derivedRole, access_level: derivedAccessLevel } =
          getAccessForJobTitle(assignedRole);

        const { error: profileError } = await supabase.from("profiles").upsert(
          [
            {
              id: authData.user.id, // Matches the Auth UUID
              full_name: fullName,
              role: derivedRole, // 'admin' for Director/Manager/Accountant, 'employee' otherwise
              access_level: derivedAccessLevel, // governs what the admin dashboard shows them
              job_title: assignedRole, // e.g., 'Chef', 'Waiter', 'Manager'
              restaurant_id: restaurantId,
              basic_salary: parseFloat(baseSalary),
              fixed_salary: parseFloat(baseSalary), // Non-nullable
              join_date: new Date().toISOString().split("T")[0], // Non-nullable
              status: "active", // Employment status

              // Form custom fields (no longer NULL!)
              national_id: nationalId || null,
              phone_number: phoneNumber || null,
              bank_name: bankName || null,
              bank_branch: bankBranch || null,
              bank_account_number: bankAccountNumber || null,
            },
          ],
          { onConflict: "id" } // Tells Supabase: "If this ID profile exists already (from the trigger), update it!"
        );

        if (profileError) throw profileError;

        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative font-sans selection:bg-emerald-500/30 flex items-center justify-center py-12 px-6">
      {/* Structural Architectural Gridlines & Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <div className="w-full max-w-2xl bg-[#121214]/80 border border-[#1f1f23] rounded-2xl p-8 md:p-10 backdrop-blur-md relative z-10 shadow-2xl">
        {/* Header/Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 font-mono tracking-widest text-xl font-bold mb-3">
            <span className="text-white">PAY</span>
            <span className="text-emerald-400">ROLLER</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-light text-white tracking-tight">
            Employee Onboarding
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm mt-2 font-mono">
            Complete your profile details to finalize registration.
          </p>

          {assignedRole && (
            <div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-emerald-400 uppercase mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Assigned Position: {assignedRole}
            </div>
          )}
        </div>

        {success ? (
          <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 p-8 rounded-xl text-center space-y-3">
            <h3 className="font-mono text-base tracking-wide uppercase font-bold text-emerald-400">
              Registration Successful!
            </h3>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              Your employee profile has been created successfully. Redirecting you to the sign-in portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-8">
            {error && (
              <div className="bg-red-950/40 border border-red-800/60 text-red-300 p-4 rounded-lg text-xs font-mono">
                {error}
              </div>
            )}

            {/* Section 1: Account Credentials */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
                  01 // Account Information
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Collins Oduor"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@email.com"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Personal Identity Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
                  02 // Identity Verification
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    National ID / Passport No.
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g., 38291029"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., +254 712 345678"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bank Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
                  03 // Payment & Banking Routing
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., KCB, Equity"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g., Kitengela"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono tracking-wider uppercase mb-2 text-zinc-400">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g., 1209384729"
                    required
                    className="w-full bg-[#09090b] border border-[#1f1f23] p-3 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-[#09090b] py-4 rounded font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-[0.99] mt-6 shadow-lg shadow-emerald-500/5 cursor-pointer"
            >
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>
        )}

        <div className="text-center mt-8 text-xs font-mono text-zinc-500 border-t border-[#1f1f23] pt-6">
          Already registered?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-emerald-400 hover:underline uppercase tracking-wider ml-1"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;