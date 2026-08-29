import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const spaces = await getAllSpaces(supabase, auth.organization.id);

  return (
    <AuthenticatedDashboardShell
      title="Overview"
      description="Portfolio summary and lifecycle insights"
    >
      <OverviewDashboard spaces={spaces} />
    </AuthenticatedDashboardShell>
  );
}
