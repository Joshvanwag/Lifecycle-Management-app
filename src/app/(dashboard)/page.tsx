import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, assets, organizationOptions, isAggregatedView } = await loadPlatformDashboardData(
    auth,
    supabase,
    { includeAssets: true },
  );

  const description = isAggregatedView
    ? `Portfolio summary across ${organizationOptions.length} customer organizations`
    : `Portfolio summary for ${auth.organization.name}`;

  return (
    <AuthenticatedDashboardShell title="Overview" description={description}>
      <OverviewDashboard
        spaces={spaces}
        assets={assets}
        organizationOptions={organizationOptions}
      />
    </AuthenticatedDashboardShell>
  );
}
