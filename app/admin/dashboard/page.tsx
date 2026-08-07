import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Mocked aggregate stats — no public/admin stats endpoint yet (design doc §1). */
export default async function AdminDashboardPage() {
  await requireAccountType("admin", "/admin/dashboard");
  return (
    <main>
      <h1>Admin dashboard</h1>
      <p>Aggregate stats pending — placeholder.</p>
    </main>
  );
}
