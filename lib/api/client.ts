import "server-only";
import { readFileSync } from "node:fs";
import { cookies } from "next/headers";
import { Agent, fetch as undiciFetch } from "undici";

/**
 * Every call goes server-to-server, directly to the .NET backend, using an
 * absolute URL — Node's fetch doesn't support relative URLs, and there's no
 * same-origin requirement to satisfy here since the browser never talks to the
 * backend directly (design doc §3's cookie-topology correction). Server-side
 * fetch does not automatically forward the incoming request's cookies the way a
 * browser would, so it's done explicitly below.
 */
function backendOrigin(): string {
  const origin = process.env.BACKEND_ORIGIN;
  if (!origin) {
    throw new Error("BACKEND_ORIGIN is not set (e.g. http://localhost:5071 in dev).");
  }
  return origin;
}

/**
 * The backend mounts every endpoint under `api/v{apiVersion}`
 * (Program.cs: `app.MapGroup("api/v{apiVersion:apiVersion}")`, version 1
 * registered) — confirmed against source, not guessed. Every adapter's own
 * BASE constant (e.g. auth.ts's "/auth") omits this on purpose; it's added
 * once, here, so adapters don't each have to know about API versioning.
 * See docs/BACKEND_INTEGRATION_GUIDE.md §2.1.
 */
const API_VERSION_PREFIX = "/api/v1";

function versionedPath(path: string): string {
  return `${API_VERSION_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Trusts the local .NET backend's self-signed HTTPS dev cert for just this
 * fetch — NOT via NODE_EXTRA_CA_CERTS, which sounds right but actually
 * replaces (not adds to) Node's trusted-root bundle in this Next/undici
 * combination, breaking every *other* HTTPS call the process makes
 * (confirmed live: it broke next/font/google's own fetch, a 500 on every
 * page). A per-request undici Agent scopes trust to only the backend origin.
 * Only used when BACKEND_CA_CERT_PATH is set — normal deployments hit a
 * real backend with a real cert and need none of this. See
 * docs/BACKEND_INTEGRATION_GUIDE.md and .env.local's BACKEND_ORIGIN comment.
 */
let backendDispatcher: Agent | undefined;
function getBackendDispatcher(): Agent | undefined {
  const certPath = process.env.BACKEND_CA_CERT_PATH;
  if (!certPath) return undefined;
  if (!backendDispatcher) {
    backendDispatcher = new Agent({ connect: { ca: readFileSync(certPath, "utf8") } });
  }
  return backendDispatcher;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Skip forwarding the caller's cookies — only auth endpoints that don't yet have a session need this (register, initial login). */
  withCredentials?: boolean;
}

export interface BackendResponse<T> {
  data: T;
  /** Set-Cookie header values from the backend response, if any — auth endpoints
   * relay these onto the Next.js response themselves (lib/api/auth.ts). Every
   * other adapter ignores this. */
  setCookieHeaders: string[];
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<BackendResponse<T>> {
  const url = new URL(versionedPath(path), backendOrigin());
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.withCredentials !== false) {
    const cookieStore = await cookies();
    headers.Cookie = cookieStore.toString();
  }

  const dispatcher = getBackendDispatcher();
  // Node's own global fetch is backed by whatever undici version Node itself
  // bundled internally — passing a `dispatcher` from the standalone `undici`
  // npm package into it throws ("invalid onRequestStart method", an
  // internal-version mismatch), confirmed live. undici's own fetch export
  // and its own Agent are always the same version, so route through that
  // instead, but only when a custom dispatcher is actually needed —
  // everywhere else keeps using the platform's native fetch.
  const doFetch = dispatcher ? undiciFetch : fetch;
  const response = await doFetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    // Identity-bearing requests are never cached at the fetch layer. Caching, when
    // wanted for public/mocked data, happens explicitly via "use cache" in the
    // calling Server Component instead — see design doc §7.
    cache: "no-store",
    ...(dispatcher ? { dispatcher } : {}),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => undefined);
    throw new ApiError(
      response.status,
      `Backend request failed: ${method} ${path} (${response.status})`,
      errorBody,
    );
  }

  const setCookieHeaders =
    typeof (response.headers as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (response.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [];

  const data = response.status === 204 ? (undefined as T) : ((await response.json()) as T);

  return { data, setCookieHeaders };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
