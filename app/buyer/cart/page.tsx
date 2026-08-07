import { requireAccountType } from "@/lib/auth/dal";
import { getCurrentCart } from "@/lib/api/cart";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Cart API yet (design doc §1). */
export default async function CartPage() {
  await requireAccountType("buyer", "/buyer/cart");
  const cart = await getCurrentCart();

  return (
    <main>
      <h1>Cart</h1>
      <ul>
        {cart.items.map((item) => (
          <li key={item.productId}>
            {item.quantity} × {item.name}
          </li>
        ))}
      </ul>
      <p>
        Subtotal: {cart.subtotal} {cart.currency}
      </p>
    </main>
  );
}
