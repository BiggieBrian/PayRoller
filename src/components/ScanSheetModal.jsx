import { useState } from "react";
import { X, Camera, RotateCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import { matchSheetRows } from "../utils/matchSheetRows";

const z = (v) => Number(v || 0);
const fmt = (v) => z(v).toLocaleString();

// Shrinks the photo (keeps the request small) and applies the chosen rotation.
async function prepareImage(file, rotation) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = bmp.width * scale, h = bmp.height * scale;
  const c = document.createElement("canvas");
  const sideways = rotation % 180 !== 0;
  c.width = sideways ? h : w;
  c.height = sideways ? w : h;
  const ctx = c.getContext("2d");
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  const base64 = await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1]);
    fr.readAsDataURL(blob);
  });
  return { blob, base64 };
}

/**
 * Props:
 *  employees - current draft employees from AdminDashboard
 *  onApply(updates) - updates = { [employeeId]: { overtime, overtime_is_manual, system_deduction, shorts, advance, breakages } }
 *  onClose()
 */
export default function ScanSheetModal({ employees, onApply, onClose }) {
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState(null); // [{ sheet, employeeId, include }]

  const choose = async (f) => {
    if (!f) return;
    setFile(f); setRotation(0); setRows(null); setError("");
    setPreview(URL.createObjectURL((await prepareImage(f, 0)).blob));
  };

  const rotate = async () => {
    const next = (rotation + 90) % 360;
    setRotation(next);
    setPreview(URL.createObjectURL((await prepareImage(file, next)).blob));
  };

  const read = async () => {
    setBusy(true); setError("");
    try {
      const { base64 } = await prepareImage(file, rotation);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/read-payroll-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ image: base64, mediaType: "image/jpeg", names: employees.map((e) => e.full_name) }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Could not read the sheet.");
      const ids = matchSheetRows(out.rows, employees);
      setRows(out.rows.map((sheet, i) => ({ sheet, employeeId: ids[i], include: !!ids[i] })));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setRow = (i, patch) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const check = (s) => {
    const unsure = [s.basic, s.d1, s.d2, s.d3, s.d4, s.net].some((v) => v === null);
    const net = z(s.basic) + z(s.extra) - (z(s.d1) + z(s.d2) + z(s.d3) + z(s.d4));
    return { ok: !unsure && s.net === net, net };
  };

  const chosen = rows ? rows.filter((r) => r.include && r.employeeId) : [];
  const dupes = new Set(chosen.map((r) => r.employeeId)).size !== chosen.length;

  const apply = () => {
    const updates = {};
    chosen.forEach(({ sheet: s, employeeId }) => {
      updates[employeeId] = {
        overtime: z(s.extra), overtime_is_manual: true, system_deduction: z(s.d1), shorts: z(s.d2), advance: z(s.d3), breakages: z(s.d4),
      };
    });
    onApply(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#121214] border border-[#1f1f23] w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Scan handwritten payroll sheet</h2>
            <p className="text-xs text-zinc-500 mt-1">Results go into your unsaved draft. Nothing is saved until you press Save Changes.</p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer bg-white text-black font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <Camera size={14} /> Take / choose photo
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => choose(e.target.files[0])} />
          </label>
          <button disabled={!file} onClick={rotate} className="bg-[#09090b] border border-[#1f1f23] text-zinc-300 text-xs px-4 py-2.5 rounded-lg disabled:opacity-40 flex items-center gap-2">
            <RotateCw size={14} /> Rotate
          </button>
          <button disabled={!file || busy} onClick={read} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">
            {busy ? "Reading… (up to a minute)" : "Read sheet"}
          </button>
        </div>

        {preview && <img src={preview} alt="Sheet preview" className="max-h-52 rounded-lg border border-[#1f1f23]" />}
        {error && <div className="text-xs text-red-300 bg-red-950/40 border border-red-900/60 rounded-lg p-3">{error}</div>}

        {rows && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Read {rows.length} rows, matched {rows.filter((r) => r.employeeId).length}. Rows marked ⚠ don't add up
              to the net salary written on the sheet. Apply them anyway and correct them in the Payroll Hub if needed.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-zinc-300">
                <thead className="text-[10px] text-zinc-500 uppercase">
                  <tr>
                    <th className="text-left p-1" /><th className="text-left p-1">Sheet name</th><th className="text-left p-1">Employee</th>
                    <th className="p-1 text-right">Basic</th><th className="p-1 text-right">OT</th><th className="p-1 text-right">Sys</th>
                    <th className="p-1 text-right">Shorts</th><th className="p-1 text-right">Adv</th><th className="p-1 text-right">Brk</th>
                    <th className="p-1 text-right">Net</th><th className="p-1" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const s = r.sheet, c = check(s);
                    const emp = employees.find((e) => e.id === r.employeeId);
                    const basicDiffers = emp && z(emp.basic_salary) !== z(s.basic);
                    return (
                      <tr key={i} className={`border-t border-[#1f1f23] ${c.ok ? "" : "bg-red-950/20"}`}>
                        <td className="p-1"><input type="checkbox" checked={r.include} disabled={!r.employeeId} onChange={(e) => setRow(i, { include: e.target.checked })} /></td>
                        <td className="p-1">{s.name}</td>
                        <td className="p-1">
                          <select value={r.employeeId || ""} onChange={(e) => setRow(i, { employeeId: e.target.value || null, include: !!e.target.value })}
                            className="bg-[#09090b] border border-[#1f1f23] rounded p-1 max-w-[150px]">
                            <option value="">— choose —</option>
                            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                          </select>
                        </td>
                        <td className={`p-1 text-right ${basicDiffers ? "text-amber-400" : ""}`} title={basicDiffers ? "Differs from the employee's saved basic salary (not changed by scan)" : ""}>{fmt(s.basic)}</td>
                        <td className="p-1 text-right">{fmt(s.extra)}</td>
                        <td className="p-1 text-right">{fmt(s.d1)}</td>
                        <td className="p-1 text-right">{fmt(s.d2)}</td>
                        <td className="p-1 text-right">{fmt(s.d3)}</td>
                        <td className="p-1 text-right">{fmt(s.d4)}</td>
                        <td className="p-1 text-right">{fmt(c.net)}</td>
                        <td className="p-1 text-red-400">{c.ok ? <span className="text-emerald-400">✓</span> : `⚠ sheet: ${s.net === null ? "?" : fmt(s.net)}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {dupes && <div className="text-xs text-amber-300">Two rows point to the same employee. Fix that before applying.</div>}
            <p className="text-[10px] text-zinc-500">Basic salary is shown for checking only; the scan never changes an employee's saved basic salary (amber = differs).</p>
            <button disabled={!chosen.length || dupes} onClick={apply} className="w-full bg-white text-black font-bold text-xs py-2.5 rounded-lg disabled:opacity-40">
              Apply {chosen.length} row{chosen.length === 1 ? "" : "s"} to draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}