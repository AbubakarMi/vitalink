// Fixture data only — no Order entity exists on the backend yet (design doc §1).
export const mockOrders = [
  { id: "ord_1001", status: "Delivered", placedAt: "2026-07-28T10:15:00Z", total: 4650, currency: "NGN", itemCount: 2 },
  { id: "ord_1002", status: "Processing", placedAt: "2026-08-02T14:40:00Z", total: 12500, currency: "NGN", itemCount: 1 },
];
