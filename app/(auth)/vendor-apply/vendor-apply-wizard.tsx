"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Landmark, CheckCheck, ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingShell } from "@/components/vendor-onboarding/onboarding-shell";
import { PhoneNumberField } from "@/components/ui/phone-input-field";
import { StateSearchField } from "@/components/ui/state-search-field";
import { NIGERIAN_BANKS } from "@/lib/vendor-onboarding/banks";
import type { VendorProfile, DocumentType } from "@/lib/api/vendor-profile";
import type { OnboardingField } from "@/lib/api/admin/onboarding-fields";
import { DocumentUploadField } from "./document-upload-field";
import { VendorIdentityForm } from "./vendor-identity-form";
import { saveBusinessProfileAction, savePayoutAction } from "./actions";

type WizardStep = "identity" | "business" | "compliance" | "payout" | "success";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IsoCertification: "ISO 13485",
  BusinessRegistration: "Business Registration",
  FdaRegistration: "FDA",
  NafdacRegistration: "NAFDAC",
  Other: "Other",
};

const SECURITY_CARD = (
  <div className="mt-8 rounded-2xl bg-ink p-6 text-white">
    <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-signal">
      <ShieldCheck className="size-5" aria-hidden />
    </span>
    <p className="mt-3 font-semibold">Security &amp; Integrity</p>
    <p className="mt-2 text-sm text-white/70">
      Clinical-grade commerce demands uncompromising adherence to global safety protocols. The documentation
      requested here forms the foundation of trust across the Vitalink network.
    </p>
    <ul className="mt-4 space-y-2 text-sm text-white/80">
      <li className="flex items-center gap-2">
        <CheckCheck className="size-4 text-signal" aria-hidden /> End-to-End Encryption
      </li>
      <li className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-signal" aria-hidden /> Strict Access Control
      </li>
      <li className="flex items-center gap-2">
        <CheckCheck className="size-4 text-signal" aria-hidden /> Immutable Audit Trail
      </li>
    </ul>
  </div>
);

function PreviousButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-auto flex items-center gap-1.5 rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      <ChevronLeft className="size-4" aria-hidden />
      Previous
    </button>
  );
}

/**
 * The full 4-step vendor onboarding wizard — Figma EZER-KEY nodes 1250:31
 * (Identity & MFA), 1523:1905 (Business Profile), 1523:2785/1523:3303
 * (Compliance & Verification, which shows two variants depending on the
 * Manufacturer vs Distributor/Supplier choice from Business Profile),
 * 1250:203 (Payout Logistics), 1250:274 (success).
 *
 * Used from two entry points that share this one component so the whole
 * thing reads (and behaves) as a single continuous flow, per the design:
 * - /register/vendor: fresh signup, no session yet — starts at "identity".
 *   identityAction (actions.ts) registers the account and logs it in, so
 *   steps 2-4 immediately after have a session to call createVendorProfile/
 *   beginDocumentUpload/addSettlementAccount with, no separate login step.
 * - /vendor-apply: an already-registered Vendor (page.tsx's
 *   requireAccountType guard) resuming or editing onboarding — starts at
 *   "business", or "compliance" if a profile was already saved.
 *
 * The compliance step's fields are data-driven from onboardingFields (an
 * admin-configurable list — see app/admin/settings/page.tsx) rather than a
 * fixed set, so Staff can add/remove a field, turn one off, flip it between
 * required and optional, or change its description without a code change.
 */
export function VendorApplyWizard({
  initialProfile,
  initialStep,
  onboardingFields,
}: {
  initialProfile: VendorProfile | null;
  initialStep?: WizardStep;
  onboardingFields: OnboardingField[];
}) {
  const [step, setStep] = useState<WizardStep>(initialStep ?? (initialProfile ? "compliance" : "business"));
  const [vendorType, setVendorType] = useState<"Manufacturer" | "Distributor">(
    (initialProfile?.vendorType as "Manufacturer" | "Distributor") ?? "Manufacturer",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Whether this session started at "identity" (a fresh /register/vendor
  // signup) rather than "business" (/vendor-apply, an already-registered
  // vendor) — only in the former case is there anywhere safe for the
  // business step's Previous button to go back to; identityAction already
  // handles a resubmit of the same email gracefully (see its comment).
  const startedAtIdentity = initialStep === "identity";

  // Keyed by field.key rather than by DocumentType, since one document
  // field (e.g. "Eligibility Status") can offer a choice of several
  // DocumentType values through a radio group.
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [eligibilityChoice, setEligibilityChoice] = useState<Record<string, DocumentType>>({});
  // Text/number field values, also keyed by field.key.
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const completedStepKeys =
    step === "success"
      ? ["identity", "business", "compliance", "payout"]
      : step === "payout"
        ? ["identity", "business", "compliance"]
        : step === "compliance"
          ? ["identity", "business"]
          : step === "business"
            ? ["identity"]
            : []; // step === "identity": nothing completed yet

  function handleBusinessSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveBusinessProfileAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("compliance");
    });
  }

  function handlePayoutSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await savePayoutAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("success");
    });
  }

  const activeFields = onboardingFields.filter(
    (f) => (f.appliesTo === vendorType || f.appliesTo === "Both") && f.enabled,
  );
  const complianceReady = activeFields
    .filter((f) => f.required)
    .every((f) => (f.type === "document" ? Boolean(uploadedDocs[f.key]) : Boolean(fieldValues[f.key]?.trim())));

  return (
    <OnboardingShell
      activeStepKey={step === "success" ? "payout" : step}
      completedStepKeys={completedStepKeys}
      sidebarExtra={step === "compliance" ? SECURITY_CARD : undefined}
    >
      {step === "identity" && <VendorIdentityForm onSuccess={() => setStep("business")} />}

      {step === "business" && (
        <form action={handleBusinessSubmit} className="space-y-6">
          <div>
            <span className="flex size-[52px] items-center justify-center rounded-xl bg-ink text-white">
              <Building2 className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-ink">Vendor Application</h2>
            <p className="mt-2 max-w-lg text-sm text-text-muted">
              Please provide your primary business details to begin the onboarding process.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-soft">Entity Information</p>
            <div className="mt-2 flex gap-2">
              {(["Manufacturer", "Distributor"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVendorType(type)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    vendorType === type ? "border-ink bg-mint text-ink" : "border-line bg-white text-text-muted",
                  )}
                >
                  {type === "Manufacturer" ? "Manufacturer" : "Distributor/Supplier"}
                </button>
              ))}
            </div>
            <input type="hidden" name="vendorType" value={vendorType} />
          </div>

          <div>
            <label htmlFor="businessLegalName" className="text-sm font-medium text-ink-soft">
              Legal Entity Name
            </label>
            <input
              id="businessLegalName"
              name="businessLegalName"
              required
              defaultValue={initialProfile?.businessLegalName}
              placeholder="e.g. Celsius Sci-Tech Limited"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            />
          </div>

          <div>
            <label htmlFor="taxId" className="text-sm font-medium text-ink-soft">
              TAX ID
            </label>
            <input
              id="taxId"
              name="taxId"
              defaultValue={initialProfile?.taxId ?? undefined}
              placeholder="e.g. 20-1234567-0001"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            />
          </div>

          <div>
            <label htmlFor="addressLine" className="text-sm font-medium text-ink-soft">
              Headquarters Address
            </label>
            <input
              id="addressLine"
              name="addressLine"
              required
              defaultValue={initialProfile?.businessAddress.addressLine ?? undefined}
              placeholder="Street address"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                name="city"
                required
                defaultValue={initialProfile?.businessAddress.city ?? undefined}
                placeholder="City"
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40"
              />
              <StateSearchField
                name="state"
                required
                defaultValue={initialProfile?.businessAddress.state ?? undefined}
                placeholder="State/province"
              />
              <input
                name="postalCode"
                defaultValue={initialProfile?.businessAddress.postalCode ?? undefined}
                placeholder="Postal code"
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40"
              />
            </div>
          </div>

          <PhoneNumberField
            id="phone"
            name="phone"
            label="Phone Number"
            defaultValue={initialProfile?.businessPhone ?? undefined}
          />

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            {startedAtIdentity && <PreviousButton onClick={() => setStep("identity")} />}
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Continue to compliance"}
            </button>
          </div>
        </form>
      )}

      {step === "compliance" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-ink">Compliance &amp; Verification</h2>

          {activeFields.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-6 text-sm text-text-muted">
              Nothing is required for onboarding right now.
            </p>
          ) : (
            activeFields.map((field) => {
              const documentTypes = field.documentTypes ?? ["Other"];
              return (
                <div key={field.key} className="rounded-2xl border border-line p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-ink-soft">
                      <ShieldCheck className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        {field.label}
                        {field.required ? (
                          <span className="rounded-full bg-[#fff0ee] px-2 py-0.5 text-[10px] font-medium text-[#c0392b]">
                            Required
                          </span>
                        ) : (
                          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                            Optional
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">{field.description}</p>
                    </div>
                  </div>

                  {field.type === "document" ? (
                    <>
                      {documentTypes.length > 1 && (
                        <div className="mt-4 flex flex-wrap gap-4">
                          {documentTypes.map((docType) => (
                            <label key={docType} className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                              <input
                                type="radio"
                                name={`eligibility-${field.key}`}
                                checked={(eligibilityChoice[field.key] ?? documentTypes[0]) === docType}
                                onChange={() => setEligibilityChoice((prev) => ({ ...prev, [field.key]: docType }))}
                                className="size-4 accent-[#062c24]"
                              />
                              {DOCUMENT_TYPE_LABELS[docType]}
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="mt-4">
                        <DocumentUploadField
                          documentType={eligibilityChoice[field.key] ?? documentTypes[0]}
                          documentName={field.label}
                          hint="PDF, JPG, or PNG (Max 10MB)"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onUploaded={(documentId) => setUploadedDocs((prev) => ({ ...prev, [field.key]: documentId }))}
                        />
                      </div>
                    </>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={fieldValues[field.key] ?? ""}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.type === "number" ? "0" : `Enter ${field.label.toLowerCase()}`}
                      className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
                    />
                  )}
                </div>
              );
            })
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <PreviousButton onClick={() => setStep("business")} />
            <button
              type="button"
              onClick={() => setStep("payout")}
              className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:border-ink"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!complianceReady}
              onClick={() => setStep("payout")}
              className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-40"
            >
              Continue to payout
            </button>
          </div>
        </div>
      )}

      {step === "payout" && (
        <form action={handlePayoutSubmit} className="space-y-6">
          <div>
            <span className="flex size-[52px] items-center justify-center rounded-xl bg-ink text-white">
              <Landmark className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-ink">Payout Logistics</h2>
            <p className="mt-2 max-w-lg text-sm text-text-muted">
              Please provide your legal and a secure account details. This information ensures timely settlement.
            </p>
          </div>

          <BankSelect />

          <div>
            <label htmlFor="accountNumber" className="text-sm font-medium text-ink-soft">
              Bank Account Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              required
              inputMode="numeric"
              placeholder="10-digit NUBAN account number"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            />
          </div>

          <div>
            <label htmlFor="accountName" className="text-sm font-medium text-ink-soft">
              Account Holder Name
            </label>
            <input
              id="accountName"
              name="accountName"
              required
              placeholder="As it appears on your bank statement"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <PreviousButton onClick={() => setStep("compliance")} />
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {pending ? "Completing…" : "Complete Vendor Onboarding"}
            </button>
          </div>
          <p className="text-center text-xs text-text-muted">
            By continuing you agree to Vitalink&apos;s{" "}
            <Link href="#" className="text-verified hover:text-ink">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-verified hover:text-ink">
              Privacy Policy
            </Link>
          </p>
        </form>
      )}

      {step === "success" && (
        <div className="space-y-4 py-10 text-center">
          <span className="relative mx-auto flex size-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-ink/40" aria-hidden />
            <span className="relative flex size-14 items-center justify-center rounded-2xl bg-ink text-white">
              <CheckCheck className="size-7" aria-hidden />
            </span>
          </span>
          <h2 className="font-[family-name:var(--font-newsreader)] text-3xl text-ink">Application Sent!</h2>
          <p className="mx-auto max-w-sm text-sm text-text-muted">
            Thank you for onboarding with us. Your application is currently under review. We&apos;ll get back to you
            with an update shortly.
          </p>
          <Link
            href="/vendor/dashboard"
            className="mx-auto mt-4 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-ink/85"
          >
            Go to dashboard
          </Link>
        </div>
      )}
    </OnboardingShell>
  );
}

function BankSelect() {
  return (
    <div>
      <label htmlFor="bankSelect" className="text-sm font-medium text-ink-soft">
        Corporate Bank Name
      </label>
      <div className="relative mt-1.5">
        <select
          id="bankSelect"
          required
          defaultValue=""
          className="w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
          onChange={(e) => {
            const form = e.currentTarget.form;
            if (!form) return;
            const selected = NIGERIAN_BANKS.find((b) => b.name === e.currentTarget.value);
            (form.elements.namedItem("bankName") as HTMLInputElement).value = selected?.name ?? "";
            (form.elements.namedItem("bankCode") as HTMLInputElement).value = selected?.code ?? "";
          }}
        >
          <option value="" disabled>
            Select your bank
          </option>
          {NIGERIAN_BANKS.map((bank) => (
            <option key={bank.code} value={bank.name}>
              {bank.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
      </div>
      <input type="hidden" name="bankName" />
      <input type="hidden" name="bankCode" />
    </div>
  );
}
