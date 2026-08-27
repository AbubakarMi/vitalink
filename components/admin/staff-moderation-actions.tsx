"use client";

import { useState, useTransition } from "react";
import { approveStaffAction, suspendStaffAction } from "@/app/admin/actions";

/** Approve/Suspend controls for one row on /admin/users — new invites need
 * explicit review before they're active (see lib/api/mocks/admin-store.ts's
 * approvalStatus comment). */
export function StaffModerationActions({
  staffId,
  pendingReview,
  isActive,
}: {
  staffId: string;
  pendingReview: boolean;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveStaffAction(staffId);
      if (result.error) setError(result.error);
    });
  }

  function suspend() {
    setError(null);
    startTransition(async () => {
      const result = await suspendStaffAction(staffId);
      if (result.error) setError(result.error);
    });
  }

  if (pendingReview) {
    return (
      <div>
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="rounded-lg bg-verified px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-verified-hover disabled:opacity-50"
        >
          {pending ? "Approving…" : "Approve"}
        </button>
        {error && <p className="mt-1 text-xs text-[#c0392b]">{error}</p>}
      </div>
    );
  }

  if (!isActive) {
    return <span className="text-xs text-text-muted">Suspended</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={suspend}
        disabled={pending}
        className="text-xs font-medium text-[#c0392b] hover:underline disabled:opacity-50"
      >
        {pending ? "Suspending…" : "Suspend"}
      </button>
      {error && <p className="mt-1 text-xs text-[#c0392b]">{error}</p>}
    </div>
  );
}
