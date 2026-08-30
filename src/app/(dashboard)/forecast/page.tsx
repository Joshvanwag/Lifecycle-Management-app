import { ForecastPlanningDashboard } from "@/components/forecast/forecast-planning-dashboard";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { requireAuthContext } from "@/lib/auth/context";
import { loadPlatformDashboardData } from "@/lib/data/platform-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const params = await searchParams;
  const initialYear = params.year ? Number.parseInt(params.year, 10) : undefined;
  const { spaces, isAggregatedView } = await loadPlatformDashboardData(auth, supabase, {
    includeAssets: false,
  });

  return (
    <AuthenticatedDashboardShell
      title="Forecast"
      description={
        isAggregatedView
          ? "Replacement planning and capital forecasting across customer organizations"
          : `Replacement planning for ${auth.organization.name}`
      }
    >
      <ForecastPlanningDashboard
        spaces={spaces}
        initialYear={Number.isFinite(initialYear) ? initialYear : undefined}
      />
    </AuthenticatedDashboardShell>
  );
}
