import { useState } from "react";
import { calculateSHA, calculateNSSF, calculateOvertimePay } from "../utils/payrollCalculations";
import { JOB_TITLES } from "../utils/roles";
import { toneForRole } from "../utils/roleTones";
import Avatar from "./ui/Avatar";
import Chip from "./ui/Chip";
import DeductionBar from "./ui/DeductionBar";

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/60";

// Label for a field showing a computed value vs one typed over manually
function CalcTag({ isManual, onReset }) {
  return isManual ? (
    <button
      type="button"
      onClick={onReset}
      title="Click to restore the auto-calculated value"
      className="text-[10px] font-semibold text-amber-400 hover:text-amber-300"
    >
      manual · reset
    </button>
  ) : (
    <span className="text-[10px] font-semibold text-emerald-500/80">auto</span>
  );
}

function Field({ label, tag, className = "", children }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        {tag}
      </div>
      {children}
    </div>
  );
}

export default function EmployeeCard({ employee, onUpdate, onDelete, readOnly = false, canDelete = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...employee });
  const [manualOverrides, setManualOverrides] = useState({ sha: false, nssf: false, overtime: false });

  // Re-derive SHA / NSSF / overtime when inputs change, unless manually overridden

    // Recompute every field that isn't manually overridden
  const recalc = (data, overrides) => {
    const basic = Number(data.basic_salary || 0);
    const ot = calculateOvertimePay(
      basic,
      Number(data.overtime_ordinary_hours || 0),
      Number(data.overtime_restday_hours || 0)
    );
    const overtimePay = overrides.overtime ? Number(data.overtime || 0) : ot.total;
    const grossPay = basic + overtimePay;
    return {
      ...data,
      ...(overrides.overtime ? {} : { overtime: ot.total }),
      ...(overrides.sha ? {} : { sha: calculateSHA(grossPay) }),
      ...(overrides.nssf ? {} : { nssf: calculateNSSF(grossPay).employee }),
    };
  };

  const set = (key) => (e) => {
    const value = e.target.value;
    setEditData((prev) => recalc({ ...prev, [key]: value }, manualOverrides));
  };

  const markManual = (field, value) => {
    const next = { ...manualOverrides, [field]: true };
    setManualOverrides(next);
    setEditData((prev) => recalc({ ...prev, [field]: value }, next));
  };

  const resetToCalculated = (field) => {
    const next = { ...manualOverrides, [field]: false };
    setManualOverrides(next);
    setEditData((prev) => recalc(prev, next));
  };
  
  const startEditing = () => {
    setEditData({
      ...employee,
      account_number: employee.account_number || employee.bank_account_number || "",
    });
    setManualOverrides({
      sha: !!employee.sha_is_manual,
      nssf: !!employee.nssf_is_manual,
      overtime: !!employee.overtime_is_manual,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updated = {
      ...editData,
      basic_salary: Number(editData.basic_salary || 0),
      fixed_salary: Number(editData.basic_salary || 0), // keep in sync: payslip/PDF read fixed_salary
      overtime_ordinary_hours: Number(editData.overtime_ordinary_hours || 0),
      overtime_restday_hours: Number(editData.overtime_restday_hours || 0),
      overtime: Number(editData.overtime || 0),
      overtime_is_manual: manualOverrides.overtime,
      sha: Number(editData.sha || 0),
      sha_is_manual: manualOverrides.sha,
      nssf: Number(editData.nssf || 0),
      nssf_is_manual: manualOverrides.nssf,
      system_deduction: Number(editData.system_deduction || 0),
      shorts: Number(editData.shorts || 0),
      advance: Number(editData.advance || 0),
      breakages: Number(editData.breakages || 0),
    };
    onUpdate(employee.id, updated);
    setIsEditing(false);
  };

  // Display math
  const basic = Number(employee.basic_salary || 0);
  const overtime = Number(employee.overtime || 0);
  const paid = basic + overtime;
  const sha = Number(employee.sha || 0);
  const nssf = Number(employee.nssf || 0);
  const sys = Number(employee.system_deduction || 0);
  const shorts = Number(employee.shorts || 0);
  const adv = Number(employee.advance || 0);
  const breakages = Number(employee.breakages || 0);
  const deductions = sha + nssf + sys + shorts + adv + breakages;
  const net = Math.max(0, paid - deductions);

  // ---------- EDIT MODE ----------
  if (isEditing) {
    return (
      <div className="card space-y-4 border-emerald-500/50 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={editData.full_name} size={36} />
          <h3 className="text-sm font-semibold text-white">Editing {employee.full_name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name">
            <input type="text" className={inputCls} value={editData.full_name || ""} onChange={set("full_name")} />
          </Field>
          <Field label="Position">
            <input
              type="text"
              list="job-titles"
              className={inputCls}
              value={editData.job_title || ""}
              onChange={set("job_title")}
            />
            <datalist id="job-titles">
              {JOB_TITLES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Bank name">
            <input type="text" className={inputCls} value={editData.bank_name || ""} onChange={set("bank_name")} />
          </Field>
          <Field label="Account no.">
            <input
              type="text"
              className={inputCls}
              value={editData.account_number || ""}
              onChange={set("account_number")}
            />
          </Field>

          <p className="col-span-2 -mt-1 text-[11px] leading-snug text-zinc-500">
            Changing the position here only updates the label. Dashboard access is set when the person registers.
          </p>

          <div className="col-span-2 border-t border-line pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Earnings
          </div>
          <Field label="Basic (Ksh)">
            <input type="number" className={inputCls} value={editData.basic_salary || 0} onChange={set("basic_salary")} />
          </Field>
          <Field label="Ordinary OT hours">
            <input
              type="number"
              className={inputCls}
              value={editData.overtime_ordinary_hours || 0}
              onChange={set("overtime_ordinary_hours")}
            />
          </Field>
          <Field label="Rest-day / holiday OT hours">
            <input
              type="number"
              className={inputCls}
              value={editData.overtime_restday_hours || 0}
              onChange={set("overtime_restday_hours")}
            />
          </Field>
          <Field
            label="Overtime pay (Ksh)"
            tag={<CalcTag isManual={manualOverrides.overtime} onReset={() => resetToCalculated("overtime")} />}
          >
            <input
              type="number"
              className={inputCls}
              value={editData.overtime || 0}
              onChange={(e) => markManual("overtime", e.target.value)}
            />
          </Field>

          <div className="col-span-2 border-t border-line pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Deductions
          </div>
          <div className="col-span-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-[11px] leading-snug text-amber-300">
            SHA and NSSF are auto-calculated from gross pay. These rates change periodically, so confirm they still
            match the official ones before saving.
          </div>
          <Field label="SHA" tag={<CalcTag isManual={manualOverrides.sha} onReset={() => resetToCalculated("sha")} />}>
            <input
              type="number"
              className={inputCls}
              value={editData.sha || 0}
              onChange={(e) => markManual("sha", e.target.value)}
            />
          </Field>
          <Field label="NSSF" tag={<CalcTag isManual={manualOverrides.nssf} onReset={() => resetToCalculated("nssf")} />}>
            <input
              type="number"
              className={inputCls}
              value={editData.nssf || 0}
              onChange={(e) => markManual("nssf", e.target.value)}
            />
          </Field>
          <Field label="System deduction">
            <input type="number" className={inputCls} value={editData.system_deduction || 0} onChange={set("system_deduction")} />
          </Field>
          <Field label="Shorts">
            <input type="number" className={inputCls} value={editData.shorts || 0} onChange={set("shorts")} />
          </Field>
          <Field label="Advance">
            <input type="number" className={inputCls} value={editData.advance || 0} onChange={set("advance")} />
          </Field>
          <Field label="Breakages">
            <input type="number" className={inputCls} value={editData.breakages || 0} onChange={set("breakages")} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
          >
            Cancel
          </button>
          <button onClick={handleSave} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ---------- VIEW MODE ----------
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start gap-3">
        <Avatar name={employee.full_name} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">{employee.full_name}</h3>
          <div className="mt-1">
            <Chip tone={toneForRole(employee.job_title)}>{employee.job_title || "Staff"}</Chip>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {!readOnly && (
            <button
              onClick={startEditing}
              className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs text-zinc-200 hover:text-white"
            >
              Edit
            </button>
          )}
          {!readOnly && canDelete && (
            <button
              onClick={() => onDelete(employee.id)}
              className="rounded-md border border-red-900/50 bg-red-950/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950"
            >
              Delete
            </button>
          )}
          {readOnly && <Chip tone="zinc">View only</Chip>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-b border-line pb-4 text-xs">
        <div>
          <span className="block text-zinc-500">Bank</span>
          <span className="font-medium text-zinc-200">{employee.bank_name || "—"}</span>
        </div>
        <div>
          <span className="block text-zinc-500">Account no.</span>
          <span className="font-medium tabular-nums text-zinc-200">
            {employee.account_number || employee.bank_account_number || "—"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-xs text-zinc-500">Basic salary</span>
          <span className="font-semibold tabular-nums text-white">Ksh {basic.toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-xs text-zinc-500">Overtime</span>
          <span className="font-semibold tabular-nums text-emerald-400">+ Ksh {overtime.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Deductions</span>
          <span className="tabular-nums text-zinc-300">Ksh {deductions.toLocaleString()}</span>
        </div>
        <DeductionBar
          height={6}
          segments={[
            { label: "SHA", value: sha, className: "bg-sky-500" },
            { label: "NSSF", value: nssf, className: "bg-violet-500" },
            { label: "System", value: sys, className: "bg-zinc-500" },
            { label: "Shorts", value: shorts, className: "bg-red-500" },
            { label: "Advance", value: adv, className: "bg-amber-500" },
            { label: "Breakages", value: breakages, className: "bg-orange-500" },
          ]}
        />
      </div>

      <div className="mt-4 flex items-end justify-between rounded-xl border border-line bg-bg px-4 py-3">
        <div>
          <span className="block text-[11px] text-zinc-500">Gross (paid)</span>
          <span className="text-sm font-semibold tabular-nums text-zinc-200">Ksh {paid.toLocaleString()}</span>
        </div>
        <div className="text-right">
          <span className="block text-[11px] font-medium text-emerald-500">Net salary</span>
          <span className="display-num text-2xl text-emerald-400">Ksh {net.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}