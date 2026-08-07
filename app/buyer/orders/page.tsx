import { requireAccountType } from "@/lib/auth/dal";
import { listOrdersForCurrentUser } from "@/lib/api/orders";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Order API yet (design doc §1). */
export default async function BuyerOrdersPage() {
  await requireAccountType("buyer", "/buyer/orders");
  const orders = await listOrdersForCurrentUser();

  return (
    <main>
      <h1>Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <a href={`/buyer/orders/${order.id}`}>
              {order.id} — {order.status}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
