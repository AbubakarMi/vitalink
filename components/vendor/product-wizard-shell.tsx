import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

/**
 * Chrome for the New Product wizard — deliberately mirrors
 * components/vendor-onboarding/onboarding-shell.tsx's numbered-circle step
 * indicator so the app has one wizard visual language, not two (design doc
 * §5). A parallel component rather than a shared import: onboarding-shell.tsx
 * belongs to the pre-auth registration flow (used from /register/vendor
 * before a session exists) while this is a signed-in, vendor-role-scoped
 * component under app/vendor/ — reaching across that boundary for a "looks
 * reusable" shell is exactly what the "components never cross role
 * boundaries" rule (frontend architecture doc §2.3) warns against.
 */

export interface WizardStepInfo {
  key: string;
  number: number;
  label: string;
}

export function ProductWizardShell({
  title,
  subtitle,
  steps,
  activeStepKey,
  completedStepKeys,
  children,
}: {
  title: string;
  subtitle: string;
  steps: WizardStepInfo[];
  activeStepKey: string;
  completedStepKeys: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
      </div>

      <VitalsWaveform cycles={8} strokeWidth={1} ghostOpacity={0.2} className="mx-auto mt-6 h-4 max-w-md text-line" />

      <p className="mt-6 text-center text-xs font-medium tracking-wide text-text-muted uppercase sm:hidden">
        Step {steps.findIndex((s) => s.key === activeStepKey) + 1} of {steps.length} —{" "}
        {steps.find((s) => s.key === activeStepKey)?.label}
      </p>

      <ol className="mx-auto mt-4 flex max-w-3xl items-center px-1 sm:mt-8 sm:px-0">
        {steps.map((step, i) => {
          const isDone = completedStepKeys.includes(step.key);
          const isActive = step.key === activeStepKey;
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 sm:size-9 sm:text-sm",
                    isDone
                      ? "bg-verified text-white"
                      : isActive
                        ? "bg-ink text-white shadow-[0_0_0_4px_rgba(0,39,8,0.1)]"
                        : "border border-line bg-white text-text-muted",
                  )}
                >
                  {isDone ? <Check className="size-3.5 sm:size-4" aria-hidden /> : step.number}
                </span>
                <span className={cn("hidden text-xs font-medium whitespace-nowrap sm:block", isActive ? "text-ink" : "text-text-muted")}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={cn("mx-1.5 h-px flex-1 transition-colors duration-500 sm:mx-2", isDone ? "bg-verified" : "bg-line")}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_rgba(0,39,8,0.06)] sm:mt-8 sm:p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}
