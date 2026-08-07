// Fixture data only — no Cart entity exists on the backend yet (design doc §1).
export const mockCart = {
  items: [{ productId: "prod_paracetamol-500", name: "Paracetamol 500mg (20 tablets)", quantity: 1, unitPrice: 850, currency: "NGN" }],
  subtotal: 850,
  currency: "NGN",
};
