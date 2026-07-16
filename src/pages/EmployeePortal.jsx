import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function EmployeePortal() {
  const { profile, logout } = useAuth();
  const [showSalary, setShowSalary] = useState(true);

  // Guard against asynchronous loading "zero flash"
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  // Formatting utility for Kenyan Shilling (KES)
  const formatKES = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Salary Calculations
  const basicSalary = Number(profile?.fixed_salary || 0);
  const overtime = Number(profile?.current_overtime || 0);
  const totalPaid = basicSalary + overtime;

  // Deductions
  const systemDeduction = Number(profile?.current_system_deduction || 0);
  const shorts = Number(profile?.current_shorts || 0);
  const advance = Number(profile?.current_advance || 0);
  const breakages = Number(profile?.current_breakages || 0);
  
  const totalDeductions = systemDeduction + shorts + advance + breakages;
  const netSalary = totalPaid - totalDeductions;

  // Embedded PDF Generator utilizing the True Black & White Admin branding
  const handleDownloadPayslip = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const payPeriod = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

    // 1. Sleek Black Header Block (Matches the top/sidebar of Admin)
    doc.setFillColor(9, 9, 11); // zinc-950
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255); // Solid White
    doc.text('PAYROLLER', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170); // zinc-400
    doc.text('AUTOMATED WORKFORCE SYSTEM', 14, 28);

    // Payslip Badge (Matches White-on-Dark Inputs)
    doc.setFillColor(24, 24, 27); // zinc-800
    doc.roundedRect(145, 8, 51, 18, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL PAYSLIP', 149, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(`Period: ${payPeriod}`, 149, 21);

    // 2. Metadata Columns
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(9, 9, 11); // Black
    doc.text('EMPLOYEE RECORD', 14, 48);
    doc.line(14, 50, 95, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91); // zinc-600
    doc.text(`Name:  ${profile?.full_name || 'Staff Member'}`, 14, 56);
    doc.text(`Role:  ${profile?.role?.toUpperCase() || 'STAFF'}`, 14, 61);
    doc.text(`Bank:  ${profile?.bank_name || 'COOP'}`, 14, 66);
    doc.text(`Acct:   ${profile?.bank_account_number || 'N/A'}`, 14, 71);

    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT DETAILS', 115, 48);
    doc.line(115, 50, 196, 50);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(`Print Date: ${new Date().toLocaleDateString('en-KE')}`, 115, 56);
    doc.text('Status: Paid & Reconciled', 115, 61);
    doc.text('System ID: Automated Run', 115, 66);

    // 3. Structured Data Breakdown (Clean Slate/Zinc styling)
    doc.autoTable({
      startY: 80,
      head: [['Earnings Category', 'Amount', 'Deductions Category', 'Amount']],
      body: [
        ['Basic Salary', formatKES(basicSalary), 'System Deductions', formatKES(systemDeduction)],
        ['Overtime Work', formatKES(overtime), 'Shortages', formatKES(shorts)],
        ['', '', 'Salary Advances', formatKES(advance)],
        ['', '', 'Breakages / Losses', formatKES(breakages)],
        [
          { content: 'Total Gross Earnings', styles: { fontStyle: 'bold', fillColor: [244, 244, 245] } },
          { content: formatKES(totalPaid), styles: { fontStyle: 'bold', fillColor: [244, 244, 245] } },
          { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [244, 244, 245] } },
          { content: formatKES(totalDeductions), styles: { fontStyle: 'bold', fillColor: [244, 244, 245] } }
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [9, 9, 11], // Black headers
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [39, 39, 42] // zinc-800
      },
      columnStyles: {
        1: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // 4. Highlighted Net Pay Banner (Minimal High Contrast)
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(244, 244, 245); // Light Gray Band
    doc.setDrawColor(228, 228, 231); 
    doc.setLineWidth(0.3);
    doc.roundedRect(14, finalY, 182, 16, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(9, 9, 11);
    doc.text('NET DISBURSED AMOUNT', 18, finalY + 10);
    doc.setFontSize(11);
    doc.text(formatKES(netSalary), 190, finalY + 10, { align: 'right' });

    // 5. System Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text('This is an official system-verified transaction copy.', 105, 282, { align: 'center' });

    doc.save(`Payslip_${profile?.full_name?.split(' ')[0] || 'Staff'}_${payPeriod.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-12">
      
      {/* Header (Matches Admin Topbar) */}
      <header className="border-b border-zinc-900 bg-[#09090b] sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="h-5 w-5 rounded bg-emerald-500 text-[#09090b] font-black text-xs flex items-center justify-center">P</span>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">PayRoller</h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">Staff Portal</p>
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
              Sasa, {profile?.full_name?.split(' ')[0] || 'Grace'}! 👋
            </h2>
            <p className="text-xs text-zinc-500">
              Role: <span className="text-zinc-300 font-semibold uppercase">{profile?.role || 'Employee'}</span>
            </p>
          </div>

          {/* Clean Black/Gray PDF Button - matches "Copy Link" styling */}
          <button
            onClick={handleDownloadPayslip}
            className="flex flex-col items-center justify-center h-11 w-11 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-zinc-800 transition-all duration-200 text-zinc-200 hover:text-white shadow-md active:scale-95 group"
            title="Export PDF Payslip"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-0.5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[8px] font-black tracking-wider text-zinc-500 group-hover:text-zinc-300 uppercase">PDF</span>
          </button>
        </div>

        {/* Interactive Earnings Statement */}
        <section className="bg-[#121212] border border-zinc-900 rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
            <h3 className="font-bold text-white text-sm tracking-wide">Monthly Statement</h3>
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
                <span className="font-mono">{showSalary ? `-${formatKES(systemDeduction)}` : "••••"}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Shortages</span>
                <span className="font-mono">{showSalary ? `-${formatKES(shorts)}` : "••••"}</span>
              </div>
              <div className="flex justify-between">
                <span>Salary Advances</span>
                <span className="font-mono">{showSalary ? `-${formatKES(advance)}` : "••••"}</span>
              </div>
              <div className="flex justify-between">
                <span>Breakages / Loss</span>
                <span className="font-mono">{showSalary ? `-${formatKES(breakages)}` : "••••"}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-zinc-500 font-bold pt-1">
              <span>Total Deductions</span>
              <span className="font-mono">{showSalary ? `-${formatKES(totalDeductions)}` : "••••••"}</span>
            </div>

            {/* Total Take-Home (Subtle Highlight Green/White combo) */}
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
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mb-0.5">Disbursal Account</p>
              <span className="font-bold text-zinc-300">
                {profile?.bank_name || 'COOP BANK'} — {profile?.bank_account_number || '••••••••'}
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