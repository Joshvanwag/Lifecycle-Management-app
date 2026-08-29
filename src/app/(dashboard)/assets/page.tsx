import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { AssetsDashboard } from "@/components/assets/assets-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllAssets, getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function AssetsPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const organizationId = auth.organization.id;

  const [spaces, assets] = await Promise.all([
    getAllSpaces(supabase, organizationId),
    getAllAssets(supabase, organizationId),
  ]);

  return (
    <AuthenticatedDashboardShell
      title="Assets"
      description="Equipment inventory across all Spaces"
    >
      <AssetsDashboard spaces={spaces} assets={assets} />
    </AuthenticatedDashboardShell>
  );
}
