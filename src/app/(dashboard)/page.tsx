import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, organizationOptions, isAggregatedView } = await loadPlatformDashboardData(
    auth,
    supabase,
  );

  const description = isAggregatedView
    ? `${spaces.length} Spaces across ${organizationOptions.length} customer organizations`
    : "Portfolio summary and lifecycle insights";

  return (
    <AuthenticatedDashboardShell title="Overview" description={description}>
      <OverviewDashboard spaces={spaces} organizationOptions={organizationOptions} />
    </AuthenticatedDashboardShell>
  );
}
