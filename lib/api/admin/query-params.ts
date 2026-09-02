import "server-only";

/**
 * Every admin list endpoint's real query-string contract (confirmed live,
 * not guessed — see docs/BACKEND_TODO.md): `Application.Abstractions.
 * QueryParams.QueryStringParams` names the paging/search params
 * `PageNumber`/`PageSize`/`Term`, not this app's own `page`/`pageSize`/
 * `search` convention.
 *
 * `PageNumber`/`PageSize` are non-nullable `int` properties with C# default
 * values (1/10) — but ASP.NET's `[AsParameters]` binding still treats them
 * as *required* query params at runtime (confirmed live: omitting either
 * 400s "Required parameter... was not provided from query string"), so
 * this always sends both explicitly rather than relying on those defaults.
 * `OrderBy` (a `string`, same story) is each caller's own responsibility to
 * add alongside this, since not every endpoint has that field (see audit.ts).
 *
 * This only translates the shared paging shape — status/filter field names
 * (e.g. vendors' `VerificationStatus`, products' `ApprovalStatus`) differ
 * per endpoint and stay each adapter's own responsibility to add alongside
 * this.
 */
export function toBackendListParams(input: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Record<string, string | number> {
  const params: Record<string, string | number> = {
    PageNumber: input.page ?? 1,
    PageSize: input.pageSize ?? 10,
  };
  if (input.search) params.Term = input.search;
  return params;
}
