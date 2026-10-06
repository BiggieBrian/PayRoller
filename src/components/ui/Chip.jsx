

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  zinc: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function Chip({ tone = "zinc", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${TONES[tone] || TONES.zinc} ${className}`}
    >
      {children}
    </span>
  );
}
