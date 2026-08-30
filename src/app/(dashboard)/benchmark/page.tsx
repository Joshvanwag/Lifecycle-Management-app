import { BenchmarkDashboard } from "@/components/benchmark/benchmark-dashboard";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { requireAuthContext } from "@/lib/auth/context";
import { computeOwnBenchmarkMetrics } from "@/lib/benchmark/own-metrics";
import { listPublicBenchmarkMetrics } from "@/lib/data/benchmarks";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function BenchmarkPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const participating = auth.organization.benchmark_participation;

  const [spaces, peerMetrics] = await Promise.all([
    getAllSpaces(supabase, auth.organization.id, auth.organization.name),
    participating ? listPublicBenchmarkMetrics(supabase) : Promise.resolve([]),
  ]);

  return (
    <AuthenticatedDashboardShell
      title="Benchmark"
      description={`${auth.organization.name} compared with anonymized industry peers`}
    >
      <BenchmarkDashboard
        industryType={auth.organization.industry_type}
        participating={participating}
        ownMetrics={computeOwnBenchmarkMetrics(spaces)}
        peerMetrics={peerMetrics}
      />
    </AuthenticatedDashboardShell>
  );
}
