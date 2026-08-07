// Fixture data only — no account type has a real read path to category/brand
// taxonomy yet (design doc §1 correction, §10 item 3). Shape matches the Zod
// contract in lib/api/categories.ts, not the (permission-gated) real endpoint.
export const mockCategories = [
  { id: "cat_otc", name: "OTC Medication", slug: "otc-medication", imageUrl: null },
  { id: "cat_wellness", name: "Wellness & Supplements", slug: "wellness-supplements", imageUrl: null },
  { id: "cat_mother-child", name: "Mother & Child Care", slug: "mother-child-care", imageUrl: null },
  { id: "cat_devices", name: "Medical Devices", slug: "medical-devices", imageUrl: null },
];
