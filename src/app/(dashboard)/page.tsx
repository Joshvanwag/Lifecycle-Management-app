import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const spaces = await getAllSpaces(supabase, auth.organization.id);

  return (
    <DashboardShell
      title="Overview"
      description="Portfolio summary and lifecycle insights"
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
    >
      <OverviewDashboard spaces={spaces} />
    </DashboardShell>
  );
}
