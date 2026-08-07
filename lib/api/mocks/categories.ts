// Fixture data only — no account type has a real read path to category/brand
// taxonomy yet (design doc §1 correction, §10 item 3). Shape matches the Zod
// contract in lib/api/categories.ts, not the (permission-gated) real endpoint.
// Names match the landing page footer (Figma EZER-KEY, node 1707:7213).
export const mockCategories = [
  { id: "cat_medical-equipment", name: "Medical Equipment", slug: "medical-equipment", imageUrl: null },
  { id: "cat_scientific-tools", name: "Scientific Tools", slug: "scientific-tools", imageUrl: null },
  { id: "cat_reagents-culture-media", name: "Reagents & Culture Media", slug: "reagents-culture-media", imageUrl: null },
  { id: "cat_lab-equipment", name: "Lab Equipments", slug: "lab-equipment", imageUrl: null },
];
