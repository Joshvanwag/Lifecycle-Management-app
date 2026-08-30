import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { AssetsDashboard } from "@/components/assets/assets-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { getAssetChartSource, listAssets } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() ?? "";

  if (auth.isPlatformAdmin) {
    const { spaces, assets, organizationOptions } = await loadPlatformDashboardData(auth, supabase);
    return (
      <AuthenticatedDashboardShell
        title="Assets"
        description={`${assets.length} assets across ${organizationOptions.length} customer organizations`}
      >
        <AssetsDashboard
          spaces={spaces}
          assets={assets}
          organizationOptions={organizationOptions}
        />
      </AuthenticatedDashboardShell>
    );
  }

  const [{ spaces, organizationOptions }, paged, chartAssets] = await Promise.all([
    loadPlatformDashboardData(auth, supabase, { includeAssets: false }),
    listAssets(
      supabase,
      auth.organization.id,
      { page, pageSize: PAGE_SIZE, search },
      auth.organization.name,
    ),
    getAssetChartSource(supabase, auth.organization.id),
  ]);

  return (
    <AuthenticatedDashboardShell
      title="Assets"
      description={`${paged.totalCount} assets in ${auth.organization.name}`}
    >
      <AssetsDashboard
        spaces={spaces}
        assets={paged.assets}
        chartAssets={chartAssets}
        organizationOptions={organizationOptions}
        totalCount={paged.totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        search={search}
      />
    </AuthenticatedDashboardShell>
  );
}
