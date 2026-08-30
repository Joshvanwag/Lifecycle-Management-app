import type { BenchmarkMetricPublic } from "@/lib/benchmark/constants";
import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function listPublicBenchmarkMetrics(client: Client): Promise<BenchmarkMetricPublic[]> {
  const { data, error } = await (
    client as unknown as {
      rpc: (
        fn: "get_benchmark_metrics_public",
        args?: {
          p_metric_code?: string;
          p_space_type?: string;
          p_asset_category?: string;
          p_period_year?: number;
        },
      ) => Promise<{ data: BenchmarkMetricPublic[] | null; error: { message: string } | null }>;
    }
  ).rpc("get_benchmark_metrics_public");

  if (error) {
    return [];
  }

  return data ?? [];
}
