/**
 * Benchmarking system constants.
 *
 * The authoritative min contributor threshold lives in
 * `benchmark_system_settings.min_contributor_threshold` (default: 5).
 * Server-side aggregation must read that value; this constant documents the initial default.
 */

export const BENCHMARK_MIN_CONTRIBUTOR_THRESHOLD_DEFAULT = 5;

export const BENCHMARK_UNAVAILABLE_MESSAGE =
  "Benchmark data is not yet available. Additional industry data is required before this benchmark can be displayed.";

export const INDUSTRY_TYPE_CODES = [
  "university",
  "government",
  "corporate",
  "other",
] as const;

export type IndustryTypeCode = (typeof INDUSTRY_TYPE_CODES)[number];

export const INDUSTRY_TYPE_LABELS: Record<IndustryTypeCode, string> = {
  university: "University",
  government: "Government",
  corporate: "Corporate",
  other: "Other",
};

export type BenchmarkMetricDomain =
  | "lifecycle_health"
  | "financial"
  | "planning_maturity";

export type BenchmarkValueKind =
  | "percentage"
  | "currency"
  | "years"
  | "ratio"
  | "count_normalized";

/** Customer-facing benchmark aggregate (never includes contributor_count). */
export interface BenchmarkMetricPublic {
  id: string;
  industry_type: IndustryTypeCode;
  metric_code: string;
  space_type: string | null;
  asset_category: string | null;
  period_year: number | null;
  average: number | null;
  median: number | null;
  percentile_25: number | null;
  percentile_75: number | null;
  computed_at: string;
}
