"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Square, ShieldCheck, ArrowLeft, Send, Check } from "lucide-react";
import { processBulkTransferAction } from "@/app/admin/actions";
import type { Settlement } from "@/lib/api/admin/settlements";

type Step = "select" | "review" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "1. Initiate" },
  { key: "review", label: "2. Review & Check" },
  { key: "done", label: "3. Disburse" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isDone ? "bg-verified text-white" : isCurrent ? "bg-brand-primary text-white" : "bg-line text-text-muted"
              }`}
            >
              {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? "text-ink" : "text-text-muted"}`}>
              {step.label.replace(/^\d+\.\s/, "")}
            </span>
            {i < STEPS.length - 1 && <span className={`mx-1 h-px flex-1 ${isDone ? "bg-verified" : "bg-line"}`} aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Bulk vendor payout — a standard three-step flow (select → review/confirm
 * → disburse) rather than a single click, since this moves real money: pick
 * vendors with a pending balance, check the itemized summary is correct,
 * then confirm to disburse. The backend has settlement-account read
 * endpoints but no bulk-transfer command yet, so this is mock-only
 * (lib/api/admin/settlements.ts).
 */
export function BulkSettlementTransfer({ settlements }: { settlements: Settlement[] }) {
  const payable = settlements.filter((s) => s.pendingAmount > 0);
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ transferred: number; total: number } | null>(null);

  function toggle(vendorId: string) {
    setSelected((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]));
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === payable.length ? [] : payable.map((s) => s.vendorId)));
  }

  function goToReview() {
    setError(null);
    setStep("review");
  }

  function confirmDisburse() {
    setError(null);
    startTransition(async () => {
      const outcome = await processBulkTransferAction(selected);
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      setResult({ transferred: outcome.transferred ?? 0, total: outcome.total ?? 0 });
      setStep("done");
      setSelected([]);
    });
  }

  const selectedSettlements = settlements.filter((s) => selected.includes(s.vendorId));
  const selectedTotal = selectedSettlements.reduce((sum, s) => sum + s.pendingAmount, 0);

  if (step === "done" && result) {
    return (
      <div className="space-y-4">
        <StepIndicator current="done" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-8 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-mint text-verified">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <p className="text-lg font-semibold text-ink">Transfer disbursed</p>
          <p className="max-w-sm text-sm text-text-muted">
            N{result.total.toLocaleString("en-NG")} sent to {result.transferred} vendor{result.transferred === 1 ? "" : "s"}. A record
            was added to the Transactions ledger.
          </p>
          <button
            type="button"
            onClick={() => setStep("select")}
            className="mt-2 rounded-lg border border-line px-5 py-2 text-sm font-medium text-ink-soft hover:bg-cream"
          >
            Start another transfer
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="space-y-4">
        <StepIndicator current="review" />
        <button type="button" onClick={() => setStep("select")} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Back to selection
        </button>

        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="text-sm font-semibold text-ink">Confirm before you disburse</p>
          <p className="mt-1 text-sm text-text-muted">
            Check that the vendor, bank, and amount for each payout below is correct — this can&apos;t be undone once sent.
          </p>

          <div className="mt-5 divide-y divide-line rounded-xl border border-line">
            {selectedSettlements.map((s) => (
              <div key={s.vendorId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{s.vendorName}</p>
                  <p className="text-xs text-text-muted">
                    {s.bankName} · {s.accountNumber}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-ink">N{s.pendingAmount.toLocaleString("en-NG")}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3">
            <span className="text-sm font-medium text-ink-soft">
              {selectedSettlements.length} vendor{selectedSettlements.length === 1 ? "" : "s"}
            </span>
            <span className="font-[family-name:var(--font-newsreader)] text-xl text-ink">N{selectedTotal.toLocaleString("en-NG")}</span>
          </div>

          {error && <p className="mt-3 text-sm text-[#c0392b]">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmDisburse}
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden />
              {pending ? "Disbursing…" : "Confirm & Disburse"}
            </button>
            <button
              type="button"
              onClick={() => setStep("select")}
              disabled={pending}
              className="rounded-lg border border-line px-6 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator current="select" />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4">
        <button type="button" onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
          {selected.length === payable.length && payable.length > 0 ? (
            <CheckSquare className="size-4 text-verified" aria-hidden />
          ) : (
            <Square className="size-4" aria-hidden />
          )}
          Select all with a pending balance
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">
            {selected.length} selected — <span className="font-medium text-ink">N{selectedTotal.toLocaleString("en-NG")}</span>
          </span>
          <button
            type="button"
            onClick={goToReview}
            disabled={selected.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
          >
            Initiate Transfer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream/60 text-xs font-medium tracking-wide text-text-muted uppercase">
            <tr>
              <th className="w-10 px-5 py-3" />
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Bank</th>
              <th className="px-5 py-3 font-medium">Account Number</th>
              <th className="px-5 py-3 font-medium">Pending Amount</th>
              <th className="px-5 py-3 font-medium">Last Payout</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-text-muted">
                  No verified vendors with settlement accounts yet.
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.vendorId} className="border-b border-line/70 last:border-b-0 hover:bg-cream/40">
                  <td className="px-5 py-4">
                    {s.pendingAmount > 0 ? (
                      <button type="button" onClick={() => toggle(s.vendorId)} aria-label={`Select ${s.vendorName}`}>
                        {selected.includes(s.vendorId) ? (
                          <CheckSquare className="size-4 text-verified" aria-hidden />
                        ) : (
                          <Square className="size-4 text-line" aria-hidden />
                        )}
                      </button>
                    ) : (
                      <Square className="size-4 text-line opacity-30" aria-hidden />
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-ink">{s.vendorName}</td>
                  <td className="px-5 py-4 align-middle text-text-muted">{s.bankName}</td>
                  <td className="px-5 py-4 align-middle text-text-muted">{s.accountNumber}</td>
                  <td className="px-5 py-4 align-middle text-ink">
                    {s.pendingAmount > 0 ? `N${s.pendingAmount.toLocaleString("en-NG")}` : <span className="text-text-muted">N0</span>}
                  </td>
                  <td className="px-5 py-4 align-middle text-text-muted">
                    {s.lastPayoutAt
                      ? new Date(s.lastPayoutAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
                      : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
