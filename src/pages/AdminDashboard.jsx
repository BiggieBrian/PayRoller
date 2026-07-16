import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import EmployeeCard from '../components/EmployeeCard';
import { CheckCircle, Coins, Plus, Minus, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'directory', 'payroll', 'invites'
  const [loading, setLoading] = useState(true);
  const [dbEmployees, setDbEmployees] = useState([]); // Master copy from DB for state tracking
  const [employees, setEmployees] = useState([]);     // Local draft state
  const [activeShifts, setActiveShifts] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Onboarding invite states
  const [inviteRole, setInviteRole] = useState('Waiter');
  const [inviteBaseSalary, setInviteBaseSalary] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  // New employee form state
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Waiter', // Maps to 'job_title' in database write
    basicSalary: ''
  });

  const showNotice = (text, type = 'info') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 5000);
  };

  // Check if our local draft state differs from our DB master copies
  const hasUnsavedChanges = JSON.stringify(dbEmployees) !== JSON.stringify(employees);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setAdminProfile(profileData);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_id', profileData.restaurant_id)
        .order('full_name', { ascending: true });

      if (employeesError) throw employeesError;
      
      const cleanEmployees = employeesData || [];
      setDbEmployees(JSON.parse(JSON.stringify(cleanEmployees))); // Deep copy for comparison
      setEmployees(cleanEmployees);

      // Fetch active shifts (Overview tracker)
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles!employee_id ( full_name, job_title, restaurant_id )
        `)
        .is('clock_out', null);

      if (shiftsError) throw shiftsError;

      const tenantActiveShifts = (shiftsData || []).filter(
        shift => shift.profiles?.restaurant_id === profileData.restaurant_id
      );
      setActiveShifts(tenantActiveShifts);

    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler 1: Update fields locally (Now works seamlessly with Card inputs!)
  const handleLocalFieldChange = (employeeId, fieldName, value) => {
    const numericValue = parseFloat(value) || 0;
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, [fieldName]: numericValue };
      }
      return emp;
    }));
  };

  // Handler 2: Bulk batch save local state back to Supabase
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const promises = employees.map(emp => 
        supabase
          .from('profiles')
          .update({
            full_name: emp.full_name,
            role: emp.role || 'employee', 
            job_title: emp.job_title,     
            bank_name: emp.bank_name,
            account_number: emp.account_number,
            basic_salary: Number(emp.basic_salary || 0),
            overtime: Number(emp.overtime || 0), // Kept structure-compatible if schema demands
            system_deduction: Number(emp.system_deduction || 0),
            shorts: Number(emp.shorts || 0),
            advance: Number(emp.advance || 0),
            breakages: Number(emp.breakages || 0),
          })
          .eq('id', emp.id)
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
    if (window.confirm("Are you sure you want to discard your unsaved edits?")) {
      setEmployees(JSON.parse(JSON.stringify(dbEmployees)));
      showNotice("Unsaved changes discarded.", "info");
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      showNotice("Please enter an employee name", "error");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          full_name: formData.fullName,
          role: 'employee',             
          job_title: formData.role,     
          basic_salary: Number(formData.basicSalary || 0),
          restaurant_id: adminProfile.restaurant_id
        }]);

      if (error) throw error;
      showNotice('Employee profile added!', 'success');
      setFormData({ fullName: '', role: 'Waiter', basicSalary: '' });
      fetchData();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showNotice('Employee profile removed successfully.', 'success');
      fetchData();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleGenerateInvite = () => {
    if (!adminProfile) return;
    const origin = window.location.origin;
    const link = `${origin}/register?restaurant_id=${adminProfile.restaurant_id}&role=${encodeURIComponent(inviteRole)}&basic_salary=${inviteBaseSalary || 0}`;
    setGeneratedLink(link);
    showNotice('Invite link created!', 'success');
  };

  const downloadPayrollSpreadsheet = () => {
    if (employees.length === 0) {
      showNotice("No employee data available to export", "error");
      return;
    }

    const headers = [
      "NAME", "POSITION", "BANK NAME", "ACC NO.", "BASIC SALARY",
      "BONUS", "SYSTEM DEDUCTION", "SHORTS", "ADVANCE", "BREAKAGES", 
      "TOTAL DEDUCTIONS", "NET SALARY"
    ];

    let sumBasic = 0, sumBonus = 0, sumSys = 0, sumShorts = 0, sumAdv = 0, sumBreak = 0, sumDeduct = 0, sumNet = 0;

    const rows = employees.map(emp => {
      const basic = Number(emp.basic_salary || 0);
      const bonus = Number(emp.overtime || 0); // Using the overtime field mapped internally as our card "bonus"
      const sys = Number(emp.system_deduction || 0);
      const shorts = Number(emp.shorts || 0);
      const adv = Number(emp.advance || 0);
      const breakages = Number(emp.breakages || 0);
      
      const deductions = sys + shorts + adv + breakages;
      const net = Math.max(0, (basic + bonus) - deductions);

      sumBasic += basic; sumBonus += bonus;
      sumSys += sys; sumShorts += shorts; sumAdv += adv; sumBreak += breakages;
      sumDeduct += deductions; sumNet += net;

      return [
        `"${emp.full_name || ''}"`,
        `"${emp.job_title || ''}"`,
        `"${emp.bank_name || ''}"`,
        `'${emp.account_number || ''}`,
        basic, bonus, sys, shorts, adv, breakages, deductions, net
      ];
    });

    const totals = [
      "TOTALS", "", "", "", sumBasic, sumBonus, sumSys, sumShorts, sumAdv, sumBreak, sumDeduct, sumNet
    ];

    const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
    const sheetTitle = `"${adminProfile?.restaurant_id ? 'WHIZPERZ' : 'PAYROLLER'} ${monthLabel} PAY ROLL",,,,,,,,,,,`;

    const csvContent = [
      sheetTitle,
      headers.join(","),
      ...rows.map(r => r.join(",")),
      totals.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${monthLabel.replace(" ", "_")}_Payroll.csv`;
    link.click();
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 sm:pb-32">
      
      {/* Unsaved Edits Notification Bar (Sticky Footer) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-white">⚠️ Unsaved payroll modifications</p>
            <p className="text-xs text-slate-400">Database values will not change until manually synced.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleDiscardChanges}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 rounded-lg text-xs font-black transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {notice.text && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-semibold transition-all ${
          notice.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200' : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
        }`}>
          {notice.text}
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-emerald-400 tracking-tight">PayRoller Admin</h1>
          <p className="text-xs text-slate-400">Workspace Management Portal</p>
        </div>
        <button 
          onClick={fetchData}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-850 px-3.5 py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Refresh Live Database</span>
        </button>
      </div>

      {/* Tabs Menu Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 snap-start px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-300'}`}
        >
          📊 Overview
        </button>
        <button 
          onClick={() => setActiveTab('directory')}
          className={`shrink-0 snap-start px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-300'}`}
        >
          👥 Employee Directory
        </button>
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`shrink-0 snap-start px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-300'}`}
        >
          💸 Payroll Hub
        </button>
        <button 
          onClick={() => setActiveTab('invites')}
          className={`shrink-0 snap-start px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'invites' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-300'}`}
        >
          ✉️ Onboarding Portal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm font-medium animate-pulse">
          Fetching profiles and sync metrics...
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Analytics Metric Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total Active Staff</span>
                  <span className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">{employees.length} Members</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">On Shift Currently</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">{activeShifts.length} Active</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-900 p-5 rounded-xl flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Calculated Net Liability</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">
                    Ksh {employees.reduce((acc, emp) => {
                      const basic = Number(emp.basic_salary || 0);
                      const bonus = Number(emp.overtime || 0); // overtime internally maps to the custom card bonus
                      const ded = Number(emp.system_deduction || 0) + Number(emp.shorts || 0) + Number(emp.advance || 0) + Number(emp.breakages || 0);
                      return acc + Math.max(0, (basic + bonus) - ded);
                    }, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Functional Dashboard Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Add Employee */}
                <div className="bg-slate-900/50 border border-slate-900 p-5 sm:p-6 rounded-xl col-span-1">
                  <h2 className="text-lg font-bold mb-4 text-white">Add Employee Profile</h2>
                  <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-semibold">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Collins Oduor"
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-semibold">Role / Position</label>
                      <select 
                        className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="Waiter">Waiter</option>
                        <option value="Chef">Chef</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Steward">Steward</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-semibold">Base Salary (KES)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 18000"
                        className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                        value={formData.basicSalary}
                        onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded transition-colors"
                    >
                      Add Employee Profile
                    </button>
                  </form>
                </div>

                {/* Tracker Section */}
                <div className="bg-slate-900/50 border border-slate-900 p-5 sm:p-6 rounded-xl col-span-1 lg:col-span-2">
                  <h2 className="text-lg font-bold mb-4 text-white">Live On-Duty Shift Tracker</h2>
                  {activeShifts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-850 rounded-lg text-slate-500 text-sm">
                      No active employee shifts logged in right now.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {activeShifts.map(shift => (
                        <div key={shift.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-900 gap-4">
                          <div>
                            <span className="font-bold text-slate-200 block text-sm">{shift.profiles?.full_name}</span>
                            <span className="text-xs text-emerald-400 font-semibold">{shift.profiles?.job_title}</span>
                          </div>
                          <div className="text-right text-xs shrink-0">
                            <span className="text-slate-400 block">Clocked In</span>
                            <span className="text-slate-200 font-mono font-semibold">
                              {new Date(shift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DIRECTORY CARDS */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Search by name or position..." 
                  className="w-full sm:max-w-md bg-slate-900 border border-slate-850 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No matching employees found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map(emp => (
                    <EmployeeCard 
                      key={emp.id} 
                      employee={emp} 
                      onUpdate={(id, updatedData) => {
                        setEmployees(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
                      }} 
                      onDelete={handleDeleteProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONTHLY PAYROLL HUB (REFACTORED CARDS!) */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Monthly Payroll Run</h2>
                  <p className="text-sm text-slate-400">Adjust monthly parameters below. Changes are held as local draft until saved via the footer banner.</p>
                </div>
                <button 
                  onClick={downloadPayrollSpreadsheet}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors text-center flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  <span>Export Payroll (.csv)</span>
                </button>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded-lg text-slate-500 text-sm">
                  No employee profiles registered to calculate payroll for.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees.map(emp => {
                    const basic = Number(emp.basic_salary || 0);
                    const bonus = Number(emp.overtime || 0); // Maps dynamically to existing overtime column structure
                    
                    const sys = Number(emp.system_deduction || 0);
                    const shorts = Number(emp.shorts || 0);
                    const adv = Number(emp.advance || 0);
                    const breakages = Number(emp.breakages || 0);
                    const totalDeductions = sys + shorts + adv + breakages;
                    
                    const netPay = Math.max(0, (basic + bonus) - totalDeductions);

                    return (
                      <div 
                        key={emp.id} 
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
                      >
                        <div>
                          {/* Header: Name & Role */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-slate-100 text-lg">{emp.full_name}</h3>
                              <span className="inline-block bg-slate-800 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1">
                                {emp.job_title || 'Staff'}
                              </span>
                            </div>
                          </div>

                          <hr className="border-slate-800/60 my-4" />

                          {/* Base Salary Line */}
                          <div className="flex justify-between items-center text-sm py-2 px-1 text-slate-400">
                            <span>Base Salary</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">KES</span>
                              <input 
                                type="number" 
                                value={emp.basic_salary || ''} 
                                placeholder="0"
                                onChange={e => handleLocalFieldChange(emp.id, 'basic_salary', e.target.value)}
                                className="w-24 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 px-2 py-1 rounded text-right font-mono text-sm outline-none transition-colors"
                              />
                            </div>
                          </div>

                          {/* Adjustments (Inputs) */}
                          <div className="space-y-3 mt-3">
                            <div>
                              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                <Plus size={10} className="text-emerald-500" /> Performance Bonus
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-slate-500 font-semibold font-mono">KES</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={emp.overtime || ''} // Bound to schema key
                                  onChange={e => handleLocalFieldChange(emp.id, 'overtime', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 pl-11 pr-3 py-1.5 rounded text-sm outline-none transition-colors font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  <Minus size={10} className="text-red-500" /> Salary Advance
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-semibold font-mono">KES</span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={emp.advance || ''}
                                    onChange={e => handleLocalFieldChange(emp.id, 'advance', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-950 text-slate-200 pl-9 pr-2 py-1.5 rounded text-sm outline-none transition-colors font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  <Minus size={10} className="text-red-500" /> System Deduct
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-semibold font-mono">KES</span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={emp.system_deduction || ''}
                                    onChange={e => handleLocalFieldChange(emp.id, 'system_deduction', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-950 text-slate-200 pl-9 pr-2 py-1.5 rounded text-sm outline-none transition-colors font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  <Minus size={10} className="text-red-500" /> Register Shorts
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-semibold font-mono">KES</span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={emp.shorts || ''}
                                    onChange={e => handleLocalFieldChange(emp.id, 'shorts', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-950 text-slate-200 pl-9 pr-2 py-1.5 rounded text-sm outline-none transition-colors font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  <Minus size={10} className="text-red-500" /> Breakages
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-semibold font-mono">KES</span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={emp.breakages || ''}
                                    onChange={e => handleLocalFieldChange(emp.id, 'breakages', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-950 text-slate-200 pl-9 pr-2 py-1.5 rounded text-sm outline-none transition-colors font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Net pay calculations */}
                        <div className="mt-6 pt-4 border-t border-slate-800/85">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Calculated Net Payout</span>
                              <span className="text-lg font-black text-emerald-400 font-mono">
                                KES {netPay.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                              <Coins size={18} className="text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTAL INVITES */}
          {activeTab === 'invites' && (
            <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 sm:p-6 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">✉️ Onboarding Invitation Engine</h2>
                <p className="text-xs text-slate-400 mt-1">Generate dynamic invite codes linked directly to your dashboard.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1 font-semibold">Pre-assign Position/Role</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-white focus:outline-none"
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                    >
                      <option value="Waiter">Waiter</option>
                      <option value="Chef">Chef</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Steward">Steward</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1 font-semibold">Starting Basic Salary (Ksh)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 15000"
                      className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-white focus:outline-none"
                      value={inviteBaseSalary}
                      onChange={e => setInviteBaseSalary(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGenerateInvite}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded transition-colors text-sm"
                >
                  Generate Invitation Link
                </button>

                {generatedLink && (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg mt-4 space-y-2">
                    <span className="text-xs text-slate-400 block font-semibold">Onboarding URL:</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="bg-slate-900 border border-slate-800 text-xs text-emerald-400 rounded px-3 py-2 flex-grow select-all focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          showNotice("Copied to clipboard!", "success");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded text-xs font-semibold shrink-0 transition-all text-center"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}