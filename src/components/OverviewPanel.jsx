import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CountUp from "./ui/CountUp";
import DeductionBar from "./ui/DeductionBar";
import Chip from "./ui/Chip";

const n = (v) => Number(v || 0);

export default function OverviewPanel({ employees, hasUnsavedChanges, onNavigate, canViewDirectory }) {
  const { restaurant } = useAuth();
  const [now] = useState(() => Date.now());

  // Totals across all staff
  const t = employees.reduce(
    (a, e) => {
      const gross = n(e.basic_salary) + n(e.overtime);
      const ded = n(e.sha) + n(e.nssf) + n(e.system_deduction) + n(e.shorts) + n(e.advance) + n(e.breakages);
      a.gross += gross;
      a.sha += n(e.sha);
      a.nssf += n(e.nssf);
      a.sys += n(e.system_deduction);
      a.shorts += n(e.shorts);
      a.adv += n(e.advance);
      a.brk += n(e.breakages);
      a.ded += ded;
      a.net += Math.max(0, gross - ded);
      return a;
    },
    { gross: 0, sha: 0, nssf: 0, sys: 0, shorts: 0, adv: 0, brk: 0, ded: 0, net: 0 }
  );
  const avgNet = employees.length ? t.net / employees.length : 0;

  // Subscription / trial status
  const active = restaurant?.is_subscription_active === true;
  const end = restaurant?.trial_end_timestamp ? new Date(restaurant.trial_end_timestamp).getTime() : null;
  const daysLeft = end ? Math.ceil((end - now) / 86400000) : null;

  // Things worth a second look
    const attention = [];
  const missingBank = employees.filter((e) => !e.bank_name || !(e.account_number || e.bank_account_number));
  if (missingBank.length)
    attention.push({ tone: "amber", tab: "directory", label: `${missingBank.length} missing bank details`, names: missingBank.map((e) => e.full_name) });
  const zeroBasic = employees.filter((e) => n(e.basic_salary) === 0);
  if (zeroBasic.length)
    attention.push({ tone: "red", tab: "payroll", label: `${zeroBasic.length} with no basic salary`, names: zeroBasic.map((e) => e.full_name) });
  const overDeducted = employees.filter((e) => {
    const gross = n(e.basic_salary) + n(e.overtime);
    const ded = n(e.sha) + n(e.nssf) + n(e.system_deduction) + n(e.shorts) + n(e.advance) + n(e.breakages);
    return gross > 0 && ded > gross;
  });
  if (overDeducted.length)
    attention.push({ tone: "red", tab: "payroll", label: `${overDeducted.length} deductions exceed pay`, names: overDeducted.map((e) => e.full_name) });
  const manual = employees.filter((e) => e.sha_is_manual || e.nssf_is_manual || e.overtime_is_manual);
  if (manual.length)
    attention.push({ tone: "sky", tab: "payroll", label: `${manual.length} with manual overrides`, names: manual.map((e) => e.full_name) });
  if (hasUnsavedChanges)
    attention.push({ tone: "amber", tab: "payroll", label: "Unsaved payroll changes", names: [] });

  const segments = [
    { label: "Take-home", value: t.net, className: "bg-emerald-500" },
    { label: "SHA", value: t.sha, className: "bg-sky-500" },
    { label: "NSSF", value: t.nssf, className: "bg-violet-500" },
    { label: "Advances", value: t.adv, className: "bg-amber-500" },
    { label: "Shorts", value: t.shorts, className: "bg-red-500" },
    { label: "Breakages", value: t.brk, className: "bg-orange-500" },
    { label: "System", value: t.sys, className: "bg-zinc-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="card glow p-6 sm:p-8 fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Net payroll liability</span>
          {active ? (
            <Chip tone="emerald">Premium active</Chip>
          ) : daysLeft !== null && daysLeft > 0 ? (
            <Chip tone={daysLeft <= 7 ? "amber" : "sky"}>Trial: {daysLeft} day{daysLeft === 1 ? "" : "s"} left</Chip>
          ) : null}
        </div>
        <div className="mt-4">
          <CountUp value={t.net} prefix="Ksh " className="display-num text-5xl sm:text-7xl text-white" />
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Across <span className="text-zinc-200">{employees.length}</span> staff · gross{" "}
          <span className="text-zinc-200">Ksh {t.gross.toLocaleString()}</span> · deductions{" "}
          <span className="text-zinc-200">Ksh {t.ded.toLocaleString()}</span>
        </p>
      </div>

      {/* Supporting stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 fade-up" style={{ animationDelay: "80ms" }}>
          <span className="text-xs text-zinc-500">Active staff</span>
          <div className="display-num mt-2 text-4xl text-white">{employees.length}</div>
        </div>
        <div className="card p-5 fade-up" style={{ animationDelay: "140ms" }}>
          <span className="text-xs text-zinc-500">Average take-home</span>
          <div className="display-num mt-2 text-4xl text-white">
            <CountUp value={avgNet} />
          </div>
        </div>
      </div>

      {/* Where the money goes */}
      <div className="card p-5 sm:p-6 fade-up" style={{ animationDelay: "200ms" }}>
        <h3 className="text-sm font-semibold text-white">Where the money goes</h3>
        <p className="mb-4 mt-1 text-xs text-zinc-500">Gross payroll split into take-home and each deduction type.</p>
        <DeductionBar segments={segments} height={14} showLegend />
      </div>

      {/* Attention list */}
      <div className="card p-5 sm:p-6 fade-up" style={{ animationDelay: "260ms" }}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Needs attention</h3>
        </div>
        {attention.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">All clear. Nothing needs a second look right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {attention.map((a) => (
                            <li key={a.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <Chip tone={a.tone}>{a.label}</Chip>
                {a.names.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    {a.names.slice(0, 4).join(", ")}
                    {a.names.length > 4 ? ` +${a.names.length - 4} more` : ""}
                  </span>
                )}
                {(a.tab !== "directory" || canViewDirectory) && (
                  <button
                    onClick={() => onNavigate(a.tab)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 sm:ml-auto whitespace-nowrap"
                  >
                    {a.tab === "directory" ? "Open Directory →" : "Open Payroll Hub →"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}