import { cn } from "@/lib/utils";

const CYCLE = "L40,30 L50,20 L60,30 L80,30 L90,4 L100,56 L112,14 L124,30 L146,30 L158,18 L172,18 L184,30";

function buildPath(cycles: number): string {
  let d = "M0,30";
  for (let i = 0; i < cycles; i++) {
    const offset = i * 200;
    d += " " + CYCLE.replaceAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Number(x) + offset},${y}`);
  }
  return d;
}

/**
 * The page's signature motif: a live vitals trace, the same kind of readout
 * our own hero product (a patient monitor) displays. Used both as the hero's
 * defining graphic and, at a thin scale, as section dividers in place of a
 * plain <hr> — one idea carried through the page rather than a one-off
 * decoration. Draw-on-scan animation lives in globals.css and is gated to
 * `prefers-reduced-motion: no-preference`, so this component needs no client JS.
 */
export function VitalsWaveform({
  cycles = 4,
  className,
  strokeWidth = 2,
}: {
  cycles?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const width = cycles * 200;
  return (
    <svg
      viewBox={`0 0 ${width} 60`}
      preserveAspectRatio="none"
      className={cn("vitals-trace w-full", className)}
      aria-hidden
    >
      <path
        d={buildPath(cycles)}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1600}
        strokeDasharray={1600}
      />
    </svg>
  );
}
