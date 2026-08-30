import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, assets, organizationOptions } = await loadPlatformDashboardData(auth, supabase, {
    includeAssets: true,
  });

  return (
    <AuthenticatedDashboardShell
      title="Overview"
      description="Portfolio health, lifecycle needs, and planning outlook."
    >
      <OverviewDashboard
        spaces={spaces}
        assets={assets}
        organizationOptions={organizationOptions}
      />
    </AuthenticatedDashboardShell>
  );
}
