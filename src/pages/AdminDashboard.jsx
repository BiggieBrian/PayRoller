import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import EmployeeCard from "../components/EmployeeCard";
import { calculateSHA, calculateNSSF, calculateOvertimePay } from "../utils/payrollCalculations";
import { getPermissions } from "../utils/permissions";
import ScanSheetModal from "../components/ScanSheetModal";
import PayrollTable from "../components/PayrollTable";
import OverviewPanel from "../components/OverviewPanel";
import { JOB_TITLES } from "../utils/roles";
import {
  FileSpreadsheet,
  RefreshCw,
  Menu,
  X,
  Users,
  Wallet,
  LayoutDashboard,
  Lock,
  ScanLine
} from "lucide-react";

export default function AdminDashboard({ isPaywallLocked = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer state
  const [requestedTab, setActiveTab] = useState("overview"); // 'overview', 'directory', 'payroll'
  const [loading, setLoading] = useState(true);
  const [dbEmployees, setDbEmployees] = useState([]); // Master copy from DB for state tracking
  const [employees, setEmployees] = useState([]); // Local draft state
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  // Paywall manual submission code state
  const [mpesaCode, setMpesaCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Onboarding invite states
  const [inviteRole, setInviteRole] = useState("Waiter");
  const [inviteBaseSalary, setInviteBaseSalary] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

    const showNotice = useCallback((text, type = "info") => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: "", type: "" }), 5000);
  }, []);

  // What this logged-in admin-route user is actually allowed to see/edit.
  // Owner/Director get everything; Manager is view-only; Accountant only
  // gets the Payroll Hub. Falls back to the most restrictive set if the
  // profile hasn't loaded yet.
  const permissions = getPermissions(adminProfile?.access_level);

    const activeTab =
    requestedTab === "directory" && !permissions.viewDirectory ? "overview" : requestedTab;

  // Check if our local draft state differs from our DB master copies
  const hasUnsavedChanges =
    JSON.stringify(dbEmployees) !== JSON.stringify(employees);

    const loadData = useCallback(async () => {
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

      // Paywall-locked: skip loading sensitive business rows entirely
      if (isPaywallLocked) return;

      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("restaurant_id", profileData.restaurant_id)
        .order("full_name", { ascending: true });

      if (employeesError) throw employeesError;

      // Recompute SHA/NSSF for rows that aren't manually overridden
      const cleanEmployees = (employeesData || []).map((emp) => {
        const gross = Number(emp.basic_salary || 0) + Number(emp.overtime || 0);
        return {
          ...emp,
          sha: emp.sha_is_manual ? Number(emp.sha || 0) : calculateSHA(gross),
          nssf: emp.nssf_is_manual ? Number(emp.nssf || 0) : calculateNSSF(gross).employee,
        };
      });
      setDbEmployees(JSON.parse(JSON.stringify(cleanEmployees)));
      setEmployees(cleanEmployees);
    } catch (err) {
      showNotice(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [isPaywallLocked, showNotice]);

  // Used by the Refresh button and after deleting an employee
  const refresh = () => {
    setLoading(true);
    loadData();
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Handler 1: Update fields locally
  const handleLocalFieldChange = (employeeId, fieldName, value) => {
    const numericValue = parseFloat(value) || 0;
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;

        // Editing SHA/NSSF/overtime pay directly = manual override from
        // here on; hours fields stop driving that particular figure.
        if (fieldName === "sha") {
          return { ...emp, sha: numericValue, sha_is_manual: true };
        }
        if (fieldName === "nssf") {
          return { ...emp, nssf: numericValue, nssf_is_manual: true };
        }
        if (fieldName === "overtime") {
          const updated = { ...emp, overtime: numericValue, overtime_is_manual: true };
          const gross = Number(updated.basic_salary || 0) + numericValue;
          if (!updated.sha_is_manual) updated.sha = calculateSHA(gross);
          if (!updated.nssf_is_manual) updated.nssf = calculateNSSF(gross).employee;
          return updated;
        }

        const updated = { ...emp, [fieldName]: numericValue };

        // Ordinary/rest-day overtime hours changed -> recompute overtime
        // pay from hours (unless overtime was manually overridden), then
        // re-derive gross pay and recompute SHA/NSSF off that.
        if (
          fieldName === "overtime_ordinary_hours" ||
          fieldName === "overtime_restday_hours"
        ) {
          if (!updated.overtime_is_manual) {
            const overtimeCalc = calculateOvertimePay(
              Number(updated.basic_salary || 0),
              Number(updated.overtime_ordinary_hours || 0),
              Number(updated.overtime_restday_hours || 0),
            );
            updated.overtime = overtimeCalc.total;
          }
        }

        // Basic salary or overtime pay changed -> re-derive gross pay and
        // recompute SHA/NSSF, but only for fields the admin hasn't
        // manually overridden.
        if (
          fieldName === "basic_salary" ||
          fieldName === "overtime_ordinary_hours" ||
          fieldName === "overtime_restday_hours"
        ) {
          const gross =
            Number(updated.basic_salary || 0) + Number(updated.overtime || 0);
          if (!updated.sha_is_manual) {
            updated.sha = calculateSHA(gross);
          }
          if (!updated.nssf_is_manual) {
            updated.nssf = calculateNSSF(gross).employee;
          }
        }

        return updated;
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
            fixed_salary: Number(emp.basic_salary || 0), // keep in sync — payslip/PDF read fixed_salary
            overtime: Number(emp.overtime || 0),
            overtime_ordinary_hours: Number(emp.overtime_ordinary_hours || 0),
            overtime_restday_hours: Number(emp.overtime_restday_hours || 0),
            overtime_is_manual: !!emp.overtime_is_manual,
            sha: Number(emp.sha || 0),
            sha_is_manual: !!emp.sha_is_manual,
            nssf: Number(emp.nssf || 0),
            nssf_is_manual: !!emp.nssf_is_manual,
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
      refresh();
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
      "SHA",
      "NSSF",
      "SYSTEM DEDUCTION",
      "SHORTS",
      "ADVANCE",
      "BREAKAGES",
      "TOTAL DEDUCTIONS",
      "NET SALARY",
    ];

    let sumBasic = 0,
      sumBonus = 0,
      sumSha = 0,
      sumNssf = 0,
      sumSys = 0,
      sumShorts = 0,
      sumAdv = 0,
      sumBreak = 0,
      sumDeduct = 0,
      sumNet = 0;

    const rows = employees.map((emp) => {
      const basic = Number(emp.basic_salary || 0);
      const bonus = Number(emp.overtime || 0);
      const sha = Number(emp.sha || 0);
      const nssf = Number(emp.nssf || 0);
      const sys = Number(emp.system_deduction || 0);
      const shorts = Number(emp.shorts || 0);
      const adv = Number(emp.advance || 0);
      const breakages = Number(emp.breakages || 0);

      const deductions = sha + nssf + sys + shorts + adv + breakages;
      const net = Math.max(0, basic + bonus - deductions);

      sumBasic += basic;
      sumBonus += bonus;
      sumSha += sha;
      sumNssf += nssf;
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
        sha,
        nssf,
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
      sumSha,
      sumNssf,
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

  const handleScanApply = (updates) =>
    setEmployees((prev) =>
      prev.map((emp) => {
        const u = updates[emp.id];
        if (!u) return emp;
        const next = { ...emp, ...u };
        const gross = Number(next.basic_salary || 0) + Number(next.overtime || 0);
        if (!next.sha_is_manual) next.sha = calculateSHA(gross);
        if (!next.nssf_is_manual) next.nssf = calculateNSSF(gross).employee;
        return next;
      }),
    );

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

    let sanitizedBody = invitePhone.replace(/\D/g, "").replace(/^0/, "");

    if (sanitizedBody.length !== 9) {
      showNotice("Please enter a valid 9-digit mobile number.", "error");
      return;
    }

    const completePhoneNumber = `254${sanitizedBody}`;

    const formattedSalary = inviteBaseSalary
      ? Number(inviteBaseSalary).toLocaleString()
      : "Not Specified";

    const message =
      `📢 *Onboarding Invitation*\n\n` +
      `You have been invited to join our team on PayRoller!\n\n` +
      `• *Position/Role:* ${inviteRole}\n` +
      `• *Starting Basic Salary:* Ksh ${formattedSalary}\n\n` +
      `Please click the link below to complete your profile and access your staff portal:\n` +
      `${generatedLink}`;

    const encodedMessage = encodeURIComponent(message);

    window.open(
      `https://api.whatsapp.com/send?phone=${completePhoneNumber}&text=${encodedMessage}`,
      "_blank",
    );
  };

  const handleVerifyReceipt = async (receiptCode, callback) => {
    try {
      if (receiptCode.length < 10) {
        showNotice("Invalid M-Pesa confirmation sequence format.", "error");
        callback();
        return;
      }

      // 1. Insert into Supabase ledger
      const { error } = await supabase.from("payment_ledger").insert([
        {
          restaurant_id: adminProfile.restaurant_id,
          mpesa_code: receiptCode.toUpperCase(),
          status: "pending",
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          showNotice(
            "This transaction code has already been submitted.",
            "error",
          );
        } else {
          showNotice(error.message, "error");
        }
        callback();
        return;
      }

      showNotice(
        "Reference submitted successfully! Access will restore once verified.",
        "success",
      );

      // 2. Trigger Silent Admin WhatsApp Notification via Background API
      try {
        const adminWhatsAppMessage =
          `💰 *New Subscription Payment Submitted*\n\n` +
          `• *Workspace ID:* ${adminProfile.restaurant_id}\n` +
          `• *M-Pesa Code:* ${receiptCode.toUpperCase()}\n` +
          `• *Status:* Pending Manual Verification\n\n` +
          `👉 Log into Supabase or your tracker panel to verify funds and activate this workspace.`;

        // Using your CallMeBot setup to safely ping your personal admin number in the background
        const apiKey = "6201505";
        const adminPhone = "254707178642";

        const gatewayUrl = `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodeURIComponent(adminWhatsAppMessage)}&apikey=${apiKey}`;

        // Dispatched completely silently without reloading or shifting focus
        fetch(gatewayUrl, { mode: 'no-cors' });
      } catch (triggerErr) {
        console.error("WhatsApp notification dispatch dropped:", triggerErr);
      }

    } catch (err) {
      console.error("Submission breakdown:", err);
    } finally {
      callback();
    }
  };

  const handlePaywallSubmit = (e) => {
    e.preventDefault();
    if (!mpesaCode.trim()) return;
    setVerifyingCode(true);
    handleVerifyReceipt(mpesaCode.trim(), () => {
      setMpesaCode("");
      setVerifyingCode(false);
    });
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
        transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:min-h-screen md:flex
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
              <span className="font-bold text-white">
                PayRoller
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
                  disabled={isPaywallLocked}
                  onClick={() => {
                    setActiveTab("overview");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isPaywallLocked
                    ? "text-zinc-600 cursor-not-allowed"
                    : activeTab === "overview"
                      ? "text-white bg-[#121214] border border-[#1f1f23]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                    }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Overview</span>
                </button>

                {/* Tab 2: Directory (hidden for access levels without directory visibility, e.g. Accountant) */}
                {permissions.viewDirectory && (
                  <button
                    disabled={isPaywallLocked}
                    onClick={() => {
                      setActiveTab("directory");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isPaywallLocked
                      ? "text-zinc-600 cursor-not-allowed"
                      : activeTab === "directory"
                        ? "text-white bg-[#121214] border border-[#1f1f23]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                  >
                    <Users size={14} />
                    <span>Employee Directory</span>
                  </button>
                )}

                {/* Tab 3: Payroll Hub */}
                <button
                  disabled={isPaywallLocked}
                  onClick={() => {
                    setActiveTab("payroll");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isPaywallLocked
                    ? "text-zinc-600 cursor-not-allowed"
                    : activeTab === "payroll"
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
        <div className="border-t border-[#1f1f23] pt-4 space-y-3">
          {/* Refresh Button */}
          <button
            disabled={isPaywallLocked}
            onClick={refresh}
            className="w-full bg-[#121214] hover:bg-zinc-900 border border-[#1f1f23] px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} />
            <span>Refresh Database</span>
          </button>

          {/* Support Subtext Section */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-zinc-500">
            <span>Support:</span>
            <a
              href="https://wa.me/254707178642"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              WhatsApp
            </a>
            <span className="text-zinc-700 font-normal">|</span>
            <a
              href="mailto:brianachira007@gmail.com"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Email
            </a>
          </div>
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
            /{isPaywallLocked ? "suspended" : activeTab}
          </span>
        </header>

        {/* DESKTOP HEADER NAVBAR */}
        <header className="hidden md:flex h-14 border-b border-[#1f1f23] items-center justify-between px-8 bg-[#09090b]">
          <div className="text-xs text-zinc-500 font-mono">
            payroller &gt; {isPaywallLocked ? "subscription_required" : activeTab}
          </div>
        </header>

        {/* Toast Notification Container */}
        {notice.text && (
          <div
            className={`fixed top-16 right-4 sm:top-6 sm:right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold transition-all ${notice.type === "error"
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
          ) : isPaywallLocked ? (
            /* DYNAMIC MANUALLY TRIGGERED PAYWALL OVERLAY INTERFACE */
            <div className="max-w-md mx-auto my-8 bg-[#121214] border border-[#1f1f23] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                  <Lock size={22} />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white tracking-tight">
                    Subscription Payment Required
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Your trial period or subscription billing cycle has concluded. Please settle your outstanding workspace dues to regain access.
                  </p>
                </div>
              </div>

              <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-3 text-xs font-mono">
                <div className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold font-sans">
                  Payment Instructions
                </div>
                <div className="text-zinc-300 space-y-1">
                  <p>1. Send the KES 800/= subscription amount via **M-Pesa**</p>
                  <p>2. Pay via Pochi La Biashara: <span className="text-white font-bold">0707178642</span></p>
                  <p>3. Copy your 10-character confirmation receipt code.</p>
                </div>
              </div>

              <form onSubmit={handlePaywallSubmit} className="space-y-4">
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    M-Pesa Transaction Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="e.g. SGX789JK02"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#09090b] border border-[#1f1f23] focus:border-amber-500/50 rounded-lg p-3 text-white text-sm font-mono tracking-widest placeholder-zinc-700 outline-none transition-all text-center"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingCode || !mpesaCode.trim()}
                  className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                >
                  {verifyingCode ? "Verifying Reference..." : "Submit Payment Reference"}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">

                  <OverviewPanel
                    employees={employees}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onNavigate={setActiveTab}
                    canViewDirectory={permissions.viewDirectory}
                  />

                  {/* Overview Layout */}
                  {permissions.manageInvites && (
                    <div className="card p-5 sm:p-8 space-y-6">
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
                              {JOB_TITLES.map((title) => (
                                <option key={title} value={title}>
                                  {title}
                                </option>
                              ))}
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

                          <div className="sm:col-span-2">
                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                              Recipient Phone Number (WhatsApp)
                            </label>
                            <div className="relative flex items-center">
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
                                  const cleanValue = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 9);
                                  setInvitePhone(cleanValue);
                                }}
                              />
                            </div>
                            {!generatedLink && (
                              <span className="text-[10px] text-zinc-600 mt-1 block font-mono">
                                Type the 9-digit mobile number (e.g., 712345678).
                                Country code is locked.
                              </span>
                            )}
                          </div>
                        </div>

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
                  )}
                </div>
              )}

              {/* TAB 2: DIRECTORY */}
              {activeTab === "directory" && permissions.viewDirectory && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Employee Directory</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {filteredEmployees.length} of {employees.length} staff
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name or position..."
                      className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 sm:max-w-xs"
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
                          readOnly={!permissions.editDirectory}
                          canDelete={permissions.deleteEmployees}
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Monthly Payroll Run</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {permissions.editPayroll
                          ? "Edit any cell directly. Changes stay in a local draft until you press Save Changes."
                          : "View-only \u2014 your access level can review payroll figures but can't edit or save changes."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {permissions.editPayroll && (
                        <button
                          onClick={() => setScanOpen(true)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          <ScanLine size={14} />
                          <span>Scan Sheet</span>
                        </button>
                      )}
                      <button
                        onClick={downloadPayrollSpreadsheet}
                        className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs font-bold text-white hover:bg-surface-2"
                      >
                        <FileSpreadsheet size={14} />
                        <span>Export (.csv)</span>
                      </button>
                    </div>
                  </div>

                  {employees.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line py-12 text-center font-mono text-xs text-zinc-500">
                      No employee profiles registered to calculate payroll for.
                    </div>
                  ) : (
                    <PayrollTable
                      employees={employees}
                      savedEmployees={dbEmployees}
                      readOnly={!permissions.editPayroll}
                      onChange={handleLocalFieldChange}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {scanOpen && permissions.editPayroll && (
        <ScanSheetModal employees={employees} onApply={handleScanApply} onClose={() => setScanOpen(false)} />
      )}

      {/* Unsaved Edits Notification Bar */}
      {hasUnsavedChanges && !isPaywallLocked && permissions.editPayroll && (
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