/**
 * Client-side recent-search history for SearchBar's "catalog" mode — same
 * idea as Google showing your last few searches when you focus an empty
 * search box. Per-browser only (localStorage), never sent anywhere; there's
 * no backend search-history endpoint to back a real cross-device history
 * with, and this doesn't pretend to be one.
 */

const STORAGE_KEY = "vitalink:recent-searches";
const MAX_ENTRIES = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const existing = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled — recent search history is a
    // convenience, not a requirement, so fail silently.
  }
}

export function removeRecentSearch(query: string): void {
  try {
    const next = getRecentSearches().filter((q) => q !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // See addRecentSearch.
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // See addRecentSearch.
  }
}
