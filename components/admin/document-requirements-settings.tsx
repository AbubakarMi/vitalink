"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { DocumentRequirement } from "@/lib/api/admin/document-requirements";
import { updateDocumentRequirementAction } from "@/app/admin/actions";

/**
 * Lets Staff configure which documents the vendor onboarding wizard's
 * "Compliance & Verification" step (app/(auth)/vendor-apply/
 * vendor-apply-wizard.tsx) asks for, and whether each is required or
 * optional — previously a fixed set hardcoded straight into that wizard.
 */
export function DocumentRequirementsSettings({ requirements }: { requirements: DocumentRequirement[] }) {
  const manufacturer = requirements.filter((r) => r.appliesTo === "Manufacturer");
  const distributor = requirements.filter((r) => r.appliesTo === "Distributor");

  return (
    <div className="space-y-6">
      <RequirementGroup title="Manufacturer onboarding" requirements={manufacturer} />
      <RequirementGroup title="Distributor/Supplier onboarding" requirements={distributor} />
    </div>
  );
}

function RequirementGroup({ title, requirements }: { title: string; requirements: DocumentRequirement[] }) {
  if (requirements.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">{title}</p>
      <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
        {requirements.map((requirement) => (
          <RequirementRow key={requirement.key} requirement={requirement} />
        ))}
      </div>
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: DocumentRequirement }) {
  const [enabled, setEnabled] = useState(requirement.enabled);
  const [required, setRequired] = useState(requirement.required);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(patch: { required?: boolean; enabled?: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await updateDocumentRequirementAction(requirement.key, patch);
      if (result.error) {
        setError(result.error);
        // Roll back the optimistic flip.
        if (patch.enabled !== undefined) setEnabled(requirement.enabled);
        if (patch.required !== undefined) setRequired(requirement.required);
      }
    });
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    apply({ enabled: next });
  }

  function toggleRequired() {
    const next = !required;
    setRequired(next);
    apply({ required: next });
  }

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{requirement.label}</p>
        <p className="mt-1 text-sm text-text-muted">{requirement.description}</p>
        {error && <p className="mt-1 text-xs text-[#c0392b]">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-6">
        <ToggleField label="Enabled" checked={enabled} disabled={pending} onChange={toggleEnabled} />
        <ToggleField label="Required" checked={required} disabled={pending || !enabled} onChange={toggleRequired} />
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className={cn("flex items-center gap-2.5", disabled ? "opacity-50" : "cursor-pointer")}>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-ink" : "bg-line",
          disabled && "cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}
