import { cn } from "@/lib/utils";

/**
 * The signature device for order status across the customer experience —
 * status as a pulse trace, not a generic numbered stepper. Extends the
 * site's own vitals-waveform motif (components/marketing/vitals-waveform.tsx)
 * with real information: a heartbeat blip marks each completed stage, a
 * flat dim line marks what hasn't happened yet, and the current stage's dot
 * pulses live — the same "monitor reading" language the landing hero and
 * onboarding wizard already use, here doing double duty as the actual
 * status indicator rather than decoration next to one.
 */

const BLIP = "M0,12 L7,12 L10,3 L14,21 L18,12 L40,12";
const FLAT = "M0,12 L40,12";

export function VitalsStatusTrace({ stages, currentIndex }: { stages: string[]; currentIndex: number }) {
  return (
    <div className="flex items-center">
      {stages.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === stages.length - 1;
        return (
          <div key={stage} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span className="relative flex size-2.5 items-center justify-center">
                {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-verified/50" aria-hidden />}
                <span className={cn("relative size-2.5 rounded-full", isDone || isCurrent ? "bg-verified" : "bg-line")} />
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tracking-wide whitespace-nowrap uppercase",
                  isDone || isCurrent ? "text-ink" : "text-text-muted",
                )}
              >
                {stage}
              </span>
            </div>
            {!isLast && (
              <svg
                viewBox="0 0 40 24"
                preserveAspectRatio="none"
                className={cn("mx-1 h-4 flex-1", isDone ? "text-verified" : "text-line")}
                aria-hidden
              >
                <path d={isDone ? BLIP : FLAT} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Cancelled doesn't fit the linear trace — a dead flatline reads more
 * honestly than showing partial "progress" toward a status that will never
 * be reached. */
export function VitalsCancelledTrace() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 160 24" preserveAspectRatio="none" className="h-4 flex-1 text-[#c0392b]" aria-hidden>
        <path d="M0,12 L160,12" fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="2 4" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-[10px] tracking-wide text-[#c0392b] uppercase">Cancelled</span>
    </div>
  );
}
