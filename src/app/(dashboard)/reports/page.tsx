import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { ReportsHub } from "@/components/reports/reports-hub";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { listSavedReports } from "@/lib/data/saved-reports";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const [{ spaces, assets }, savedReports] = await Promise.all([
    loadPlatformDashboardData(auth, supabase, {
      includeAssets: true,
      activeOrganizationOnly: true,
    }),
    listSavedReports(supabase, auth.organization.id, auth.userId),
  ]);

  return (
    <AuthenticatedDashboardShell
      title="Reports"
      description={`Canned portfolio reports for ${auth.organization.name}`}
    >
      <ReportsHub spaces={spaces} assets={assets} savedReports={savedReports} />
    </AuthenticatedDashboardShell>
  );
}
