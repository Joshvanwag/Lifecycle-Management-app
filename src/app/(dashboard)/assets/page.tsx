import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { AssetsDashboard } from "@/components/assets/assets-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllAssets, getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function AssetsPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const [spaces, assets] = await Promise.all([
    getAllSpaces(supabase, auth.organization.id, auth.organization.name),
    getAllAssets(supabase, auth.organization.id, auth.organization.name),
  ]);

  return (
    <AuthenticatedDashboardShell
      title="Assets"
      description="View active equipment, lifecycle age, and replacement exposure."
    >
      <AssetsDashboard
        spaces={spaces}
        assets={assets}
        organizationOptions={[{ id: auth.organization.id, name: auth.organization.name }]}
      />
    </AuthenticatedDashboardShell>
  );
}
