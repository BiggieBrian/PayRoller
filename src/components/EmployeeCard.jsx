import React, { useState, useEffect } from 'react';
import { calculateSHA, calculateNSSF, calculateOvertimePay } from '../utils/payrollCalculations';

// Small reusable label for a field that's currently showing a computed
// value vs one the admin has typed over manually.
function CalcTag({ isManual, onReset }) {
  return isManual ? (
    <button
      type="button"
      onClick={onReset}
      title="Click to restore the auto-calculated value"
      className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wide"
    >
      Manually adjusted · reset
    </button>
  ) : (
    <span className="text-[9px] text-emerald-500/80 font-semibold uppercase tracking-wide">
      Auto-calculated
    </span>
  );
}

export default function EmployeeCard({ employee, onUpdate, onDelete, readOnly = false, canDelete = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...employee });

  // Tracks which computed fields the admin has typed over manually, so we
  // stop silently overwriting their number every time hours/salary change.
  const [manualOverrides, setManualOverrides] = useState({
    sha: false,
    nssf: false,
    overtime: false,
  });

  // Re-derive SHA / NSSF / overtime whenever their inputs change, unless
  // the admin has manually overridden that specific field.
  useEffect(() => {
    if (!isEditing) return;

    const basic = Number(editData.basic_salary || 0);
    const ordinaryHours = Number(editData.overtime_ordinary_hours || 0);
    const restDayHours = Number(editData.overtime_restday_hours || 0);

    const overtimeCalc = calculateOvertimePay(basic, ordinaryHours, restDayHours);
    const grossPay = basic + overtimeCalc.total;

    setEditData(prev => ({
      ...prev,
      ...(manualOverrides.overtime ? {} : { overtime: overtimeCalc.total }),
      ...(manualOverrides.sha ? {} : { sha: calculateSHA(grossPay) }),
      ...(manualOverrides.nssf ? {} : { nssf: calculateNSSF(grossPay).employee }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editData.basic_salary,
    editData.overtime_ordinary_hours,
    editData.overtime_restday_hours,
    manualOverrides,
    isEditing,
  ]);

  const markManual = (field, value) => {
    setManualOverrides(prev => ({ ...prev, [field]: true }));
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const resetToCalculated = (field) => {
    setManualOverrides(prev => ({ ...prev, [field]: false }));
    // The useEffect above will immediately recompute it once the flag flips.
  };

  const handleSave = () => {
    // Parse everything to numbers so calculations don't break
    const updated = {
      ...editData,
      basic_salary: Number(editData.basic_salary || 0),
      fixed_salary: Number(editData.basic_salary || 0), // keep in sync — payslip/PDF read fixed_salary
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

  // Immediate frontend math (no DB trips)
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

  if (isEditing) {
    return (
      <div className="bg-slate-900 border border-emerald-500 rounded-xl p-5 shadow-lg space-y-4 text-slate-200">
        <h3 className="text-sm font-bold text-emerald-400 uppercase">Edit {employee.full_name}</h3>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-0.5">Full Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.full_name || ''}
              onChange={e => setEditData({ ...editData, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Position</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.role || ''}
              onChange={e => setEditData({ ...editData, role: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Bank Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.bank_name || ''}
              onChange={e => setEditData({ ...editData, bank_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">ACC NO.</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.account_number || ''}
              onChange={e => setEditData({ ...editData, account_number: e.target.value })}
            />
          </div>

          <div className="col-span-2 border-t border-slate-800 my-1 pt-1 font-semibold text-slate-400">Earnings</div>
          <div>
            <label className="text-slate-400 block mb-0.5">Basic (Ksh)</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.basic_salary || 0}
              onChange={e => setEditData({ ...editData, basic_salary: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Ordinary OT hours</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.overtime_ordinary_hours || 0}
              onChange={e => setEditData({ ...editData, overtime_ordinary_hours: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Rest-day / holiday OT hours</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.overtime_restday_hours || 0}
              onChange={e => setEditData({ ...editData, overtime_restday_hours: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-slate-400">Overtime pay (Ksh)</label>
              <CalcTag
                isManual={manualOverrides.overtime}
                onReset={() => resetToCalculated('overtime')}
              />
            </div>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.overtime || 0}
              onChange={e => markManual('overtime', e.target.value)}
            />
          </div>

          <div className="col-span-2 border-t border-slate-800 my-1 pt-1 font-semibold text-slate-400">Deductions</div>

          <div className="col-span-2 bg-amber-950/40 border border-amber-800/50 rounded px-2 py-1.5 text-[10px] text-amber-300 leading-snug">
            SHA and NSSF below are auto-calculated from gross pay using current rates
            (SHA 2.75%, NSSF bands: KES 9,000 / 108,000). These bands change periodically —
            confirm they still match the official rate before saving, especially after a
            rate-change announcement or for a mid-month joiner/leaver.
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-slate-400">SHA</label>
              <CalcTag isManual={manualOverrides.sha} onReset={() => resetToCalculated('sha')} />
            </div>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.sha || 0}
              onChange={e => markManual('sha', e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-slate-400">NSSF</label>
              <CalcTag isManual={manualOverrides.nssf} onReset={() => resetToCalculated('nssf')} />
            </div>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.nssf || 0}
              onChange={e => markManual('nssf', e.target.value)}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Sys Deduct</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.system_deduction || 0}
              onChange={e => setEditData({ ...editData, system_deduction: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Shorts</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.shorts || 0}
              onChange={e => setEditData({ ...editData, shorts: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Advance</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.advance || 0}
              onChange={e => setEditData({ ...editData, advance: e.target.value })}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Breakages</label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.breakages || 0}
              onChange={e => setEditData({ ...editData, breakages: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 text-xs pt-1">
          <button
            onClick={() => setIsEditing(false)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm hover:border-slate-850 transition-all text-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white">{employee.full_name}</h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase">{employee.role || 'Staff'}</p>
        </div>
        <div className="flex gap-1.5">
          {!readOnly && (
            <button
              onClick={() => {
                setEditData({ ...employee });
                setManualOverrides({
                  sha: !!employee.sha_is_manual,
                  nssf: !!employee.nssf_is_manual,
                  overtime: !!employee.overtime_is_manual,
                });
                setIsEditing(true);
              }}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
            >
              Edit
            </button>
          )}
          {!readOnly && canDelete && (
            <button
              onClick={() => onDelete(employee.id)}
              className="text-[11px] bg-red-950 hover:bg-red-900 text-red-200 px-2 py-1 rounded"
            >
              Delete
            </button>
          )}
          {readOnly && (
            <span className="text-[9px] text-zinc-500 uppercase tracking-wide font-semibold px-2 py-1">
              View only
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-[10px] text-slate-400 border-b border-slate-850 pb-2.5">
        <div>
          <span className="block text-slate-500">BANK NAME</span>
          <span className="font-semibold text-slate-300">{employee.bank_name || '—'}</span>
        </div>
        <div>
          <span className="block text-slate-500">ACC NO.</span>
          <span className="font-semibold text-slate-300">{employee.account_number || '—'}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px]">Basic Salary:</span>
          <span className="font-semibold text-slate-100">Ksh {basic.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Overtime:</span>
          <span className="font-semibold text-emerald-400">+ Ksh {overtime.toLocaleString()}</span>
        </div>

        <div className="col-span-2 bg-slate-950/70 p-2 rounded text-[10px] text-red-400/90 grid grid-cols-6 gap-1 text-center">
          <div>
            <span className="text-slate-600 block text-[9px]">SHA</span>
            <span>{sha}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[9px]">NSSF</span>
            <span>{nssf}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[9px]">SYS DED</span>
            <span>{sys}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[9px]">SHORTS</span>
            <span>{shorts}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[9px]">ADVANCE</span>
            <span>{adv}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[9px]">BREAKAGES</span>
            <span>{breakages}</span>
          </div>
        </div>

        <div className="col-span-2 flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-850 mt-1">
          <div>
            <span className="text-slate-500 text-[9px] block">TOTAL (PAID)</span>
            <span className="text-xs font-bold text-slate-200">Ksh {paid.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 text-[10px] font-bold block">NET SALARY</span>
            <span className="text-sm font-extrabold text-emerald-400">Ksh {net.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}