/**
 * Small, hand-built chart primitives for /vendor/analytics — no charting
 * library exists in this project (package.json has none), so these follow
 * the same DIY-SVG/CSS convention as components/marketing/vitals-waveform.tsx
 * rather than adding a new dependency. Single-hue/status-color marks only
 * (no multi-series categorical palette here), so no CVD-separation palette
 * validation is needed — see the dataviz skill's color-formula guidance.
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
  formatValue = (n) => n.toLocaleString("en-NG"),
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

export function StatusBreakdown({
  segments,
}: {
  segments: { label: string; count: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const visible = segments.filter((s) => s.count > 0);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-mint/60">
        {visible.map((s) => (
          <div
            key={s.label}
            className="h-full border-r-2 border-cream last:border-r-0"
            style={{ width: `${(s.count / Math.max(1, total)) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-ink">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            {s.label} <span className="text-text-muted">({s.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
