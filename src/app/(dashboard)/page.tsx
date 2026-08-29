import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { demoDashboardMetrics, demoSpaces } from "@/lib/demo-data";

export default function OverviewPage() {
  const upcomingSpaces = demoSpaces
    .filter((space) => space.lifecycleStatus === "upcoming" || space.lifecycleStatus === "due")
    .slice(0, 5);

  return (
    <DashboardShell
      title="Overview"
      description="Portfolio summary and lifecycle insights"
      showSearch
    >
      <OverviewDashboard metrics={demoDashboardMetrics} upcomingSpaces={upcomingSpaces} />
    </DashboardShell>
  );
}
