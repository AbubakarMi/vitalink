import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked — no Analytics API yet (design doc §1). Placeholder — UI comes later. */
export default async function AdminAnalyticsPage() {
  await requireAccountType("admin", "/admin/analytics");
  return (
    <main>
      <h1>Analytics</h1>
      <p>No Analytics API yet — placeholder.</p>
    </main>
  );
}
