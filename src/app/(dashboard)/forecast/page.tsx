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
  const { spaces } = await loadPlatformDashboardData(auth, supabase, {
    includeAssets: false,
  });

  return (
    <AuthenticatedDashboardShell
      title="Forecast"
      description="Plan future lifecycle needs and compare recommended work with planned work."
    >
      <ForecastPlanningDashboard
        spaces={spaces}
        initialYear={Number.isFinite(initialYear) ? initialYear : undefined}
      />
    </AuthenticatedDashboardShell>
  );
}
