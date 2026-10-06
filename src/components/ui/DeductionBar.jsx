

/**
 * segments: [{ label, value, className }]  (className = a static Tailwind bg class)
 * Zero-value segments are skipped. showLegend adds labels + amounts underneath.
 */
export default function DeductionBar({ segments = [], height = 8, showLegend = false }) {
  const active = segments.filter((s) => Number(s.value) > 0);
  const total = active.reduce((a, s) => a + Number(s.value), 0);

  if (!total) {
    return <div className="w-full rounded-full bg-white/5" style={{ height }} />;
  }

  return (
    <div className="w-full">
      <div className="flex w-full overflow-hidden rounded-full bg-white/5 gap-px" style={{ height }}>
        {active.map((s) => (
          <div
            key={s.label}
            className={`${s.className} transition-all duration-500`}
            style={{ width: `${(Number(s.value) / total) * 100}%` }}
            title={`${s.label}: ${Number(s.value).toLocaleString()}`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {active.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`h-2 w-2 rounded-full ${s.className}`} />
              <span>{s.label}</span>
              <span className="text-zinc-200 tabular-nums">{Number(s.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}