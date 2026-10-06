import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animates a number up to its value; shows it instantly if the user prefers reduced motion
export default function CountUp({ value = 0, duration = 700, prefix = "", className = "" }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const begin = from.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = begin + (target - begin) * eased;
      from.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  const shown = reduced ? target : display;

  return (
    <span className={className}>
      {prefix}
      {Math.round(shown).toLocaleString()}
    </span>
  );
}