import "server-only";
import { cookies } from "next/headers";

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
    throw new Error("BACKEND_ORIGIN is not set (e.g. http://localhost:5000 in dev).");
  }
  return origin;
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
  const url = new URL(path, backendOrigin());
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

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    // Identity-bearing requests are never cached at the fetch layer. Caching, when
    // wanted for public/mocked data, happens explicitly via "use cache" in the
    // calling Server Component instead — see design doc §7.
    cache: "no-store",
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
