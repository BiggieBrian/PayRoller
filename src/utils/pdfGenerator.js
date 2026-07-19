import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // 1. Import it as a default function export

export const generatePayslipPDF = (profile) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formatKES = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Math Calculations
  const basicSalary = Number(profile?.fixed_salary || 0);
  const overtime = Number(profile?.current_overtime || 0);
  const totalPaid = basicSalary + overtime;

  const systemDeduction = Number(profile?.current_system_deduction || 0);
  const shorts = Number(profile?.current_shorts || 0);
  const advance = Number(profile?.current_advance || 0);
  const breakages = Number(profile?.current_breakages || 0);
  
  const totalDeductions = systemDeduction + shorts + advance + breakages;
  const netSalary = totalPaid - totalDeductions;
  
  const payPeriod = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  // 1. Sleek Black Header Block
  doc.setFillColor(9, 9, 11); // zinc-950
  doc.rect(0, 0, 210, 35, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYROLLER', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.text('AUTOMATED WORKFORCE SYSTEM', 14, 28);

  // Payslip Badge
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
  doc.setTextColor(9, 9, 11);
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

  // 3. Structured Data Table (Bypasses doc.autoTable to avoid the type error)
  autoTable(doc, {
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
      fillColor: [9, 9, 11],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [39, 39, 42]
    },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // 4. Highlighted Net Pay Banner
  // Grabbing the vertical coordinate safely from the document instance directly
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

  // Save document
  doc.save(`Payslip_${profile?.full_name?.split(' ')[0] || 'Staff'}_${payPeriod.replace(/\s+/g, '_')}.pdf`);
};