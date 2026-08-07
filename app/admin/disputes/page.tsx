import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no backend concept of disputes yet (design doc §1). Placeholder — UI comes later. */
export default async function AdminDisputesPage() {
  await requireAccountType("admin", "/admin/disputes");
  return (
    <main>
      <h1>Disputes</h1>
      <p>No backend concept of disputes yet — placeholder.</p>
    </main>
  );
}
