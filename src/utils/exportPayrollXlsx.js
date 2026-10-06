// Builds the Whizperz payroll .xlsx (layout: A no., B-E staff details, F-N amounts).
// Requires: npm i exceljs
export async function exportPayrollXlsx(employees, title) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  const font = { name: "Arial", size: 10 };
  const n = (v) => Number(v || 0);

  ws.mergeCells("B1:M1");
  ws.getCell("B1").value = title;
  ws.getCell("B1").font = { name: "Arial", size: 13, bold: true };

  const headers = ["NAME", "POSITION", "BANK NAME", "ACC NO.", "BASIC SALARY", "OVERTIME", "PAID",
    "SYSTEM DEDUCTION", "SHORTS", "ADVANCE", "BREAKAGES", "DEDUCTIONS", "NET SALARY"];
  headers.forEach((h, i) => {
    const c = ws.getCell(2, i + 2);
    c.value = h;
    c.font = { ...font, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  employees.forEach((e, i) => {
    const r = i + 3;
    const basic = n(e.basic_salary), ot = n(e.overtime);
    const ded = n(e.system_deduction) + n(e.shorts) + n(e.advance) + n(e.breakages);
    ws.getCell(`A${r}`).value = i + 1;
    ws.getCell(`B${r}`).value = String(e.full_name || "").toUpperCase();
    ws.getCell(`C${r}`).value = String(e.job_title || "").toUpperCase();
    ws.getCell(`D${r}`).value = String(e.bank_name || "").toUpperCase();
    ws.getCell(`E${r}`).value = String(e.account_number || e.bank_account_number || ""); // text keeps leading zeros
    ws.getCell(`E${r}`).numFmt = "@";
    ws.getCell(`F${r}`).value = basic;
    ws.getCell(`G${r}`).value = ot || null;
    ws.getCell(`H${r}`).value = { formula: `F${r}+G${r}`, result: basic + ot };
    ws.getCell(`I${r}`).value = n(e.system_deduction) || null;
    ws.getCell(`J${r}`).value = n(e.shorts) || null;
    ws.getCell(`K${r}`).value = n(e.advance) || null;
    ws.getCell(`L${r}`).value = n(e.breakages) || null;
    ws.getCell(`M${r}`).value = { formula: `SUM(I${r}:L${r})`, result: ded };
    ws.getCell(`N${r}`).value = { formula: `H${r}-M${r}`, result: basic + ot - ded };
  });

  const last = employees.length + 2, t = last + 1;
  ws.getCell(`B${t}`).value = "TOTALS";
  "FGHIJKLMN".split("").forEach((L) => {
    ws.getCell(`${L}${t}`).value = { formula: `SUM(${L}3:${L}${last})` };
  });

  for (let r = 2; r <= t; r++) {
    for (let c = 1; c <= 14; c++) {
      const cell = ws.getCell(r, c);
      if (r > 2) cell.font = { ...font, bold: r === t };
      if (r > 2 && c >= 6) cell.numFmt = "#,##0;(#,##0);-";
      if (r > 1) cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }
  }
  [5, 30, 16, 14, 18, 13, 11, 11, 15, 10, 10, 12, 13, 13].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.views = [{ state: "frozen", ySplit: 2 }];

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}