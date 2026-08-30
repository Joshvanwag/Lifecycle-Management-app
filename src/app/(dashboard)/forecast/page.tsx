import { ForecastExplorer } from "@/components/forecast/forecast-explorer";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function ForecastPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, isAggregatedView } = await loadPlatformDashboardData(auth, supabase, {
    includeAssets: false,
  });

  return (
    <AuthenticatedDashboardShell
      title="Forecast"
      description={
        isAggregatedView
          ? "Replacement cost projections across customer organizations"
          : `Replacement cost projections for ${auth.organization.name}`
      }
    >
      <ForecastExplorer spaces={spaces} />
    </AuthenticatedDashboardShell>
  );
}
