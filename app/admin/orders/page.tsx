import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Order API yet (design doc §1). Placeholder — UI comes later. */
export default async function AdminOrdersPage() {
  await requireAccountType("admin", "/admin/orders");
  return (
    <main>
      <h1>Orders</h1>
      <p>No Order API yet — placeholder.</p>
    </main>
  );
}
