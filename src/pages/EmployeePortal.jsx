import { useState } from "react";
import { Eye, EyeOff, Download, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { generatePayslipPDF } from "../utils/pdfGenerator";
import Avatar from "../components/ui/Avatar";
import Chip from "../components/ui/Chip";
import Skeleton from "../components/ui/Skeleton";
import DeductionBar from "../components/ui/DeductionBar";
import { toneForRole } from "../utils/roleTones";

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount || 0);

function Row({ label, value, tone = "text-zinc-100", show }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{show ? value : "••••"}</span>
    </div>
  );
}

export default function EmployeePortal() {
  const { profile, logout } = useAuth();
  const [showSalary, setShowSalary] = useState(true);

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  // Salary calculations
  const basicSalary = Number(profile.fixed_salary || 0);
  const overtime = Number(profile.overtime || 0);
  const totalPaid = basicSalary + overtime;

  const sha = Number(profile.sha || 0);
  const nssf = Number(profile.nssf || 0);
  const systemDeduction = Number(profile.system_deduction || 0);
  const shorts = Number(profile.shorts || 0);
  const advance = Number(profile.advance || 0);
  const breakages = Number(profile.breakages || 0);
  const totalDeductions = sha + nssf + systemDeduction + shorts + advance + breakages;
  const netSalary = Math.max(0, totalPaid - totalDeductions);

  const account = String(profile.account_number || profile.bank_account_number || "");
  const accountTail = account ? `•••• ${account.slice(-4)}` : "••••";
  const firstName = profile.full_name?.split(" ")[0] || "there";
  const period = new Date().toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-black">
              P
            </div>
            <span className="text-sm font-semibold text-white">PayRoller</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-5 pt-6">
        {/* Greeting */}
        <div className="fade-up flex items-center gap-3">
          <Avatar name={profile.full_name} size={44} />
          <div className="min-w-0">
            <h1 className="rond truncate text-xl font-medium text-white">Sasa, {firstName}! 👋</h1>
            <div className="mt-1">
              <Chip tone={toneForRole(profile.job_title)}>{profile.job_title || "Staff"}</Chip>
            </div>
          </div>
        </div>

        {/* Wallet-style take-home card */}
        <div
          className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 p-6 text-white shadow-2xl shadow-emerald-900/40"
          style={{ animationDelay: "80ms" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-black/10" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-100/80">Net take-home</p>
              <p className="mt-0.5 text-xs text-emerald-100/70">{period}</p>
            </div>
            <button
              onClick={() => setShowSalary((s) => !s)}
              aria-label={showSalary ? "Hide numbers" : "Show numbers"}
              className="rounded-full bg-white/15 p-2 hover:bg-white/25"
            >
              {showSalary ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="display-num relative mt-6 text-5xl">
            {showSalary ? formatKES(netSalary) : "KES ••••••"}
          </div>

          <div className="relative mt-8 flex items-end justify-between text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-100/70">Paid to</p>
              <p className="font-medium">{profile.bank_name || "Bank not set"}</p>
            </div>
            <p className="font-medium tabular-nums tracking-wider">{accountTail}</p>
          </div>
        </div>

        {/* Where your pay went */}
        <div className="card fade-up p-5" style={{ animationDelay: "140ms" }}>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-white">Where your pay went</span>
            <span className="text-xs text-zinc-500">
              {showSalary ? `${formatKES(totalDeductions)} deducted` : "•••• deducted"}
            </span>
          </div>
          <DeductionBar
            height={10}
            showLegend={showSalary}
            segments={[
              { label: "Take-home", value: netSalary, className: "bg-emerald-500" },
              { label: "SHA", value: sha, className: "bg-sky-500" },
              { label: "NSSF", value: nssf, className: "bg-violet-500" },
              { label: "Advance", value: advance, className: "bg-amber-500" },
              { label: "Shorts", value: shorts, className: "bg-red-500" },
              { label: "Breakages", value: breakages, className: "bg-orange-500" },
              { label: "System", value: systemDeduction, className: "bg-zinc-500" },
            ]}
          />
        </div>

        {/* Receipt-style statement */}
        <div className="receipt fade-up px-5 pb-6 pt-5" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between border-b border-dashed border-line pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Payslip</p>
              <h2 className="text-lg font-medium text-white">{period}</h2>
            </div>
            <button
              onClick={() => generatePayslipPDF(profile)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400"
            >
              <Download size={14} />
              PDF
            </button>
          </div>

          <div className="divide-y divide-line/60 py-2">
            <Row label="Basic salary" value={formatKES(basicSalary)} show={showSalary} />
            <Row label="Overtime" value={`+${formatKES(overtime)}`} tone="text-emerald-400" show={showSalary} />
          </div>

          <div className="flex items-center justify-between border-y border-dashed border-line py-3 text-sm font-semibold text-white">
            <span>Gross pay</span>
            <span className="tabular-nums">{showSalary ? formatKES(totalPaid) : "••••"}</span>
          </div>

          <div className="divide-y divide-line/60 py-2">
            <Row label="SHA" value={`-${formatKES(sha)}`} tone="text-red-400" show={showSalary} />
            <Row label="NSSF" value={`-${formatKES(nssf)}`} tone="text-red-400" show={showSalary} />
            <Row label="System deductions" value={`-${formatKES(systemDeduction)}`} tone="text-red-400" show={showSalary} />
            <Row label="Cash shortages" value={`-${formatKES(shorts)}`} tone="text-red-400" show={showSalary} />
            <Row label="Salary advances" value={`-${formatKES(advance)}`} tone="text-red-400" show={showSalary} />
            <Row label="Breakages / loss" value={`-${formatKES(breakages)}`} tone="text-red-400" show={showSalary} />
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-line pt-3 text-sm font-semibold text-zinc-300">
            <span>Total deductions</span>
            <span className="tabular-nums text-red-400">{showSalary ? `-${formatKES(totalDeductions)}` : "••••"}</span>
          </div>

          <div className="mt-4 flex items-baseline justify-between rounded-xl bg-bg px-4 py-4">
            <span className="text-sm font-medium text-zinc-300">Net take-home</span>
            <span className="display-num text-3xl text-emerald-400">
              {showSalary ? formatKES(netSalary) : "••••••"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}