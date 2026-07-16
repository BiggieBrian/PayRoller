import React from 'react';
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut';

export default function EmployeePortal() {
  const { profile, logout } = useAuth();

  // Clean formatting for KES
  const formatKES = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Exact math from your spreadsheet image:
  const basicSalary = Number(profile?.fixed_salary || 0);
  const overtime = Number(profile?.current_overtime || 0);
  const totalPaid = basicSalary + overtime;

  // Deductions from your sheet:
  const systemDeduction = Number(profile?.current_system_deduction || 0);
  const shorts = Number(profile?.current_shorts || 0);
  const advance = Number(profile?.current_advance || 0);
  const breakages = Number(profile?.current_breakages || 0);
  
  const totalDeductions = systemDeduction + shorts + advance + breakages;
  const netSalary = totalPaid - totalDeductions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-emerald-400 tracking-tight">PayRoller</h1>
            <p className="text-xs text-slate-400">Employee Portal</p>
          </div>
          <button 
            onClick={logout} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl font-bold transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        
        {/* Welcome */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-1 rounded-full">
            Active Staff
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-3">
            Sasa, {profile?.full_name?.split(' ')[0] || 'Employee'}! 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Position: <span className="text-slate-200 font-semibold uppercase">{profile?.role || 'Staff'}</span>
          </p>
        </div>

        {/* FEATURE TOGGLE: Only show ClockInOut if enabled by the tenant admin */}
        {profile?.clock_in_enabled !== false ? (
          <section>
            <ClockInOut 
              geofenceEnabled={profile?.geofence_enabled}
              targetLat={profile?.target_lat}
              targetLng={profile?.target_lng}
              allowedRadius={profile?.allowed_radius_meters}
            />
          </section>
        ) : (
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-sm text-slate-500">
            ⏰ Shift tracking is disabled for this location.
          </div>
        )}

        {/* Spreadsheet-Matched Earnings Summary */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200">Current Month Pay</h3>
            <span className="text-xs text-slate-500">Summary</span>
          </div>

          <div className="space-y-3 text-sm">
            {/* Earnings */}
            <div className="flex justify-between text-slate-400">
              <span>Basic Salary</span>
              <span className="text-slate-200 font-mono font-medium">{formatKES(basicSalary)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Overtime</span>
              <span className="text-emerald-400 font-mono font-medium">+{formatKES(overtime)}</span>
            </div>
            
            <div className="flex justify-between border-t border-slate-800/60 pt-2 text-slate-300 font-semibold">
              <span>Total Gross (Paid)</span>
              <span className="font-mono text-white">{formatKES(totalPaid)}</span>
            </div>

            {/* Deductions */}
            <div className="border-t border-slate-800/60 pt-2 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>System Deduction</span>
                <span className="font-mono">-{formatKES(systemDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shorts</span>
                <span className="font-mono">-{formatKES(shorts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Advance</span>
                <span className="font-mono">-{formatKES(advance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Breakages</span>
                <span className="font-mono">-{formatKES(breakages)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-red-400/80 font-medium pt-1">
              <span>Total Deductions</span>
              <span className="font-mono">-{formatKES(totalDeductions)}</span>
            </div>

            {/* Net Salary */}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-slate-300">Net Take-Home</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {formatKES(netSalary)}
              </span>
            </div>
          </div>
        </section>

        {/* Banking Info */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-xs text-slate-500 mb-2">Linked Account</p>
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-300">
              {profile?.bank_name || 'COOP'} — {profile?.bank_account_number || 'No Account'}
            </span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/30">
              Active
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}