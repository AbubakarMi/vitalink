"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createCategoryAction } from "@/app/admin/actions";

/**
 * "Add category" as a popup modal, triggered from the top-right of the
 * Product Categories page — same open/close shape as invite-staff-modal.tsx.
 * Replaces the old inline expanding form that used to live at the bottom of
 * product-categories-settings.tsx.
 */
export function AddCategoryModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({ name, description });
      if (result.error) {
        setError(result.error);
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
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
        Add category
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">New product category</h2>
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
              <div>
                <label htmlFor="category-name" className="text-xs font-medium text-ink-soft">
                  Name
                </label>
                <input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Surgical Instruments"
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                />
              </div>
              <div>
                <label htmlFor="category-description" className="text-xs font-medium text-ink-soft">
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of products belong here?"
                  rows={3}
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
                />
              </div>
              {error && <p className="text-sm text-[#c0392b]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {pending ? "Adding…" : "Add category"}
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
