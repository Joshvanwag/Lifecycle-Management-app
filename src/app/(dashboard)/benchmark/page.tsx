import { BenchmarkDashboard } from "@/components/benchmark/benchmark-dashboard";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { INDUSTRY_TYPE_LABELS, type IndustryTypeCode } from "@/lib/benchmark/constants";
import { requireAuthContext } from "@/lib/auth/context";
import { loadBenchmarkPageData } from "@/lib/data/benchmark";
import { createClient } from "@/lib/supabase/server";

export default async function BenchmarkPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const industryType = (auth.organization.industry_type ?? "other") as IndustryTypeCode;
  const industryLabel = INDUSTRY_TYPE_LABELS[industryType] ?? "Industry";

  const data = await loadBenchmarkPageData(
    supabase,
    auth.organization.id,
    industryType,
    auth.organization.benchmark_participation,
  );

  return (
    <AuthenticatedDashboardShell
      title="Benchmark"
      description={`Compare lifecycle performance for ${auth.organization.name}`}
    >
      <BenchmarkDashboard
        industryLabel={industryLabel}
        canAccess={data.canAccess}
        optedOut={data.optedOut}
        orgValues={data.orgValues}
        peerMetrics={data.peerMetrics}
      />
    </AuthenticatedDashboardShell>
  );
}
