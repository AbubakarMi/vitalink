import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Order/Payment API yet (design doc §1). Placeholder — UI comes later. */
export default async function CheckoutPage() {
  await requireAccountType("buyer", "/buyer/checkout");

  return (
    <main>
      <h1>Checkout</h1>
      <p>No payment integration exists yet — this page is a placeholder.</p>
    </main>
  );
}
