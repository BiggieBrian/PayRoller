import { useState } from "react";
import Avatar from "./ui/Avatar";
import Chip from "./ui/Chip";
import { toneForRole } from "../utils/roleTones";

const n = (v) => Number(v || 0);

// flag = the *_is_manual field that marks a hand-typed override
const COLS = [
  { key: "basic_salary", label: "Basic" },
  { key: "overtime_ordinary_hours", label: "OT hrs" },
  { key: "overtime_restday_hours", label: "Rest OT hrs" },
  { key: "overtime", label: "OT pay", flag: "overtime_is_manual" },
  { key: "sha", label: "SHA", flag: "sha_is_manual" },
  { key: "nssf", label: "NSSF", flag: "nssf_is_manual" },
  { key: "system_deduction", label: "System" },
  { key: "shorts", label: "Shorts" },
  { key: "advance", label: "Advance" },
  { key: "breakages", label: "Breakages" },
];

const TRACKED = [...COLS.map((c) => c.key), "overtime_is_manual", "sha_is_manual", "nssf_is_manual"];

const netOf = (e) =>
  Math.max(
    0,
    n(e.basic_salary) + n(e.overtime) -
      (n(e.sha) + n(e.nssf) + n(e.system_deduction) + n(e.shorts) + n(e.advance) + n(e.breakages))
  );

// True when this row differs from what is saved in the database
const isEdited = (emp, saved) => !!saved && TRACKED.some((k) => n(emp[k]) !== n(saved[k]));

function NumCell({ value, onChange, disabled, manual }) {
  return (
    <div className="relative">
      {manual && (
        <span
          title="Manually adjusted"
          className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-400"
        />
      )}
      <input
        type="number"
        inputMode="decimal"
        placeholder="0"
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-zinc-100 outline-none hover:border-line focus:border-emerald-500/60 focus:bg-black/30 disabled:opacity-60"
      />
    </div>
  );
}

export default function PayrollTable({ employees, savedEmployees, onChange, readOnly }) {
  const [openId, setOpenId] = useState(null);
  const savedById = new Map(savedEmployees.map((e) => [e.id, e]));

  const totals = COLS.map((c) => employees.reduce((a, e) => a + n(e[c.key]), 0));
  const totalNet = employees.reduce((a, e) => a + netOf(e), 0);

  const th = "sticky top-0 z-20 border-b border-line bg-surface-2 px-2 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400";

  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="card hidden max-h-[70vh] overflow-auto md:block">
        <table className="w-full min-w-[1300px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${th} left-0 z-30 min-w-[230px] px-4 text-left`}>Employee</th>
              {COLS.map((c) => (
                <th key={c.key} className={th}>{c.label}</th>
              ))}
              <th className={`${th} px-4`}>Net pay</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const edited = isEdited(emp, savedById.get(emp.id));
              return (
                <tr key={emp.id} className="group">
                  <td className="sticky left-0 z-10 border-b border-line bg-surface px-4 py-2 group-hover:bg-surface-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.full_name} size={32} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">{emp.full_name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Chip tone={toneForRole(emp.job_title)}>{emp.job_title || "Staff"}</Chip>
                          {edited && <Chip tone="amber">edited</Chip>}
                        </div>
                      </div>
                    </div>
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className="border-b border-line px-1 py-2 text-right group-hover:bg-surface-2">
                      <NumCell
                        value={emp[c.key]}
                        disabled={readOnly}
                        manual={c.flag && emp[c.flag]}
                        onChange={(v) => onChange(emp.id, c.key, v)}
                      />
                    </td>
                  ))}
                  <td className="border-b border-line px-4 py-2 text-right font-semibold tabular-nums text-emerald-400 group-hover:bg-surface-2">
                    {netOf(emp).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky bottom-0 left-0 z-30 border-t border-line bg-surface-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Totals · {employees.length} staff
              </td>
              {totals.map((v, i) => (
                <td key={COLS[i].key} className="sticky bottom-0 z-20 border-t border-line bg-surface-2 px-3 py-3 text-right text-sm font-semibold tabular-nums text-zinc-200">
                  {v ? v.toLocaleString() : "–"}
                </td>
              ))}
              <td className="sticky bottom-0 z-20 border-t border-line bg-surface-2 px-4 py-3 text-right text-sm font-bold tabular-nums text-emerald-400">
                {totalNet.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Phone: expandable cards */}
      <div className="space-y-3 md:hidden">
        {employees.map((emp) => {
          const open = openId === emp.id;
          const edited = isEdited(emp, savedById.get(emp.id));
          return (
            <div key={emp.id} className="card">
              <button
                onClick={() => setOpenId(open ? null : emp.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <Avatar name={emp.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{emp.full_name}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Chip tone={toneForRole(emp.job_title)}>{emp.job_title || "Staff"}</Chip>
                    {edited && <Chip tone="amber">edited</Chip>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-zinc-500">Net</div>
                  <div className="font-semibold tabular-nums text-emerald-400">{netOf(emp).toLocaleString()}</div>
                </div>
              </button>
              {open && (
                <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
                  {COLS.map((c) => (
                    <label key={c.key} className="block">
                      <span className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                        {c.label}
                        {c.flag && emp[c.flag] && <span className="text-amber-400">manual</span>}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        disabled={readOnly}
                        value={emp[c.key] || ""}
                        onChange={(e) => onChange(emp.id, c.key, e.target.value)}
                        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm tabular-nums text-white outline-none focus:border-emerald-500/60 disabled:opacity-60"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}