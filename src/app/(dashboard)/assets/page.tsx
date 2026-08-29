import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { AssetsDashboard } from "@/components/assets/assets-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function AssetsPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, assets, organizationOptions, isAggregatedView } =
    await loadPlatformDashboardData(auth, supabase);

  const description = isAggregatedView
    ? `${assets.length} assets across ${organizationOptions.length} customer organizations`
    : "Equipment inventory across all Spaces";

  return (
    <AuthenticatedDashboardShell title="Assets" description={description}>
      <AssetsDashboard
        spaces={spaces}
        assets={assets}
        organizationOptions={organizationOptions}
      />
    </AuthenticatedDashboardShell>
  );
}
