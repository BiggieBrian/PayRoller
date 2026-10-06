// Matches names read from the sheet (often first names only) to employees.
// Returns an array aligned with sheetRows: employee id, or null if unsure.
const tokens = (s) => String(s || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);

function withinOneEdit(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return s.slice(i) === l.slice(i + 1);
}

export function matchSheetRows(sheetRows, employees) {
  const emp = employees.map((e) => ({ id: e.id, t: tokens(e.full_name) }));
  const result = sheetRows.map(() => null);
  const claimed = new Set();

  const passes = [
    (s, e) => e.t[0] && s[0] === e.t[0],                               // first name = first name
    (s, e) => s.some((x) => e.t.includes(x)),                          // any name token matches
    (s, e) => s.some((x) => x.length >= 4 && e.t.some((y) => y.length >= 4 && withinOneEdit(x, y))), // typo-tolerant
  ];

  for (const test of passes) {
    sheetRows.forEach((row, i) => {
      if (result[i]) return;
      const s = tokens(row.name);
      if (!s.length) return;
      const cands = emp.filter((e) => !claimed.has(e.id) && test(s, e));
      if (cands.length === 1) {
        result[i] = cands[0].id;
        claimed.add(cands[0].id);
      }
    });
  }
  return result;
}