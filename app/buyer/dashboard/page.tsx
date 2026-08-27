import { requireAccountType } from "@/lib/auth/dal";
import { listFeaturedCategories } from "@/lib/api/categories";
import { listChatsForBuyer } from "@/lib/api/intent-search";
import { IntentSearchChat } from "@/components/buyer/intent-search-chat";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

/** The buyer's home is Intent Search, not a stats dashboard (design doc —
 * no "Overview" nav item exists in the reference mockups). Always starts
 * blank; a submitted message moves the URL to /buyer/chats/[id]. Category
 * tiles and recent searches give the blank state real content instead of
 * an empty prompt box. An optional ?q= (the landing page/nav SearchBar's
 * "AI search" mode) auto-submits that query on load — carried through the
 * login redirect too, so a signed-out visitor's search survives the detour. */
export default async function BuyerDashboardPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const currentPath = q ? `/buyer/dashboard?q=${encodeURIComponent(q)}` : "/buyer/dashboard";
  await requireAccountType("buyer", currentPath);
  const [categories, chats] = await Promise.all([listFeaturedCategories(), listChatsForBuyer()]);

  return (
    <IntentSearchChat
      initialChat={null}
      initialProducts={{}}
      categories={categories}
      recentChats={chats.slice(0, 3)}
      initialQuery={q}
    />
  );
}
