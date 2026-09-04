"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

/**
 * Header avatar → click to reveal a Sign Out menu (plus optional extra nav
 * links, e.g. "My Orders" for a vendor shopping the marketplace — see
 * components/marketplace/marketplace-header.tsx). Shared across roles
 * (components/vendor/dashboard-shell.tsx, components/customer/dashboard-shell.tsx)
 * since the behavior and logoutAction are identical regardless of
 * AccountType — this is presentation, not role-scoped business logic, so it
 * lives in components/ui/ rather than being duplicated per role.
 */
export function AccountMenu({
  name,
  badge,
  links = [],
}: {
  name: string;
  badge: string;
  links?: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-32 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block text-xs text-verified">{badge}</span>
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <div className="px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-verified">{badge}</p>
          </div>
          {links.length > 0 && (
            <div className="border-b border-line py-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-mint hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#c0392b] transition-colors hover:bg-[#fff0ee]"
            >
              <LogOut className="size-4" aria-hidden />
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
