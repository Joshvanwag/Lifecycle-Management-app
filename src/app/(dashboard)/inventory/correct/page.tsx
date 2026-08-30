import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { CorrectInventorySearch } from "@/components/inventory/correct-inventory-search";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function CorrectInventoryHubPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, assets } = await loadPlatformDashboardData(auth, supabase, {
    includeAssets: true,
    activeOrganizationOnly: true,
  });

  return (
    <AuthenticatedDashboardShell
      title="Correct Inventory"
      description={`Search and edit inventory in ${auth.organization.name} without creating a refresh event`}
    >
      <CorrectInventorySearch spaces={spaces} assets={assets} />
    </AuthenticatedDashboardShell>
  );
}
