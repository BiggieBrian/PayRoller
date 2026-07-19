import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import EmployeeCard from "../components/EmployeeCard";
import {
  CheckCircle,
  Coins,
  Plus,
  Minus,
  FileSpreadsheet,
  RefreshCw,
  Menu,
  X,
  Users,
  Wallet,
  Mail,
  LayoutDashboard,
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer state
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'directory', 'payroll'
  const [loading, setLoading] = useState(true);
  const [dbEmployees, setDbEmployees] = useState([]); // Master copy from DB for state tracking
  const [employees, setEmployees] = useState([]); // Local draft state
  const [activeShifts, setActiveShifts] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");

  // Onboarding invite states
  const [inviteRole, setInviteRole] = useState("Waiter");
  const [inviteBaseSalary, setInviteBaseSalary] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const showNotice = (text, type = "info") => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: "", type: "" }), 5000);
  };

  // Check if our local draft state differs from our DB master copies
  const hasUnsavedChanges =
    JSON.stringify(dbEmployees) !== JSON.stringify(employees);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setAdminProfile(profileData);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("restaurant_id", profileData.restaurant_id)
        .order("full_name", { ascending: true });

      if (employeesError) throw employeesError;

      const cleanEmployees = employeesData || [];
      setDbEmployees(JSON.parse(JSON.stringify(cleanEmployees))); // Deep copy for comparison
      setEmployees(cleanEmployees);

      // Fetch active shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from("shifts")
        .select(
          `
          *,
          profiles!employee_id ( full_name, job_title, restaurant_id )
        `,
        )
        .is("clock_out", null);

      if (shiftsError) throw shiftsError;

      const tenantActiveShifts = (shiftsData || []).filter(
        (shift) => shift.profiles?.restaurant_id === profileData.restaurant_id,
      );
      setActiveShifts(tenantActiveShifts);
    } catch (err) {
      showNotice(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler 1: Update fields locally
  const handleLocalFieldChange = (employeeId, fieldName, value) => {
    const numericValue = parseFloat(value) || 0;
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          return { ...emp, [fieldName]: numericValue };
        }
        return emp;
      }),
    );
  };

  // Handler 2: Bulk batch save local state back to Supabase
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const promises = employees.map((emp) =>
        supabase
          .from("profiles")
          .update({
            full_name: emp.full_name,
            role: emp.role || "employee",
            job_title: emp.job_title,
            bank_name: emp.bank_name,
            account_number: emp.account_number,
            basic_salary: Number(emp.basic_salary || 0),
            overtime: Number(emp.overtime || 0),
            system_deduction: Number(emp.system_deduction || 0),
            shorts: Number(emp.shorts || 0),
            advance: Number(emp.advance || 0),
            breakages: Number(emp.breakages || 0),
          })
          .eq("id", emp.id),
      );

      await Promise.all(promises);

      setDbEmployees(JSON.parse(JSON.stringify(employees)));
      showNotice("All edits synced and saved safely to database!", "success");
    } catch (err) {
      showNotice(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler 3: Discard local adjustments
  const handleDiscardChanges = () => {
    if (
      window.confirm("Are you sure you want to discard your unsaved edits?")
    ) {
      setEmployees(JSON.parse(JSON.stringify(dbEmployees)));
      showNotice("Unsaved changes discarded.", "info");
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm("Are you sure you want to remove this employee?"))
      return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);

      if (error) throw error;
      showNotice("Employee profile removed successfully.", "success");
      fetchData();
    } catch (err) {
      showNotice(err.message, "error");
    }
  };

  const handleGenerateInvite = () => {
    if (!adminProfile) return;
    const origin = window.location.origin;
    const link = `${origin}/register?restaurant_id=${adminProfile.restaurant_id}&role=${encodeURIComponent(inviteRole)}&basic_salary=${inviteBaseSalary || 0}`;
    setGeneratedLink(link);
    showNotice("Invite link created!", "success");
  };

  const downloadPayrollSpreadsheet = () => {
    if (employees.length === 0) {
      showNotice("No employee data available to export", "error");
      return;
    }

    const headers = [
      "NAME",
      "POSITION",
      "BANK NAME",
      "ACC NO.",
      "BASIC SALARY",
      "BONUS",
      "SYSTEM DEDUCTION",
      "SHORTS",
      "ADVANCE",
      "BREAKAGES",
      "TOTAL DEDUCTIONS",
      "NET SALARY",
    ];

    let sumBasic = 0,
      sumBonus = 0,
      sumSys = 0,
      sumShorts = 0,
      sumAdv = 0,
      sumBreak = 0,
      sumDeduct = 0,
      sumNet = 0;

    const rows = employees.map((emp) => {
      const basic = Number(emp.basic_salary || 0);
      const bonus = Number(emp.overtime || 0);
      const sys = Number(emp.system_deduction || 0);
      const shorts = Number(emp.shorts || 0);
      const adv = Number(emp.advance || 0);
      const breakages = Number(emp.breakages || 0);

      const deductions = sys + shorts + adv + breakages;
      const net = Math.max(0, basic + bonus - deductions);

      sumBasic += basic;
      sumBonus += bonus;
      sumSys += sys;
      sumShorts += shorts;
      sumAdv += adv;
      sumBreak += breakages;
      sumDeduct += deductions;
      sumNet += net;

      return [
        `"${emp.full_name || ""}"`,
        `"${emp.job_title || ""}"`,
        `"${emp.bank_name || ""}"`,
        `'${emp.account_number || ""}`,
        basic,
        bonus,
        sys,
        shorts,
        adv,
        breakages,
        deductions,
        net,
      ];
    });

    const totals = [
      "TOTALS",
      "",
      "",
      "",
      sumBasic,
      sumBonus,
      sumSys,
      sumShorts,
      sumAdv,
      sumBreak,
      sumDeduct,
      sumNet,
    ];

    const monthLabel = new Date()
      .toLocaleString("default", { month: "long", year: "numeric" })
      .toUpperCase();
    const sheetTitle = `"${adminProfile?.restaurant_id ? "WHIZPERZ" : "PAYROLLER"} ${monthLabel} PAY ROLL",,,,,,,,,,,`;

    const csvContent = [
      sheetTitle,
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      totals.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${monthLabel.replace(" ", "_")}_Payroll.csv`;
    link.click();
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleWhatsAppShare = () => {
  if (!generatedLink) return;

  if (!invitePhone) {
    showNotice("Please enter a phone number first", "error");
    return;
  }

  // 1. Clean up non-digits and drop a leading '0' if typed out of habit
  let sanitizedBody = invitePhone.replace(/\D/g, "").replace(/^0/, "");

  // 2. Strict validation for Kenyan local mobile number length (9 digits after country code badge)
  if (sanitizedBody.length !== 9) {
    showNotice("Please enter a valid 9-digit mobile number.", "error");
    return;
  }

  // 3. Attach the locked country code safely
  const completePhoneNumber = `254${sanitizedBody}`;

  // Format the salary cleanly for readability
  const formattedSalary = inviteBaseSalary
    ? Number(inviteBaseSalary).toLocaleString()
    : "Not Specified";

  // Craft a professional message with clean line breaks
  const message =
    `📢 *Onboarding Invitation*\n\n` +
    `You have been invited to join our team on PayRoller!\n\n` +
    `• *Position/Role:* ${inviteRole}\n` +
    `• *Starting Basic Salary:* Ksh ${formattedSalary}\n\n` +
    `Please click the link below to complete your profile and access your staff portal:\n` +
    `${generatedLink}`;

  // Encode text for URL safety
  const encodedMessage = encodeURIComponent(message);

  // 4. Fire the window.open with the formatted completePhoneNumber string
  window.open(
    `https://api.whatsapp.com/send?phone=${completePhoneNumber}&text=${encodedMessage}`,
    "_blank",
  );
};
  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans antialiased overflow-x-hidden">
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1f1f23] bg-[#09090b] flex flex-col justify-between p-5 shrink-0
        transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="space-y-6">
          {/* Brand Logo & Mobile Close Trigger */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                P
              </div>
              <span className="font-bold text-white tracking-tight text-sm">
                PayRoller Admin
              </span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-zinc-500 hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block px-2 mb-2">
                Workspace
              </span>
              <nav className="space-y-1">
                {/* Tab 1: Overview */}
                <button
                  onClick={() => {
                    setActiveTab("overview");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === "overview"
                      ? "text-white bg-[#121214] border border-[#1f1f23]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Overview</span>
                </button>

                {/* Tab 2: Directory */}
                <button
                  onClick={() => {
                    setActiveTab("directory");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === "directory"
                      ? "text-white bg-[#121214] border border-[#1f1f23]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users size={14} />
                  <span>Employee Directory</span>
                </button>

                {/* Tab 3: Payroll Hub */}
                <button
                  onClick={() => {
                    setActiveTab("payroll");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === "payroll"
                      ? "text-white bg-[#121214] border border-[#1f1f23]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Wallet size={14} />
                  <span>Payroll Hub</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Actions Sidebar Footer */}
        <div className="border-t border-[#1f1f23] pt-4 space-y-2">
          <button
            onClick={fetchData}
            className="w-full bg-[#121214] hover:bg-zinc-900 border border-[#1f1f23] px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-2 text-zinc-400 hover:text-white"
          >
            <RefreshCw size={12} />
            <span>Refresh Database</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* MOBILE TOP NAVIGATION BAR */}
        <header className="md:hidden h-14 border-b border-[#1f1f23] flex items-center justify-between px-4 bg-[#09090b] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-zinc-400 hover:text-white focus:outline-none rounded-lg border border-[#1f1f23] bg-[#121214]"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-emerald-500 flex items-center justify-center text-black font-bold text-[10px]">
                P
              </div>
              <span className="font-bold text-white tracking-tight text-xs">
                PayRoller
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            /{activeTab}
          </span>
        </header>

        {/* DESKTOP HEADER NAVBAR */}
        <header className="hidden md:flex h-14 border-b border-[#1f1f23] items-center justify-between px-8 bg-[#09090b]">
          <div className="text-xs text-zinc-500 font-mono">
            payroller &gt; {activeTab}
          </div>
        </header>

        {/* Toast Notification Container */}
        {notice.text && (
          <div
            className={`fixed top-16 right-4 sm:top-6 sm:right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold transition-all ${
              notice.type === "error"
                ? "bg-red-950/90 border-red-900/60 text-red-200"
                : "bg-emerald-950/90 border-emerald-900/60 text-emerald-200"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Main Active View Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-24 text-zinc-500 text-xs font-medium animate-pulse tracking-wide font-mono">
              SYNCING LEDGERS & METRICS...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Metric Cards Grid - Adjusted to 2 equal columns spanning full width */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-[#121214] border border-[#1f1f23] p-5 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Total Active Staff
                      </span>
                      <span className="text-2xl font-bold tracking-tight text-white mt-2">
                        {employees.length} Members
                      </span>
                    </div>

                    <div className="bg-[#121214] border border-[#1f1f23] p-5 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Calculated Net Liability
                      </span>
                      <span className="text-2xl font-bold tracking-tight text-white mt-2">
                        Ksh{" "}
                        {employees
                          .reduce((acc, emp) => {
                            const basic = Number(emp.basic_salary || 0);
                            const bonus = Number(emp.overtime || 0);
                            const ded =
                              Number(emp.system_deduction || 0) +
                              Number(emp.shorts || 0) +
                              Number(emp.advance || 0) +
                              Number(emp.breakages || 0);
                            return acc + Math.max(0, basic + bonus - ded);
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Overview Layout - Removed 'max-w-2xl mx-auto' to let it span the full container width */}
                  <div className="bg-[#121214] border border-[#1f1f23] rounded-xl p-5 sm:p-8 space-y-6">
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        Onboarding Invitation Engine
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        Generate dynamic invite codes linked directly to your
                        dashboard.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Input Fields Panel */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Pre-assign Position/Role
                          </label>
                          <select
                            disabled={!!generatedLink}
                            className="w-full bg-[#09090b] border border-[#1f1f23] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                          >
                            <option value="Waiter">Waiter</option>
                            <option value="Chef">Chef</option>
                            <option value="Cashier">Cashier</option>
                            <option value="Steward">Steward</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Starting Basic Salary (Ksh)
                          </label>
                          <input
                            type="number"
                            disabled={!!generatedLink}
                            placeholder="e.g. 15000"
                            className="w-full bg-[#09090b] border border-[#1f1f23] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                            value={inviteBaseSalary}
                            onChange={(e) =>
                              setInviteBaseSalary(e.target.value)
                            }
                          />
                        </div>

                        {/* New Phone Number Input (Spans full width on small screens) */}
                        <div className="sm:col-span-2">
  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
    Recipient Phone Number (WhatsApp)
  </label>
  <div className="relative flex items-center">
    {/* Permanent un-deletable visual prefix */}
    <span className="absolute left-3 text-zinc-500 font-mono text-sm select-none pointer-events-none">
      254
    </span>
    <input
      type="tel"
      disabled={!!generatedLink}
      placeholder="712345678"
      className="w-full bg-[#09090b] border border-[#1f1f23] rounded-lg p-2.5 pl-11 text-white focus:outline-none focus:border-emerald-500/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      value={invitePhone}
      onChange={(e) => {
        // Enforce numbers only and limit to 9 digits maximum (after the 254)
        const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 9);
        setInvitePhone(cleanValue);
      }}
    />
  </div>
  {!generatedLink && (
    <span className="text-[10px] text-zinc-600 mt-1 block font-mono">
      Type the 9-digit mobile number (e.g., 712345678). Country code is locked.
    </span>
  )}
</div>
                      </div>

                      {/* Primary Link Generation Call to Action / Reset State */}
                      {!generatedLink ? (
                        <button
                          onClick={handleGenerateInvite}
                          className="w-full bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold py-2.5 rounded-lg transition-all"
                        >
                          Generate Invitation Link
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            // Explicitly clear states to prepare for a brand-new generation
                            setGeneratedLink("");
                            setInviteRole("Waiter");
                            setInviteBaseSalary("");
                            setInvitePhone("");
                          }}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-[#1f1f23] text-emerald-400 hover:text-white font-medium py-2.5 rounded-lg transition-all"
                        >
                          Reset & Create Another Invitation
                        </button>
                      )}

                      {/* Resulting Link & Share Panel */}
                      {generatedLink && (
                        <div className="bg-[#09090b] border border-emerald-500/20 p-4 rounded-lg mt-4 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-emerald-500 block uppercase tracking-wider font-bold">
                              ✓ Active Onboarding URL Locked:
                            </span>
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              Ready to Share
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              readOnly
                              value={generatedLink}
                              className="w-full bg-[#121214] border border-[#1f1f23] text-xs text-emerald-400 rounded-lg px-3 py-2.5 select-all focus:outline-none font-mono"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedLink);
                                  showNotice("Copied to clipboard!", "success");
                                }}
                                className="bg-zinc-900 hover:bg-zinc-800 border border-[#1f1f23] text-white py-2 px-4 rounded-lg text-xs font-semibold transition-all text-center"
                              >
                                Copy Link
                              </button>

                              <button
                                onClick={handleWhatsAppShare}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <svg
                                  className="w-3.5 h-3.5 fill-current shrink-0"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 1.981 14.062.96 11.43.96c-5.44 0-9.866 4.372-9.87 9.802 0 1.63.45 3.22 1.302 4.622L1.844 21.5l6.327-1.631z" />
                                </svg>
                                Send to WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIRECTORY */}
              {activeTab === "directory" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Search by name or position..."
                      className="w-full sm:max-w-md bg-[#121214] border border-[#1f1f23] rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-emerald-500/40"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                      No matching employees found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEmployees.map((emp) => (
                        <EmployeeCard
                          key={emp.id}
                          employee={emp}
                          onUpdate={(id, updatedData) => {
                            setEmployees((prev) =>
                              prev.map((item) =>
                                item.id === id
                                  ? { ...item, ...updatedData }
                                  : item,
                              ),
                            );
                          }}
                          onDelete={handleDeleteProfile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYROLL HUB */}
              {activeTab === "payroll" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        Monthly Payroll Run
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        Adjust monthly parameters below. Changes are held as
                        local draft until saved via the footer banner.
                      </p>
                    </div>
                    <button
                      onClick={downloadPayrollSpreadsheet}
                      className="w-full sm:w-auto bg-[#121214] hover:bg-zinc-900 text-white border border-[#1f1f23] px-4 py-2.5 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Export Payroll (.csv)</span>
                    </button>
                  </div>

                  {employees.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[#1f1f23] rounded-lg text-zinc-500 text-xs font-mono">
                      No employee profiles registered to calculate payroll for.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {employees.map((emp) => {
                        const basic = Number(emp.basic_salary || 0);
                        const bonus = Number(emp.overtime || 0);

                        const sys = Number(emp.system_deduction || 0);
                        const shorts = Number(emp.shorts || 0);
                        const adv = Number(emp.advance || 0);
                        const breakages = Number(emp.breakages || 0);
                        const totalDeductions = sys + shorts + adv + breakages;

                        const netPay = Math.max(
                          0,
                          basic + bonus - totalDeductions,
                        );

                        return (
                          <div
                            key={emp.id}
                            className="bg-[#121214] border border-[#1f1f23] rounded-xl p-5 hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm"
                          >
                            <div>
                              {/* Header: Name & Role Badge */}
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-white text-md tracking-tight">
                                    {emp.full_name}
                                  </h3>
                                  <span className="inline-block bg-zinc-900 text-emerald-400 text-[9px] font-semibold px-2 py-0.5 rounded border border-[#1f1f23] uppercase tracking-wider mt-1.5">
                                    {emp.job_title || "Staff"}
                                  </span>
                                </div>
                              </div>

                              <hr className="border-[#1f1f23]/60 my-4" />

                              {/* Base Salary Line */}
                              <div className="flex justify-between items-center text-xs py-2 px-1 text-zinc-400">
                                <span className="font-medium">Base Salary</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-600 font-mono">
                                    KES
                                  </span>
                                  <input
                                    type="number"
                                    value={emp.basic_salary || ""}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleLocalFieldChange(
                                        emp.id,
                                        "basic_salary",
                                        e.target.value,
                                      )
                                    }
                                    className="w-24 bg-[#09090b] border border-[#1f1f23] focus:border-emerald-500/50 text-white px-2 py-1 rounded text-right font-mono text-xs outline-none transition-colors"
                                  />
                                </div>
                              </div>

                              {/* Adjustments (Form Grid) */}
                              <div className="space-y-3.5 mt-4">
                                <div>
                                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    <Plus
                                      size={10}
                                      className="text-emerald-500"
                                    />{" "}
                                    Performance Bonus
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-[10px] text-zinc-600 font-bold font-mono">
                                      KES
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={emp.overtime || ""}
                                      onChange={(e) =>
                                        handleLocalFieldChange(
                                          emp.id,
                                          "overtime",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-emerald-500/50 text-white pl-11 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                      <Minus
                                        size={10}
                                        className="text-red-500"
                                      />{" "}
                                      Salary Advance
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-2 text-[10px] text-zinc-600 font-bold font-mono">
                                        KES
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={emp.advance || ""}
                                        onChange={(e) =>
                                          handleLocalFieldChange(
                                            emp.id,
                                            "advance",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-red-500/50 text-white pl-9 pr-2 py-1.5 rounded-lg text-xs outline-none transition-all font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                      <Minus
                                        size={10}
                                        className="text-red-500"
                                      />{" "}
                                      System Deduct
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-2 text-[10px] text-zinc-600 font-bold font-mono">
                                        KES
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={emp.system_deduction || ""}
                                        onChange={(e) =>
                                          handleLocalFieldChange(
                                            emp.id,
                                            "system_deduction",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-red-500/50 text-white pl-9 pr-2 py-1.5 rounded-lg text-xs outline-none transition-all font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                      <Minus
                                        size={10}
                                        className="text-red-500"
                                      />{" "}
                                      Register Shorts
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-2 text-[10px] text-zinc-600 font-bold font-mono">
                                        KES
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={emp.shorts || ""}
                                        onChange={(e) =>
                                          handleLocalFieldChange(
                                            emp.id,
                                            "shorts",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-red-500/50 text-white pl-9 pr-2 py-1.5 rounded-lg text-xs outline-none transition-all font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                      <Minus
                                        size={10}
                                        className="text-red-500"
                                      />{" "}
                                      Breakages
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-2 text-[10px] text-zinc-600 font-bold font-mono">
                                        KES
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={emp.breakages || ""}
                                        onChange={(e) =>
                                          handleLocalFieldChange(
                                            emp.id,
                                            "breakages",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-red-500/50 text-white pl-9 pr-2 py-1.5 rounded-lg text-xs outline-none transition-all font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Calculations */}
                            <div className="mt-6 pt-4 border-t border-[#1f1f23]/60">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase tracking-widest font-bold">
                                    Calculated Net Payout
                                  </span>
                                  <span className="text-base font-bold text-emerald-400 font-mono">
                                    KES {netPay.toLocaleString()}
                                  </span>
                                </div>
                                <div className="bg-[#09090b] p-2 rounded-lg border border-[#1f1f23]">
                                  <Coins
                                    size={14}
                                    className="text-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Unsaved Edits Notification Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-[#121214] border border-[#1f1f23] rounded-xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-white">
              ⚠️ Unsaved payroll modifications
            </p>
            <p className="text-[10px] text-zinc-500">
              Database values will not change until manually synced.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleDiscardChanges}
              className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-5 py-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 text-black rounded-lg text-xs font-bold transition-all"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
