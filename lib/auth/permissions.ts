import "server-only";
import type { SessionClaims } from "./session";

/**
 * Matches the backend's VtlPermission.NameFor(action, resource) format exactly:
 * "Permissions.{Resource}.{Action}", e.g. "Permissions.Vendors.Approve".
 * See src/Shared/Identity/PermissionRegistry.cs in vitalink-backend.
 */
export function permissionName(resource: string, action: string): string {
  return `Permissions.${resource}.${action}`;
}

const PERMISSIONS_SOURCE = process.env.PERMISSIONS_SOURCE ?? "stub";

// See lib/api/auth.ts's identical ALLOW_MOCK_IN_PRODUCTION guard/comment.
const ALLOW_MOCK_IN_PRODUCTION = process.env.ALLOW_MOCK_IN_PRODUCTION === "true";

if (PERMISSIONS_SOURCE === "stub" && process.env.NODE_ENV === "production" && !ALLOW_MOCK_IN_PRODUCTION) {
  // Backend does not yet expose the current staff user's permission list
  // (CurrentUserResponse/JWT claims carry AccountType and Roles[] only, not
  // permissions — see design doc §5 and §10 item 1). Until that lands,
  // hasPermission() fails open for frontend-dev usability, which must never ship.
  throw new Error(
    "PERMISSIONS_SOURCE is still 'stub' in a production build. This fails the build " +
      "on purpose: the admin permission stub bypasses all permission checks and must " +
      "never ship. Set PERMISSIONS_SOURCE=live once the backend exposes the current " +
      "user's permission list (design doc §10) and lib/auth/permissions.ts is wired " +
      "to read it, or set ALLOW_MOCK_IN_PRODUCTION=true for a throwaway demo deploy.",
  );
}

/**
 * Checks whether the current session holds a given permission. Fails open with a
 * loud dev-only warning while PERMISSIONS_SOURCE=stub (the backend doesn't expose
 * per-user permissions yet — design doc §5) — a production build fails outright if
 * the stub is still active, so this can never ship silently permissive.
 */
export function hasPermission(session: SessionClaims, resource: string, action: string): boolean {
  if (PERMISSIONS_SOURCE === "stub") {
    console.warn(
      `[stub] permission check bypassed: ${permissionName(resource, action)} (user ${session.userId})`,
    );
    return true;
  }

  // TODO: once PERMISSIONS_SOURCE=live, check session.permissions (a field the
  // backend addition in design doc §10 needs to add — SessionClaims doesn't carry
  // it yet since it doesn't exist in the JWT/CurrentUserResponse today).
  return false;
}
