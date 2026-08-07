import { requireAccountType } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/api/auth";
import { listOrdersForCurrentUser } from "@/lib/api/orders";

// Genuinely dynamic (requireAccountType reads cookies) — not prerenderable, and
// that's correct, not a gap to close. See design doc note on Cache Components.
export const instant = false;

/** Vertical slice step 4 (design doc §9): real identity, mocked order history. */
export default async function BuyerDashboardPage() {
  await requireAccountType("buyer", "/buyer/dashboard");
  const [user, orders] = await Promise.all([getCurrentUser(), listOrdersForCurrentUser()]);

  return (
    <main>
      <h1>Welcome{user ? `, ${user.displayName}` : ""}</h1>
      <section>
        <h2>Recent orders</h2>
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              {order.id} — {order.status} — {order.total} {order.currency}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
