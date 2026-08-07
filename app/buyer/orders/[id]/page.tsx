import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Mocked — no Order API yet (design doc §1). Placeholder — UI comes later. */
export default async function BuyerOrderDetailPage({ params }: PageProps) {
  await requireAccountType("buyer", "/buyer/orders");
  const { id } = await params;

  return (
    <main>
      <h1>Order {id}</h1>
      <p>Detail view pending.</p>
    </main>
  );
}
