import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces, getDashboardMetrics } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const organizationId = auth.organization.id;

  const [metrics, spaces] = await Promise.all([
    getDashboardMetrics(supabase, organizationId),
    getAllSpaces(supabase, organizationId),
  ]);

  const upcomingSpaces = spaces
    .filter((space) => space.lifecycleStatus === "upcoming" || space.lifecycleStatus === "due")
    .slice(0, 5);

  return (
    <DashboardShell
      title="Overview"
      description="Portfolio summary and lifecycle insights"
      showSearch
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
    >
      <OverviewDashboard metrics={metrics} upcomingSpaces={upcomingSpaces} />
    </DashboardShell>
  );
}
