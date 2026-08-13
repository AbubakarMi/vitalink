import { notFound } from "next/navigation";
import { requireAccountType } from "@/lib/auth/dal";
import { getChatForBuyer } from "@/lib/api/intent-search";
import { getProductsByIds, type Product } from "@/lib/api/products";
import { IntentSearchChat } from "@/components/buyer/intent-search-chat";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Resumes a saved Intent Search session — same chat component as
 * /buyer/dashboard, just seeded with history instead of starting blank. */
export default async function BuyerChatPage({ params }: PageProps) {
  await requireAccountType("buyer", "/buyer/chats");
  const { id } = await params;
  const chat = await getChatForBuyer(id);
  if (!chat) {
    notFound();
  }

  const productIds = [...new Set(chat.messages.flatMap((m) => m.productIds ?? []))];
  const products = await getProductsByIds(productIds);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;

  return <IntentSearchChat initialChat={chat} initialProducts={productsById} />;
}
