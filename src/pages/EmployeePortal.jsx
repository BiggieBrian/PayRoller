import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { generatePayslipPDF } from "../utils/pdfGenerator";

export default function EmployeePortal() {
  const { profile, logout } = useAuth();
  const [showSalary, setShowSalary] = useState(true);

  // Guard against asynchronous loading "zero flash"
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4 font-mono text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
          Loading Staff Profile...
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
  const sha = Number(profile?.sha || 0);
  const nssf = Number(profile?.nssf || 0);
  const systemDeduction = Number(profile?.system_deduction || 0);
  const shorts = Number(profile?.shorts || 0);
  const advance = Number(profile?.advance || 0);
  const breakages = Number(profile?.breakages || 0);

  const totalDeductions =
    sha + nssf + systemDeduction + shorts + advance + breakages;
  const netSalary = totalPaid - totalDeductions;

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative font-sans selection:bg-emerald-500/30 pb-16">
      {/* Structural Architectural Gridlines & Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Header */}
      <header className="border-b border-[#1f1f23] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center gap-2 font-mono tracking-widest text-lg font-bold">
              <span className="text-white">PAY</span>
              <span className="text-emerald-400">ROLLER</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <span className="text-zinc-600 text-xs font-mono">/</span>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest bg-[#121214] px-2 py-0.5 border border-[#1f1f23] rounded">
              Staff Portal
            </span>
          </div>

          <button
            onClick={logout}
            className="bg-[#121214] hover:bg-zinc-800 border border-[#1f1f23] text-zinc-300 hover:text-white text-xs px-4 py-2 rounded font-mono font-semibold transition-all duration-200 active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-8 space-y-6 relative z-10">
        {/* Welcome Card & PDF Download Button */}
        <div className="bg-[#121214]/80 border border-[#1f1f23] rounded-2xl p-6 backdrop-blur-md shadow-2xl flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                Active Session
              </span>
            </div>
            <h2 className="text-2xl font-serif font-light text-white tracking-tight pt-1">
              Sasa, {profile?.full_name?.split(" ")[0] || "Employee"}! 👋
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Role:{" "}
              <span className="text-emerald-400 font-semibold uppercase">
                {profile?.role || "Employee"}
              </span>
            </p>
          </div>

          {/* PDF Export Button */}
          <button
            onClick={() => generatePayslipPDF(profile)}
            className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-[#09090b] hover:bg-emerald-400 border border-[#1f1f23] hover:border-emerald-400 text-zinc-300 hover:text-[#09090b] transition-all duration-200 shadow-md active:scale-95 group cursor-pointer"
            title="Export PDF Payslip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-400 group-hover:text-[#09090b] transition-colors"
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
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-zinc-500 group-hover:text-[#09090b]">
              PDF
            </span>
          </button>
        </div>

        {/* Interactive Earnings Statement */}
        <section className="bg-[#121214]/80 border border-[#1f1f23] rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-[#1f1f23] pb-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase block">
                01 // Financial Summary
              </span>
              <h3 className="font-serif font-light text-white text-xl tracking-tight mt-0.5">
                Monthly Statement
              </h3>
            </div>
            <button
              onClick={() => setShowSalary(!showSalary)}
              className="text-[10px] font-mono uppercase font-semibold text-zinc-400 hover:text-white border border-[#1f1f23] px-3 py-1.5 rounded transition-colors"
            >
              {showSalary ? "Hide Numbers" : "Show Numbers"}
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Base Pay */}
            <div className="flex justify-between text-zinc-400">
              <span>Basic Salary</span>
              <span className="text-zinc-100 font-bold">
                {showSalary ? formatKES(basicSalary) : "••••••"}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Overtime</span>
              <span className="text-emerald-400 font-bold">
                {showSalary ? `+${formatKES(overtime)}` : "••••••"}
              </span>
            </div>

            <div className="flex justify-between border-t border-[#1f1f23] pt-3 text-zinc-200 font-bold">
              <span>Total Gross (Paid)</span>
              <span className="text-white">
                {showSalary ? formatKES(totalPaid) : "••••••"}
              </span>
            </div>

            {/* Deductions Breakdown */}
            <div className="border-t border-[#1f1f23] pt-4 space-y-2 text-[#a1a1aa]">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Deductions</span>
              </div>
              <div className="flex justify-between">
                <span>SHA</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(sha)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NSSF</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(nssf)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>System Deductions</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(systemDeduction)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash Shortages</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(shorts)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Salary Advances</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(advance)}` : "••••"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Breakages / Loss</span>
                <span className="text-red-400">
                  {showSalary ? `-${formatKES(breakages)}` : "••••"}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-zinc-400 font-bold pt-2 border-t border-[#1f1f23]/50">
              <span>Total Deductions</span>
              <span className="text-red-400">
                {showSalary ? `-${formatKES(totalDeductions)}` : "••••••"}
              </span>
            </div>

            {/* Total Take-Home */}
            <div className="border-t border-[#1f1f23] pt-5 flex justify-between items-baseline">
              <span className="font-sans font-medium text-zinc-300 text-sm">Net Take-Home</span>
              <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {showSalary ? formatKES(netSalary) : "••••••••••"}
              </span>
            </div>
          </div>
        </section>

        {/* Banking Configuration Info */}
        <section className="bg-[#121214]/80 border border-[#1f1f23] rounded-2xl p-6 backdrop-blur-md shadow-2xl">
          <div className="flex justify-between items-center text-xs font-mono">
            <div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-1">
                02 // Disbursal Account
              </p>
              <span className="font-semibold text-zinc-200">
                {profile?.bank_name || "COOP BANK"} —{" "}
                {profile?.bank_account_number || "••••••••"}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest bg-emerald-950/30 px-3 py-1 rounded border border-emerald-500/30 uppercase">
              ACTIVE
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}