import React, { useState } from 'react';

export default function EmployeeCard({ employee, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...employee });

  const handleSave = () => {
    // Parse everything to numbers so calculations don't break
    const updated = {
      ...editData,
      basic_salary: Number(editData.basic_salary || 0),
      overtime: Number(editData.overtime || 0),
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
  
  const sys = Number(employee.system_deduction || 0);
  const shorts = Number(employee.shorts || 0);
  const adv = Number(employee.advance || 0);
  const breakages = Number(employee.breakages || 0);
  const deductions = sys + shorts + adv + breakages;
  
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
              onChange={e => setEditData({...editData, full_name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Position</label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.role || ''} 
              onChange={e => setEditData({...editData, role: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Bank Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.bank_name || ''} 
              onChange={e => setEditData({...editData, bank_name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">ACC NO.</label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.account_number || ''} 
              onChange={e => setEditData({...editData, account_number: e.target.value})}
            />
          </div>

          <div className="col-span-2 border-t border-slate-800 my-1 pt-1 font-semibold text-slate-400">Earnings</div>
          <div>
            <label className="text-slate-400 block mb-0.5">Basic (Ksh)</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.basic_salary || 0} 
              onChange={e => setEditData({...editData, basic_salary: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Overtime (Ksh)</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.overtime || 0} 
              onChange={e => setEditData({...editData, overtime: e.target.value})}
            />
          </div>

          <div className="col-span-2 border-t border-slate-800 my-1 pt-1 font-semibold text-slate-400">Deductions</div>
          <div>
            <label className="text-slate-400 block mb-0.5">Sys Deduct</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.system_deduction || 0} 
              onChange={e => setEditData({...editData, system_deduction: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Shorts</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.shorts || 0} 
              onChange={e => setEditData({...editData, shorts: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Advance</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.advance || 0} 
              onChange={e => setEditData({...editData, advance: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">Breakages</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              value={editData.breakages || 0} 
              onChange={e => setEditData({...editData, breakages: e.target.value})}
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
          <button 
            onClick={() => { setEditData({ ...employee }); setIsEditing(true); }} 
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(employee.id)} 
            className="text-[11px] bg-red-950 hover:bg-red-900 text-red-200 px-2 py-1 rounded"
          >
            Delete
          </button>
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

        <div className="col-span-2 bg-slate-950/70 p-2 rounded text-[10px] text-red-400/90 grid grid-cols-4 gap-1 text-center">
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