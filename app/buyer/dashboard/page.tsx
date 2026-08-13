import { requireAccountType } from "@/lib/auth/dal";
import { listFeaturedCategories } from "@/lib/api/categories";
import { listChatsForBuyer } from "@/lib/api/intent-search";
import { IntentSearchChat } from "@/components/buyer/intent-search-chat";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** The buyer's home is Intent Search, not a stats dashboard (design doc —
 * no "Overview" nav item exists in the reference mockups). Always starts
 * blank; a submitted message moves the URL to /buyer/chats/[id]. Category
 * tiles and recent searches give the blank state real content instead of
 * an empty prompt box. */
export default async function BuyerDashboardPage() {
  await requireAccountType("buyer", "/buyer/dashboard");
  const [categories, chats] = await Promise.all([listFeaturedCategories(), listChatsForBuyer()]);

  return (
    <IntentSearchChat
      initialChat={null}
      initialProducts={{}}
      categories={categories}
      recentChats={chats.slice(0, 3)}
    />
  );
}
