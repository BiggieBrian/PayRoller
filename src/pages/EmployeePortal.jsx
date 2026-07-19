import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ClockInOut from "../components/ClockInOut";
import { generatePayslipPDF } from "../utils/pdfGenerator";
export default function EmployeePortal() {
  const { profile, logout } = useAuth();
  const [showSalary, setShowSalary] = useState(true);

  // Guard against asynchronous loading "zero flash"
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          Loading...
        </p>
      </div>
    );
  }
  console.log("Current Employee Profile from DB:", profile);

  // Formatting utility for Kenyan Shilling (KES)
  const formatKES = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Salary Calculations
  const basicSalary = Number(profile?.fixed_salary || 0);
  const overtime = Number(profile?.overtime || 0);
  const totalPaid = basicSalary + overtime;

  // Deductions
  const systemDeduction = Number(profile?.system_deduction || 0);
  const shorts = Number(profile?.shorts || 0);
  const advance = Number(profile?.advance || 0);
  const breakages = Number(profile?.breakages || 0);

  const totalDeductions = systemDeduction + shorts + advance + breakages;
  const netSalary = totalPaid - totalDeductions;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-12">
      {/* Header (Matches Admin Topbar) */}
      <header className="border-b border-zinc-900 bg-[#09090b] sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="h-5 w-5 rounded bg-emerald-500 text-[#09090b] font-black text-xs flex items-center justify-center">
              P
            </span>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                PayRoller
              </h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                Staff Portal
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-[#121212] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Welcome Card & PDF Download Button */}
        <div className="bg-[#121212] border border-zinc-900 rounded-xl p-5 flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Active Session
              </span>
            </div>
            <h2 className="text-xl font-bold text-white pt-1">
              Sasa, {profile?.full_name?.split(" ")[0] || "Employee"}! 👋
            </h2>
            <p className="text-xs text-zinc-500">
              Role:{" "}
              <span className="text-zinc-300 font-semibold uppercase">
                {profile?.role || "Employee"}
              </span>
            </p>
          </div>

          {/* Clean Black/Gray PDF Button - uses the centralized utility file */}
          <button
            onClick={() => generatePayslipPDF(profile)}
            className="flex flex-col items-center justify-center h-11 w-11 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-zinc-800 transition-all duration-200 text-zinc-200 hover:text-white shadow-md active:scale-95 group"
            title="Export PDF Payslip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mb-0.5 text-zinc-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-[8px] font-black tracking-wider text-zinc-500 group-hover:text-zinc-300 uppercase">
              PDF
            </span>
          </button>
        </div>

        {/* Interactive Earnings Statement */}
        <section className="bg-[#121212] border border-zinc-900 rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
            <h3 className="font-bold text-white text-sm tracking-wide">
              Monthly Statement
            </h3>
            <button
              onClick={() => setShowSalary(!showSalary)}
              className="text-[9px] uppercase font-bold text-zinc-500 hover:text-white transition-colors"
            >
              {showSalary ? "Hide Numbers" : "Show Numbers"}
            </button>
          </div>

          <div className="space-y-3.5 text-sm">
            {/* Base Pay */}
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium">Basic Salary</span>
              <span className="text-zinc-200 font-mono font-bold">
                {showSalary ? formatKES(basicSalary) : "••••••"}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium">Overtime</span>
              <span className="text-zinc-200 font-mono font-bold">
                {showSalary ? `+${formatKES(overtime)}` : "••••••"}
              </span>
            </div>

            <div className="flex justify-between border-t border-zinc-800/50 pt-3 text-zinc-200 font-bold">
              <span>Total Gross (Paid)</span>
              <span className="font-mono text-white">
                {showSalary ? formatKES(totalPaid) : "••••••"}
              </span>
            </div>

            {/* Deductions Breakdown */}
            <div className="border-t border-zinc-800/50 pt-3 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>System Deductions</span>
                <span className="font-mono">
                  {showSalary ? `-${formatKES(systemDeduction)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash Shortages</span>
                <span className="font-mono">
                  {showSalary ? `-${formatKES(shorts)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Salary Advances</span>
                <span className="font-mono">
                  {showSalary ? `-${formatKES(advance)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Breakages / Loss</span>
                <span className="font-mono">
                  {showSalary ? `-${formatKES(breakages)}` : "••••"}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-zinc-500 font-bold pt-1">
              <span>Total Deductions</span>
              <span className="font-mono">
                {showSalary ? `-${formatKES(totalDeductions)}` : "••••••"}
              </span>
            </div>

            {/* Total Take-Home */}
            <div className="border-t border-zinc-800 pt-3.5 flex justify-between items-baseline">
              <span className="font-bold text-zinc-300">Net Take-Home</span>
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {showSalary ? formatKES(netSalary) : "••••••••••"}
              </span>
            </div>
          </div>
        </section>

        {/* Banking Configuration Info */}
        <section className="bg-[#121212] border border-zinc-900 rounded-xl p-5">
          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mb-0.5">
                Disbursal Account
              </p>
              <span className="font-bold text-zinc-300">
                {profile?.bank_name || "COOP BANK"} —{" "}
                {profile?.bank_account_number || "••••••••"}
              </span>
            </div>
            <span className="text-[9px] text-zinc-300 font-black bg-[#18181b] px-2.5 py-1 rounded border border-zinc-800">
              ACTIVE
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
