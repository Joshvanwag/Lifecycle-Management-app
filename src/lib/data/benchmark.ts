import type { BenchmarkMetricPublic, IndustryTypeCode } from "@/lib/benchmark/constants";
import { BENCHMARK_UNAVAILABLE_MESSAGE } from "@/lib/benchmark/constants";
import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface OrganizationBenchmarkValue {
  metric_code: string;
  space_type: string | null;
  asset_category: string | null;
  period_year: number | null;
  value: number;
}

export interface BenchmarkPageData {
  industryType: IndustryTypeCode;
  industryLabel: string;
  canAccess: boolean;
  optedOut: boolean;
  orgValues: OrganizationBenchmarkValue[];
  peerMetrics: BenchmarkMetricPublic[];
}

export async function loadBenchmarkPageData(
  supabase: Client,
  organizationId: string,
  industryType: IndustryTypeCode,
  benchmarkParticipation: boolean,
): Promise<BenchmarkPageData> {
  const industryLabel =
    industryType.charAt(0).toUpperCase() + industryType.slice(1);

  if (!benchmarkParticipation) {
    return {
      industryType,
      industryLabel,
      canAccess: false,
      optedOut: true,
      orgValues: [],
      peerMetrics: [],
    };
  }

  const [{ data: orgValueRows }, { data: peerRows }] = await Promise.all([
    supabase
      .from("organization_benchmark_values")
      .select("metric_code, space_type, asset_category, period_year, value")
      .eq("organization_id", organizationId),
    supabase.rpc("get_benchmark_metrics_public"),
  ]);

  const peerMetrics = ((peerRows ?? []) as BenchmarkMetricPublic[]).filter(
    (row) => row.industry_type === industryType,
  );

  return {
    industryType,
    industryLabel,
    canAccess: true,
    optedOut: false,
    orgValues: (orgValueRows ?? []) as OrganizationBenchmarkValue[],
    peerMetrics,
  };
}

export function findOrgValue(
  orgValues: OrganizationBenchmarkValue[],
  metricCode: string,
  context?: { spaceType?: string | null; assetCategory?: string | null; periodYear?: number | null },
): number | null {
  const match = orgValues.find(
    (row) =>
      row.metric_code === metricCode &&
      (context?.spaceType === undefined || row.space_type === context.spaceType) &&
      (context?.assetCategory === undefined || row.asset_category === context.assetCategory) &&
      (context?.periodYear === undefined || row.period_year === context.periodYear),
  );
  return match?.value ?? null;
}

export function findPeerMetric(
  peerMetrics: BenchmarkMetricPublic[],
  metricCode: string,
  context?: { spaceType?: string | null; assetCategory?: string | null; periodYear?: number | null },
): BenchmarkMetricPublic | null {
  return (
    peerMetrics.find(
      (row) =>
        row.metric_code === metricCode &&
        (context?.spaceType === undefined || row.space_type === context.spaceType) &&
        (context?.assetCategory === undefined || row.asset_category === context.assetCategory) &&
        (context?.periodYear === undefined || row.period_year === context.periodYear),
    ) ?? null
  );
}

export { BENCHMARK_UNAVAILABLE_MESSAGE };

export function formatBenchmarkValue(value: number | null, kind: "percentage" | "currency" | "years" | "count"): string {
  if (value == null) return "—";
  if (kind === "percentage") return `${Math.round(value)}%`;
  if (kind === "years") return `${value.toFixed(1)} yrs`;
  if (kind === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return String(Math.round(value));
}
