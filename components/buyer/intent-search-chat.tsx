"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, ArrowUp, Sparkles, SquarePen, Boxes, Microscope, TestTube, FlaskConical, ChevronRight, ListFilter, Wallet, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { VitalsWaveform } from "@/components/marketing/vitals-waveform";
import type { Product } from "@/lib/api/products";
import type { Category } from "@/lib/api/categories";
import type { ChatSession, ChatMessage } from "@/lib/api/intent-search";
import { askIntentSearchAction } from "./actions";

const SUGGESTIONS = [
  "Multi-parameter patient monitors under N300,000",
  "Malaria rapid diagnostic test kits",
  "Setup for a basic water quality analysis",
  "NAFDAC-approved pulse oximeters",
];

const CATEGORY_ICONS: Record<string, typeof Boxes> = {
  "medical-equipment": Boxes,
  "scientific-tools": Microscope,
  "reagents-culture-media": TestTube,
  "lab-equipment": FlaskConical,
};

export interface RecentChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface Turn {
  user: ChatMessage | null;
  assistant: ChatMessage | null;
}

function pairMessages(messages: ChatMessage[]): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | null = null;
  for (const message of messages) {
    if (message.role === "user") {
      current = { user: message, assistant: null };
      turns.push(current);
    } else if (current) {
      current.assistant = message;
    } else {
      turns.push({ user: null, assistant: message });
    }
  }
  return turns;
}

/**
 * Intent Search — a split console, not a chat-bubble thread. The left rail
 * is a log of what's been asked this session (like a requisition log); the
 * right pane is a single results workspace for whichever entry is
 * selected, sized to give the product matches real room — this is a
 * search-and-match tool first, a conversation second. Reused by
 * /buyer/dashboard (starts blank) and /buyer/chats/[id] (resumes a saved
 * session). Deterministic mock matcher server-side
 * (lib/api/intent-search.ts), disclosed in the footer.
 */
export function IntentSearchChat({
  initialChat,
  initialProducts,
  categories = [],
  recentChats = [],
}: {
  initialChat: ChatSession | null;
  initialProducts: Record<string, Product>;
  categories?: Category[];
  recentChats?: RecentChatSummary[];
}) {
  const router = useRouter();
  const [chat, setChat] = useState<ChatSession | null>(initialChat);
  const [productsById, setProductsById] = useState<Record<string, Product>>(initialProducts);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const turns = chat ? pairMessages(chat.messages) : [];
  const [selectedIndex, setSelectedIndex] = useState(turns.length - 1);

  // Jump to the newest turn whenever one is added, without undoing a
  // manual pick of an older turn in between — adjusted during render (not
  // in an effect) per React's guidance for resetting state when a derived
  // value changes, same pattern as dashboard-shell.tsx's mobile-drawer reset.
  const [prevTurnCount, setPrevTurnCount] = useState(turns.length);
  if (turns.length !== prevTurnCount) {
    setPrevTurnCount(turns.length);
    setSelectedIndex(turns.length - 1);
  }

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed || pending) return;
    setError(null);
    setInput("");
    startTransition(async () => {
      const result = await askIntentSearchAction(trimmed, chat?.id);
      if (result.error || !result.data) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      const { chat: updatedChat, products } = result.data;
      setChat(updatedChat);
      setProductsById((prev) => {
        const next = { ...prev };
        for (const product of products) next[product.id] = product;
        return next;
      });
      if (!chat) {
        router.replace(`/buyer/chats/${updatedChat.id}`);
      }
    });
  }

  if (!chat) {
    return (
      <div className="vendor-scroll h-full overflow-y-auto px-1">
        <div className="mx-auto max-w-3xl pt-6">
          <p className="text-center font-mono text-xs tracking-[0.2em] text-verified uppercase">Vitalink Intelligence</p>

          <div className="mt-3 flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgba(0,39,8,0.06)] sm:px-10">
            <VitalsWaveform cycles={6} strokeWidth={1} ghostOpacity={0.2} className="h-4 w-full max-w-xs text-line" />
            <span className="mt-5 flex size-14 items-center justify-center rounded-2xl bg-ink text-white shadow-[0_8px_24px_rgba(0,39,8,0.18)]">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 font-[family-name:var(--font-newsreader)] text-3xl leading-[1.15] text-ink sm:text-4xl">
              What&apos;s the requirement?
            </h1>
            <p className="mt-3 max-w-md text-sm text-text-muted">
              Describe it in plain language — equipment type, condition, budget — and I&apos;ll pull a match from the
              catalog.
            </p>

            <SearchInputBar value={input} onChange={setInput} onSubmit={submit} pending={pending} className="mt-8 w-full max-w-xl" />

            <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="rounded-full border border-line bg-cream px-3.5 py-2 text-xs text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-[#c0392b]">{error}</p>}
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-8 pb-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CapabilityCard icon={ListFilter} title="Match by specification" body="Describe an equipment type, condition, or capability and get the closest listings, not just a keyword search." />
            <CapabilityCard icon={Wallet} title="Filter by budget" body="Mention a price ceiling in the requirement and matches are weighed against it." />
            <CapabilityCard icon={BadgeCheck} title="Surface verification" body="Certification status (NAFDAC, FDA) shows on every match so you're not checking listings one by one." />
          </div>

          {categories.length > 0 && (
            <div>
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Browse by Category</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category.slug] ?? Boxes;
                  return (
                    <Link
                      key={category.id}
                      href={`/products?categorySlug=${category.slug}`}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-center transition-colors hover:border-ink/30 hover:bg-cream/40"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-mint text-ink">
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <span className="text-xs font-medium text-ink">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {recentChats.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Recent Searches</p>
                <Link href="/buyer/chats" className="flex items-center gap-0.5 text-xs font-medium text-verified hover:text-ink">
                  View all <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {recentChats.map((recent) => (
                  <Link
                    key={recent.id}
                    href={`/buyer/chats/${recent.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm transition-colors hover:border-ink/30 hover:bg-cream/40"
                  >
                    <span className="min-w-0 truncate text-ink-soft">{recent.title}</span>
                    <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedTurn = turns[selectedIndex] ?? turns[turns.length - 1];
  const hasMultipleTurns = turns.length > 1;

  return (
    <div className={cn("grid h-full grid-cols-1 gap-6", hasMultipleTurns && "lg:grid-cols-[280px_1fr]")}>
      {/* Left rail — only earns its keep once there's an actual log to show */}
      <aside className={cn("hidden flex-col", hasMultipleTurns && "lg:flex")}>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Vitalink Intelligence</p>
            <p className="text-xs text-text-muted">This session</p>
          </div>
        </div>

        <Link
          href="/buyer/dashboard"
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
        >
          <SquarePen className="size-3.5" aria-hidden />
          New Search
        </Link>

        <div className="vendor-scroll mt-4 flex-1 space-y-1 overflow-y-auto">
          {turns.map((turn, i) => (
            <button
              key={turn.user?.id ?? i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "block w-full rounded-xl px-3 py-2.5 text-left text-xs transition-colors",
                i === selectedIndex ? "bg-ink text-white" : "text-ink-soft hover:bg-mint",
              )}
            >
              <span className="font-mono tracking-wide uppercase opacity-70">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-0.5 line-clamp-2">{turn.user?.content}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main — the selected requirement's reading */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-line pb-4 lg:hidden">
          <p className="text-sm font-semibold text-ink">Vitalink Intelligence</p>
          <Link href="/buyer/dashboard" className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink">
            <SquarePen className="size-3.5" aria-hidden />
            New Search
          </Link>
        </div>

        {turns.length > 1 && (
          <div className="vendor-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
            {turns.map((turn, i) => (
              <button
                key={turn.user?.id ?? i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  i === selectedIndex ? "border-ink bg-ink text-white" : "border-line text-ink-soft",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        )}

        <div className="vendor-scroll flex-1 overflow-y-auto py-2">
          {selectedTurn && (
            <div className={cn(!hasMultipleTurns && "mx-auto max-w-3xl")}>
              <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Requirement</p>
                <p className="mt-1.5 text-xl text-ink">{selectedTurn.user?.content}</p>

                {selectedTurn.assistant && (
                  <div className="mt-4 flex items-start gap-3 border-t border-line pt-4">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                      <Sparkles className="size-3.5" aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed text-ink-soft">{selectedTurn.assistant.content}</p>
                  </div>
                )}

                {pending && selectedIndex === turns.length - 1 && (
                  <div className="mt-4 flex items-center gap-1.5 pl-10">
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted" />
                  </div>
                )}
              </div>

              {selectedTurn.assistant?.productIds && selectedTurn.assistant.productIds.length > 0 && (
                <div className="mt-6">
                  <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-verified uppercase">
                    {selectedTurn.assistant.productIds.length} Match
                    {selectedTurn.assistant.productIds.length === 1 ? "" : "es"}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedTurn.assistant.productIds.map((id) => {
                      const product = productsById[id];
                      return product ? <MarketplaceProductCard key={id} product={product} /> : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-cream pt-3 pb-1">
          <SearchInputBar value={input} onChange={setInput} onSubmit={submit} pending={pending} placeholder="Ask a follow-up…" />
          {error && <p className="mt-2 text-sm text-[#c0392b]">{error}</p>}
          <p className="mt-2 text-center text-xs text-text-muted">
            Vitalink Intelligence matches you against our catalog — it can miss items. Always verify certifications
            before purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

function SearchInputBar({
  value,
  onChange,
  onSubmit,
  pending,
  placeholder = "Describe what you need…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  pending: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className={`flex items-center gap-2 rounded-full border border-line bg-white py-2 pr-2 pl-5 shadow-sm transition-shadow focus-within:border-ink/40 focus-within:shadow-[0_0_0_4px_rgba(0,39,8,0.07)] ${className}`}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={pending}
        className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-text-muted"
      />
      <button type="button" aria-label="Voice input" className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink">
        <Mic className="size-4" aria-hidden />
      </button>
      <button
        type="submit"
        disabled={pending || !value.trim()}
        aria-label="Send"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink/85 disabled:opacity-40"
      >
        <ArrowUp className="size-4" aria-hidden />
      </button>
    </form>
  );
}

function CapabilityCard({ icon: Icon, title, body }: { icon: typeof ListFilter; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-left">
      <span className="flex size-8 items-center justify-center rounded-full bg-ink text-white">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-text-muted">{body}</p>
    </div>
  );
}
