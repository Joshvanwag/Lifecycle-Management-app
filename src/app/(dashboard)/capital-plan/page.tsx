import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { CapitalPlanDashboard } from "@/components/planning/capital-plan-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function CapitalPlanPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces } = await loadPlatformDashboardData(auth, supabase, { includeAssets: false });

  return (
    <AuthenticatedDashboardShell
      title="Capital Plan"
      description={`Multi-year planning overlay for ${auth.organization.name}`}
    >
      <CapitalPlanDashboard spaces={spaces} />
    </AuthenticatedDashboardShell>
  );
}
