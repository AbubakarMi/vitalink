"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value`, but only after it's stayed still for `delayMs` — the
 * standard pairing for a live-as-you-type check backed by useQuery
 * (register-form.tsx's email-availability check): debounce the raw input
 * here, then key the query off the debounced value so React Query's own
 * request de-duplication/cancellation does the rest, instead of hand-rolling
 * a requestId/staleness guard around a Server Action call.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
