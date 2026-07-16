import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePayslipPDF = (profile) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Safe formatting function inside the PDF generator
  const formatKES = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // 1. Math & Calculations
  const basicSalary = Number(profile?.fixed_salary || 0);
  const overtime = Number(profile?.current_overtime || 0);
  const totalGross = basicSalary + overtime;

  const systemDeduction = Number(profile?.current_system_deduction || 0);
  const shorts = Number(profile?.current_shorts || 0);
  const advance = Number(profile?.current_advance || 0);
  const breakages = Number(profile?.current_breakages || 0);
  const totalDeductions = systemDeduction + shorts + advance + breakages;

  const netSalary = totalGross - totalDeductions;
  
  // Get current Month/Year (e.g., "July 2026")
  const payPeriod = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  // 2. Header & Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // Accent Emerald green
  doc.text('PAYROLLER LTD', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Official Monthly Earnings Statement', 14, 25);

  // Payslip Badge (Top Right)
  doc.setFillColor(241, 245, 249);
  doc.rect(140, 12, 56, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYSLIP', 145, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Period: ${payPeriod}`, 145, 23);

  // Decorative divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // 3. Employee & Employer Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EMPLOYEE DETAILS', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${profile?.full_name || 'Staff Member'}`, 14, 46);
  doc.text(`Role: ${profile?.role?.toUpperCase() || 'Staff'}`, 14, 51);
  doc.text(`Bank: ${profile?.bank_name || 'COOP'}`, 14, 56);
  doc.text(`Account No: ${profile?.bank_account_number || 'N/A'}`, 14, 61);

  // Payment Date Metadata
  doc.text(`Print Date: ${new Date().toLocaleDateString('en-KE')}`, 130, 46);
  doc.text('Status: APPROVED & PAID', 130, 51);

  // 4. Financial breakdown table using jspdf-autotable
  doc.autoTable({
    startY: 68,
    head: [['Earnings description', 'Amount (KES)', 'Deductions description', 'Amount (KES)']],
    body: [
      [
        'Basic Salary', 
        formatKES(basicSalary), 
        'System Deductions', 
        formatKES(systemDeduction)
      ],
      [
        'Overtime', 
        formatKES(overtime), 
        'Shortages', 
        formatKES(shorts)
      ],
      [
        '', 
        '', 
        'Salary Advance', 
        formatKES(advance)
      ],
      [
        '', 
        '', 
        'Breakages', 
        formatKES(breakages)
      ],
      // Total Rows
      [
        { content: 'Total Gross Earnings', styles: { fontStyle: 'bold' } },
        { content: formatKES(totalGross), styles: { fontStyle: 'bold' } },
        { content: 'Total Deductions', styles: { fontStyle: 'bold' } },
        { content: formatKES(totalDeductions), styles: { fontStyle: 'bold' } }
      ]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900 background for headers
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' }
    },
  });

  // 5. Summary Section (Net Pay Callout)
  const finalY = doc.lastAutoTable.finalY + 10;

  // Draw a Net Pay highlight box
  doc.setFillColor(240, 253, 250); // Light emerald green background
  doc.setDrawColor(209, 250, 229); // Soft emerald border
  doc.roundedRect(14, finalY, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70); // Dark emerald green text
  doc.text('NET TAKE-HOME PAY', 18, finalY + 11);
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatKES(netSalary), 190, finalY + 11, { align: 'right' });

  // 6. Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated document. No physical signature is required.', 
    98, 
    280, 
    { align: 'center' }
  );

  // Save the generated document
  const fileName = `Payslip_${profile?.full_name?.replace(/\s+/g, '_') || 'Employee'}_${payPeriod.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};