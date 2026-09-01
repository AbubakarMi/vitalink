"use client";

import { useState, useTransition } from "react";
import { Trash2, Type, Hash, FileText as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingField, OnboardingFieldType } from "@/lib/api/admin/onboarding-fields";
import { updateOnboardingFieldAction, deleteOnboardingFieldAction } from "@/app/admin/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

const TYPE_META: Record<OnboardingFieldType, { label: string; icon: typeof Type }> = {
  text: { label: "Text", icon: Type },
  number: { label: "Number", icon: Hash },
  document: { label: "Document", icon: FileIcon },
};

/**
 * Lets Staff define what the vendor onboarding wizard's "Compliance &
 * Verification" step (app/(auth)/vendor-apply/vendor-apply-wizard.tsx) asks
 * for — text fields, number fields, or document uploads — each with its own
 * required/optional flag and a description the vendor sees. Started as a
 * fixed set of 3 hardcoded documents; admin can now add/remove custom
 * fields of any type too, not just toggle the built-in ones. The "add a
 * field" flow lives in add-onboarding-field-modal.tsx, rendered by the page
 * itself at the top-right of the header — not in here (same split as
 * product-categories-settings.tsx / add-category-modal.tsx).
 */
export function OnboardingFieldsSettings({ fields }: { fields: OnboardingField[] }) {
  const manufacturer = fields.filter((f) => f.appliesTo === "Manufacturer" || f.appliesTo === "Both");
  const distributor = fields.filter((f) => f.appliesTo === "Distributor" || f.appliesTo === "Both");

  if (fields.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-text-muted">
        No onboarding fields yet. Use &ldquo;Add field&rdquo; above to create the first one.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup title="Manufacturer onboarding" fields={manufacturer} />
      <FieldGroup title="Distributor/Supplier onboarding" fields={distributor} />
    </div>
  );
}

function FieldGroup({ title, fields }: { title: string; fields: OnboardingField[] }) {
  if (fields.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">{title}</p>
      <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
        {fields.map((field) => (
          <FieldRow key={field.key} field={field} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: OnboardingField }) {
  const [enabled, setEnabled] = useState(field.enabled);
  const [required, setRequired] = useState(field.required);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(patch: { required?: boolean; enabled?: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await updateOnboardingFieldAction(field.key, patch);
      if (result.error) {
        setError(result.error);
        if (patch.enabled !== undefined) setEnabled(field.enabled);
        if (patch.required !== undefined) setRequired(field.required);
      }
    });
  }

  function handleDelete() {
    setError(null);
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await deleteOnboardingFieldAction(field.key);
        if (result.error) {
          setError(result.error);
          resolve();
          return;
        }
        setDeleted(true);
        resolve();
      });
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

  if (deleted) return null;

  const TypeIcon = TYPE_META[field.type].icon;

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-ink-soft">
            <TypeIcon className="size-3" aria-hidden />
            {TYPE_META[field.type].label}
          </span>
          <p className="text-sm font-semibold text-ink">{field.label}</p>
        </div>
        <p className="mt-1 text-sm text-text-muted">{field.description}</p>
        {error && <p className="mt-1 text-xs text-[#c0392b]">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-6">
        <ToggleField label="Enabled" checked={enabled} disabled={pending} onChange={toggleEnabled} />
        <ToggleField label="Required" checked={required} disabled={pending || !enabled} onChange={toggleRequired} />
        <ConfirmActionButton
          onConfirm={handleDelete}
          title={`Remove "${field.label}"?`}
          description="Vendors won't be asked for this during onboarding anymore. This can't be undone — you'll need to re-add it from scratch."
          confirmLabel="Yes, remove it"
          trigger={
            <button
              type="button"
              disabled={pending}
              aria-label={`Remove ${field.label}`}
              className="text-text-muted transition-colors hover:text-[#c0392b] disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          }
        />
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

