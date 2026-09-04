import Link from "next/link";
import { MessageSquare, Sparkles, ChevronRight } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listChatsForCustomer } from "@/lib/api/intent-search";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const PAGE_SIZE = 8;

function dateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

/** Past Intent Search sessions (Frame 2018776178.pdf's "Chats" tab), most
 * recent first, grouped by date. Each card resumes the conversation at
 * /customer/chats/[id]. */
export default async function CustomerChatsPage({ searchParams }: PageProps) {
  await requireAccountType("customer", "/customer/chats");
  const params = await searchParams;
  const chats = await listChatsForCustomer();

  const page = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(chats.length / PAGE_SIZE));
  const pageItems = chats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groups = new Map<string, typeof pageItems>();
  for (const chat of pageItems) {
    const label = dateLabel(chat.updatedAt);
    const group = groups.get(label) ?? [];
    group.push(chat);
    groups.set(label, group);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Search History</p>
      <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Chats</h1>

      {chats.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line py-16 text-center">
          <MessageSquare className="size-6 text-text-muted" aria-hidden />
          <p className="mt-3 text-sm text-text-muted">No searches yet — start one from New Search.</p>
          <Link href="/customer/dashboard" className="mt-4 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/85">
            New Search
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-6">
            {[...groups.entries()].map(([label, groupChats]) => (
              <div key={label}>
                <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">{label}</p>
                <div className="mt-2 space-y-2">
                  {groupChats.map((chat) => {
                    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
                    const matchCount = lastAssistant?.productIds?.length ?? 0;
                    return (
                      <Link
                        key={chat.id}
                        href={`/customer/chats/${chat.id}`}
                        className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink/30 hover:bg-cream/40"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                          <Sparkles className="size-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{chat.title}</p>
                          {lastAssistant && <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{lastAssistant.content}</p>}
                          <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] tracking-wide text-text-muted uppercase">
                            <span>{new Date(chat.updatedAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}</span>
                            {matchCount > 0 && <span className="text-verified">{matchCount} matches</span>}
                          </div>
                        </div>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-text-muted" aria-hidden />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {chats.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <PageLink page={page - 1} disabled={page <= 1}>
                Prev
              </PageLink>
              <span className="px-2 text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <PageLink page={page + 1} disabled={page >= totalPages}>
                Next
              </PageLink>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageLink({ page, disabled, children }: { page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-sm text-text-muted/50">{children}</span>;
  }
  return (
    <Link href={`/customer/chats?page=${page}`} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
      {children}
    </Link>
  );
}
