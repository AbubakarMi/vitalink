/**
 * Small, hand-built chart primitives for the admin dashboard/analytics — no
 * charting library exists in this project, so these follow the same
 * DIY-SVG/CSS convention as components/marketing/vitals-waveform.tsx and
 * components/vendor/analytics-charts.tsx, rather than adding a dependency.
 * Own copy (not imported from components/vendor/), per the "components
 * never cross role boundaries" rule.
 */

const PLOT_HEIGHT = 160;

export function BarChart({
  data,
  formatValue = (n) => n.toLocaleString("en-NG"),
  barColor = "#006b5f",
}: {
  data: { label: string; value: number }[];
  formatValue?: (n: number) => string;
  barColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-stretch gap-3" style={{ height: PLOT_HEIGHT }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[11px] font-medium text-ink">{d.value > 0 ? formatValue(d.value) : ""}</span>
            <div
              className="w-full max-w-9 rounded-t-md transition-opacity hover:opacity-80"
              style={{ height: Math.max(2, (d.value / max) * (PLOT_HEIGHT - 28)), backgroundColor: barColor }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line pt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] whitespace-nowrap text-text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarList({
  data,
  formatValue = (n) => `N${n.toLocaleString("en-NG")}`,
  barColor = "#006b5f",
}: {
  data: { label: string; value: number }[];
  formatValue?: (n: number) => string;
  barColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No data yet.</p>;
  }
  return (
    <div className="space-y-4">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{d.label}</span>
            <span className="shrink-0 text-text-muted">{formatValue(d.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-mint/60">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, backgroundColor: barColor }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DONUT_PALETTE = ["#f4b740", "#e6584f", "#4a9d5c", "#5c8aff", "#8b5cf6", "#0a8f8a"];

/** Stroke-dasharray ring segments on a single SVG circle — the standard
 * dependency-free donut-chart technique. */
export function DonutChart({
  data,
  total,
  formatValue = (n) => `N${n.toLocaleString("en-NG")}`,
  centerLabel = "Total",
}: {
  data: { label: string; value: number }[];
  total?: number;
  formatValue?: (n: number) => string;
  centerLabel?: string;
}) {
  const sum = total ?? data.reduce((acc, d) => acc + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 160 160" className="size-40 shrink-0 -rotate-90">
        <circle cx={80} cy={80} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={22} />
        {sum > 0 &&
          data.map((d, i) => {
            const fraction = d.value / sum;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={d.label}
                cx={80}
                cy={80}
                r={radius}
                fill="none"
                stroke={DONUT_PALETTE[i % DONUT_PALETTE.length]}
                strokeWidth={22}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2.5">
        {sum === 0 ? (
          <p className="text-sm text-text-muted">No data yet.</p>
        ) : (
          data.map((d, i) => (
            <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_PALETTE[i % DONUT_PALETTE.length] }} aria-hidden />
                <span className="truncate text-ink-soft">{d.label}</span>
              </span>
              <span className="shrink-0 font-medium text-ink">{formatValue(d.value)}</span>
            </div>
          ))
        )}
        {sum > 0 && (
          <div className="mt-2 border-t border-line pt-2 text-sm">
            <span className="text-text-muted">{centerLabel}: </span>
            <span className="font-semibold text-ink">{formatValue(sum)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
