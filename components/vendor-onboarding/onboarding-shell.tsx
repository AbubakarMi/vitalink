"use client";

import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

export interface OnboardingStepInfo {
  key: string;
  number: number;
  label: string;
  description: string;
}

export const VENDOR_ONBOARDING_STEPS: OnboardingStepInfo[] = [
  { key: "identity", number: 1, label: "Identity", description: "Legal name and account setup" },
  { key: "business", number: 2, label: "Business Profile", description: "Tax IDs and entity verification" },
  { key: "compliance", number: 3, label: "Compliance & Verification", description: "Documentation and certification" },
  { key: "payout", number: 4, label: "Payout Logistics", description: "Banking and settlement preferences" },
];

/**
 * Shared chrome for the vendor onboarding wizard. Content/step structure is
 * grounded in Figma EZER-KEY nodes 1250:31 / 1523:1905 / 1523:2785 /
 * 1523:3303 / 1250:203 / 1250:274 — what each step needs to collect — but
 * the visual execution is a deliberate step up from that plain mockup,
 * carrying the site's own instrument-panel signature (vitals trace, mono
 * step counter) rather than reproducing a generic dashboard-wizard look.
 *
 * One continuous client wizard (VendorApplyWizard) reused from two entry
 * points: /register/vendor for a fresh signup (starts at "identity", which
 * registers the account and logs it in before continuing) and /vendor-apply
 * for an already-registered Vendor resuming or editing onboarding (starts at
 * "business"/"compliance" depending on what's already saved). Both render
 * this same shell so the sidebar reads as one continuous flow either way.
 */
export function OnboardingShell({
  activeStepKey,
  completedStepKeys,
  sidebarExtra,
  children,
}: {
  activeStepKey: string;
  completedStepKeys: string[];
  sidebarExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeIndex = VENDOR_ONBOARDING_STEPS.findIndex((s) => s.key === activeStepKey);
  const activeStep = VENDOR_ONBOARDING_STEPS[activeIndex];

  return (
    <div className="min-h-dvh bg-cream">
      <div className="h-[3px] bg-signal" />

      <header className="flex items-center justify-between border-b border-line px-10 py-4">
        <Link href="/" className="font-alata text-2xl tracking-tight text-ink">
          VITALINK
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-mint hover:text-ink"
          >
            <RotateCcw className="size-4" aria-hidden />
            Restart
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-[#fff0ee] hover:text-[#c0392b]"
          >
            <X className="size-4" aria-hidden />
            Close
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">
          Step {activeIndex + 1} of {VENDOR_ONBOARDING_STEPS.length}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-newsreader)] text-3xl leading-[1.1] tracking-[-0.02em] text-ink">
          Vendor Onboarding
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Complete your profile to start selling{activeStep ? ` — currently on ${activeStep.label}` : ""}
        </p>

        <VitalsWaveform cycles={8} strokeWidth={1} ghostOpacity={0.2} className="mt-6 h-4 text-line" />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <ol className="space-y-0">
              {VENDOR_ONBOARDING_STEPS.map((step, i) => {
                const isDone = completedStepKeys.includes(step.key);
                const isActive = step.key === activeStepKey;
                const isLast = i === VENDOR_ONBOARDING_STEPS.length - 1;
                return (
                  <li key={step.key} className="relative flex gap-4 pb-8">
                    {!isLast && (
                      <span
                        className={cn(
                          "absolute top-[46px] left-[21px] h-[calc(100%-38px)] w-px transition-colors duration-500",
                          isDone ? "bg-verified" : "bg-line",
                        )}
                        aria-hidden
                      />
                    )}
                    <span className="relative flex size-[44px] shrink-0 items-center justify-center">
                      {isActive && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-ink/40" aria-hidden />
                      )}
                      <span
                        className={cn(
                          "relative flex size-[44px] items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                          isDone
                            ? "bg-verified text-white"
                            : isActive
                              ? "bg-ink text-white shadow-[0_0_0_4px_rgba(0,39,8,0.1)]"
                              : "border border-line bg-white text-text-muted",
                        )}
                      >
                        {isDone ? <Check className="size-4.5" aria-hidden /> : step.number}
                      </span>
                    </span>
                    <div className="pt-2">
                      <p className={cn("text-sm font-semibold transition-colors", isActive ? "text-ink" : "text-text-muted")}>
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {sidebarExtra}
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_rgba(0,39,8,0.06)] sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
