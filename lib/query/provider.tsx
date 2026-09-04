"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide React Query provider — first real use is the register form's
 * live-as-you-type email-availability check (register-form.tsx), replacing
 * a hand-rolled setTimeout/requestIdRef debounce+staleness-guard with
 * useQuery's own built-in request de-duplication/cancellation. The
 * QueryClient is created inside useState (not at module scope) per
 * TanStack's own Next.js App Router guidance — a module-scope client would
 * be shared across requests/users on the server.
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
