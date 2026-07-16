import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Adjust path to match your client location

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
        const { error: profileError } = await supabase.from("profiles").upsert(
          [
            {
              id: authData.user.id, // Matches the Auth UUID
              full_name: fullName,
              role: "employee", // Satisfies user_role ENUM
              job_title: assignedRole, // e.g., 'Chef', 'Waiter'
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
          { onConflict: "id" }, // Tells Supabase: "If this ID profile exists already (from the trigger), update it!"
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="bg-slate-900 w-full max-w-xl p-10 rounded-2xl border border-slate-800 shadow-2xl">
        {/* Header/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-emerald-400 tracking-tighter">
            PayRoller
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Complete your employee onboarding registration.
          </p>
          {assignedRole && (
            <span className="inline-block mt-3 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Position: {assignedRole}
            </span>
          )}
        </div>

        {success ? (
          <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 p-6 rounded-xl text-center space-y-2">
            <h3 className="font-bold text-lg">Registration Successful!</h3>
            <p className="text-sm text-emerald-400/80">
              Your profile has been created successfully. Redirecting you to
              login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 p-4 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Section 1: Account Credentials */}
            <div>
              <h3 className="text-emerald-400 font-bold text-md mb-4 border-b border-slate-800 pb-2">
                1. Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Collins Oduor"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@email.com"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Personal Identity Details */}
            <div>
              <h3 className="text-emerald-400 font-bold text-md mb-4 border-b border-slate-800 pb-2">
                2. Identity Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    National ID / Passport No.
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g., 38291029"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., +254 712 345678"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bank Details */}
            <div>
              <h3 className="text-emerald-400 font-bold text-md mb-4 border-b border-slate-800 pb-2">
                3. Payment & Banking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., KCB, Equity"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g., Kitengela"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g., 1209384729"
                    required
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition duration-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 p-4 rounded-xl font-bold text-lg tracking-tight transition duration-200 focus:ring-4 focus:ring-emerald-400/30 outline-none active:scale-[0.98] mt-4"
            >
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>
        )}

        <div className="text-center mt-8 text-sm text-slate-500 border-t border-slate-800 pt-6">
          Already registered?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-emerald-400 hover:underline font-semibold"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
