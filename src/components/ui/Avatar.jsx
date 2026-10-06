

// Stable color per name, so the same person always gets the same avatar
function hueFor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function Avatar({ name = "", size = 36, className = "" }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
  const hue = hueFor(name);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        color: `hsl(${hue} 80% 80%)`,
        background: `linear-gradient(135deg, hsl(${hue} 45% 22%), hsl(${hue} 55% 14%))`,
        border: `1px solid hsl(${hue} 40% 30% / 0.6)`,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}