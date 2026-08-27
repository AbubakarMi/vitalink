"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { createStaffAction } from "@/app/admin/actions";

export interface RoleOption {
  id: string;
  name: string;
}

export interface ExistingStaffSummary {
  id: string;
  name: string;
  role: string[];
}

/**
 * "Create roles" modal (super admin/Roles.pdf) — invite a new staff member
 * by email and assign existing roles (lib/api/admin/staff.ts's real
 * CreateStaffInput: name/email/phone/roleIds). The mockup's "Add Roles"
 * button creates a brand-new role type (e.g. "Sales Rep") — no backend
 * command exists for that yet (Administration/Roles only has Queries, no
 * Commands, per the backend source tree), so this only offers the roles
 * that already exist rather than faking role creation. The mockup's
 * per-user "Can Edit / View only" permission table doesn't map to any real
 * per-permission-assignment endpoint either — "Who has access" here is a
 * read-only list of current staff and their assigned roles instead.
 */
export function InviteStaffModal({
  roles,
  existingStaff,
  trigger,
}: {
  roles: RoleOption[];
  existingStaff: ExistingStaffSummary[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Create roles</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <InviteForm roles={roles} onSent={() => setOpen(false)} />

            {existingStaff.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Who has access</p>
                <div className="mt-3 space-y-2">
                  {existingStaff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                      <span className="text-sm font-medium text-ink">{member.name}</span>
                      <span className="text-xs text-text-muted">{member.role.join(", ") || "No role assigned"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-lg border border-line py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function InviteForm({ roles, onSent }: { roles: RoleOption[]; onSent: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createStaffAction({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      roleIds,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setName("");
    setEmail("");
    setPhone("");
    setRoleIds([]);
    setTimeout(onSent, 900);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="invite-name" className="text-xs font-medium text-text-muted">
            Name
          </label>
          <input
            id="invite-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
          />
        </div>
        <div>
          <label htmlFor="invite-phone" className="text-xs font-medium text-text-muted">
            Phone (optional)
          </label>
          <input
            id="invite-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234…"
            className="mt-1 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
          />
        </div>
      </div>

      <div>
        <label htmlFor="invite-email" className="text-xs font-medium text-text-muted">
          Email address
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="please enter the email address"
            className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-verified"
          />
          <button
            type="submit"
            disabled={pending || roleIds.length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <UserPlus className="size-4" aria-hidden />
            {pending ? "Inviting…" : "Invite"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-text-muted">Assign role{roleIds.length !== 1 ? "s" : ""}</p>
        {roles.length === 0 ? (
          <p className="mt-1.5 text-sm text-text-muted">No roles set up yet.</p>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {roles.map((role) => {
              const active = roleIds.includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={
                    active
                      ? "rounded-full bg-mint px-3.5 py-1.5 text-xs font-medium text-verified"
                      : "rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:border-verified/40"
                  }
                >
                  {role.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#c0392b]">{error}</p>}
      {success && <p className="text-sm text-verified">Invite sent.</p>}
    </form>
  );
}
