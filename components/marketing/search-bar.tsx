"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchSuggestionsAction, type SearchSuggestion } from "@/components/marketing/actions";
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/search/recent-searches";

const AI_PROMPTS = [
  "Multi-parameter patient monitors under N300,000",
  "Malaria rapid diagnostic test kits",
  "NAFDAC-approved pulse oximeters",
  "Setup for a basic water quality analysis",
];

type SearchMode = "catalog" | "ai";

/**
 * Two search modes, switched via the Search/AI toggle built into the same
 * bar as the input (not a separate row above it): "catalog" is a literal
 * keyword search against /products (with live name-match suggestions from
 * the mock catalog, debounced 200ms); "ai" hands the query to Vitalink
 * Intelligence (components/customer/intent-search-chat.tsx) via
 * /customer/dashboard?q=, which requires a customer session — an anonymous
 * visitor gets bounced through /login and back (lib/auth/dal.ts's
 * requireAccountType).
 *
 * One component backs both the compact nav pill (site-header.tsx,
 * marketplace-header.tsx, customer/dashboard-shell.tsx) and the full-width
 * hero bar (hero-search.tsx) rather than duplicating the toggle/suggestions
 * logic four times — `variant` only changes sizing/color, not behavior.
 */
export function SearchBar({ variant = "nav", className }: { variant?: "nav" | "hero"; className?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("catalog");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  // Lazy initializer (not an effect): localStorage is unavailable during SSR
  // (getRecentSearches() catches that and returns []), but this value never
  // affects the initial render's DOM — the dropdown starts closed — so
  // reading the real client-side value here doesn't risk a hydration
  // mismatch, and avoids a setState-in-effect cascade for something that's
  // just an initial value, not a subscription to an external store.
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (mode !== "catalog") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }
    setSuggestionsLoading(true);
    setOpen(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      searchSuggestionsAction(trimmed)
        .then((results) => {
          if (requestIdRef.current !== requestId) return; // a newer keystroke superseded this one
          setSuggestions(results);
          setSuggestionsLoading(false);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setSuggestionsLoading(false);
        });
    }, 200);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    if (mode === "ai") {
      router.push(`/customer/dashboard?q=${encodeURIComponent(trimmed)}`);
    } else {
      addRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function runRecentSearch(value: string) {
    setQuery(value);
    submit(value);
  }

  function deleteRecentSearch(e: React.MouseEvent, value: string) {
    e.preventDefault();
    e.stopPropagation();
    removeRecentSearch(value);
    setRecentSearches(getRecentSearches());
  }

  function switchMode(next: SearchMode) {
    setMode(next);
    setSuggestions([]);
    const trimmed = query.trim();
    setOpen(next === "ai" || trimmed.length >= 2 || (next === "catalog" && trimmed.length === 0 && recentSearches.length > 0));
  }

  const isHero = variant === "hero";
  const trimmedQuery = query.trim();
  const showRecent = mode === "catalog" && trimmedQuery.length === 0 && recentSearches.length > 0;
  const showDropdown = open && (mode === "ai" ? true : trimmedQuery.length >= 2 || showRecent);

  const dropdown = showDropdown && (
    <div className="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
      {mode === "catalog" ? (
        showRecent ? (
          <div className="py-1">
            <p className="flex items-center justify-between px-4 pt-1.5 pb-1">
              <span className="text-[10px] font-medium tracking-[0.1em] text-text-muted uppercase">Recent searches</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  clearRecentSearches();
                  setRecentSearches([]);
                }}
                className="text-xs text-verified hover:underline"
              >
                Clear
              </button>
            </p>
            <ul>
              {recentSearches.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => runRecentSearch(q)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-mint/60"
                  >
                    <Clock className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                    <span className="flex-1 truncate">{q}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => deleteRecentSearch(e, q)}
                      aria-label={`Remove "${q}" from recent searches`}
                      className="shrink-0 rounded p-0.5 text-text-muted hover:bg-white hover:text-ink"
                    >
                      <X className="size-3.5" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : suggestionsLoading ? (
          <p className="px-4 py-3 text-sm text-text-muted">Searching…</p>
        ) : suggestions.length > 0 ? (
          <ul>
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/products/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-mint/60"
                >
                  <span className="truncate">{s.name}</span>
                  {s.categoryLabel && <span className="shrink-0 text-xs text-text-muted">{s.categoryLabel}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-text-muted">No matches for &ldquo;{trimmedQuery}&rdquo;</p>
        )
      ) : (
        <div className="p-2">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-medium tracking-[0.1em] text-text-muted uppercase">
            Try asking Vitalink Intelligence
          </p>
          {AI_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submit(prompt)}
              className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-mint/60"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const toggle = (
    <div className={cn("flex shrink-0 items-center gap-0.5", isHero ? "pr-3" : "pr-2")}>
      <ModeToggleButton isHero={isHero} active={mode === "catalog"} onClick={() => switchMode("catalog")}>
        <Search className={isHero ? "size-3.5" : "size-3"} aria-hidden />
        {isHero && "Search"}
      </ModeToggleButton>
      <ModeToggleButton isHero={isHero} active={mode === "ai"} onClick={() => switchMode("ai")}>
        <Sparkles className={isHero ? "size-3.5" : "size-3"} aria-hidden />
        {isHero ? "AI" : ""}
      </ModeToggleButton>
    </div>
  );

  return (
    <div ref={containerRef} className={cn("relative", isHero ? "w-full" : "w-full max-w-sm", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className={isHero ? "flex flex-col gap-3 sm:flex-row" : "flex items-center"}
      >
        <div
          className={cn(
            "flex flex-1 items-center transition-all",
            isHero
              ? "rounded-md border border-white/15 bg-white/[0.06] pr-5 pl-2 focus-within:border-white/30"
              : "h-11 rounded-lg border border-line bg-white pr-4 pl-1.5 focus-within:border-verified/50 focus-within:shadow-[0_0_0_3px_rgba(0,107,95,0.08)]",
          )}
        >
          {toggle}
          <span className={cn("shrink-0", isHero ? "mr-3 h-6 w-px bg-white/15" : "mr-2.5 h-5 w-px bg-line")} aria-hidden />
          {mode === "ai" ? (
            <Sparkles className={cn("shrink-0", isHero ? "size-5 text-white/50" : "size-4 text-verified/70")} aria-hidden />
          ) : (
            <Search className={cn("shrink-0", isHero ? "size-5 text-white/50" : "size-4 text-ink-soft/50")} aria-hidden />
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setOpen(mode === "ai" || trimmedQuery.length >= 2 || showRecent)}
            placeholder={
              mode === "ai"
                ? isHero
                  ? "Describe what you need — e.g. NAFDAC-approved pulse oximeters…"
                  : "Ask Vitalink Intelligence…"
                : isHero
                  ? "e.g. multi-parameter patient monitor, NAFDAC-approved malaria RDT kits…"
                  : "Search the catalog…"
            }
            className={cn(
              "ml-2.5 min-w-0 flex-1 bg-transparent outline-none",
              isHero
                ? "font-mono text-sm text-white placeholder:text-white/35"
                : "text-[13px] text-ink-soft placeholder:text-warm-muted",
            )}
          />
          {!isHero && (
            <button
              type="submit"
              aria-label="Search"
              className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-md bg-mint text-ink transition-colors hover:bg-verified hover:text-white"
            >
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        {isHero && (
          <button
            type="submit"
            className="rounded-md bg-mint px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-white"
          >
            {mode === "ai" ? "Ask Vitalink Intelligence" : "Search catalog"}
          </button>
        )}
      </form>

      {dropdown}
    </div>
  );
}

function ModeToggleButton({
  active,
  isHero,
  onClick,
  children,
}: {
  active: boolean;
  isHero: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-md font-medium transition-colors",
        isHero ? "px-2.5 py-1.5 text-xs" : "px-1.5 py-1.5 text-[11px]",
        active
          ? isHero
            ? "bg-white/15 text-white"
            : "bg-mint text-verified"
          : isHero
            ? "text-white/50 hover:text-white"
            : "text-ink-soft/50 hover:text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}
