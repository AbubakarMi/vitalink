"use client";

import { useState, useTransition } from "react";
import { Plus, X, Type, Hash, FileText as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingFieldType } from "@/lib/api/admin/onboarding-fields";
import { createOnboardingFieldAction } from "@/app/admin/actions";

const TYPE_META: Record<OnboardingFieldType, { label: string; icon: typeof Type }> = {
  text: { label: "Text", icon: Type },
  number: { label: "Number", icon: Hash },
  document: { label: "Document", icon: FileIcon },
};

const EMPTY_FORM = { label: "", description: "", type: "text" as OnboardingFieldType, appliesTo: "Both" as const, required: true };

/**
 * "Add onboarding field" as a popup modal, triggered from the top-right of
 * the Onboarding Fields page — same shape as add-category-modal.tsx.
 * Replaces the old inline expanding form that used to live at the bottom of
 * onboarding-fields-settings.tsx.
 */
export function AddOnboardingFieldModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOnboardingFieldAction(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
      >
        <Plus className="size-4" aria-hidden />
        Add field
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">New onboarding field</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-label" className="text-xs font-medium text-ink-soft">
                    Label
                  </label>
                  <input
                    id="field-label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Import Permit"
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                  />
                </div>
                <div>
                  <label htmlFor="field-type" className="text-xs font-medium text-ink-soft">
                    Field type
                  </label>
                  <select
                    id="field-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as OnboardingFieldType })}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                  >
                    {Object.entries(TYPE_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="field-description" className="text-xs font-medium text-ink-soft">
                  Description shown to vendors
                </label>
                <textarea
                  id="field-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this for, and what should the vendor provide?"
                  rows={3}
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-applies-to" className="text-xs font-medium text-ink-soft">
                    Applies to
                  </label>
                  <select
                    id="field-applies-to"
                    value={form.appliesTo}
                    onChange={(e) => setForm({ ...form, appliesTo: e.target.value as typeof form.appliesTo })}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                  >
                    <option value="Both">Both Manufacturer &amp; Distributor</option>
                    <option value="Manufacturer">Manufacturer only</option>
                    <option value="Distributor">Distributor/Supplier only</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className={cn("flex items-center gap-2.5 cursor-pointer")}>
                    <span className="text-xs font-medium text-ink-soft">Required</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.required}
                      aria-label="Required"
                      onClick={() => setForm({ ...form, required: !form.required })}
                      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", form.required ? "bg-ink" : "bg-line")}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                          form.required && "translate-x-5",
                        )}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-[#c0392b]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {pending ? "Adding…" : "Add field"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
