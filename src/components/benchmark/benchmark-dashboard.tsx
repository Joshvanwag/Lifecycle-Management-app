"use client";

import { useMemo, useState } from "react";
import {
  BENCHMARK_UNAVAILABLE_MESSAGE,
  INDUSTRY_TYPE_LABELS,
  type BenchmarkMetricPublic,
  type IndustryTypeCode,
} from "@/lib/benchmark/constants";
import type { OwnBenchmarkMetric } from "@/lib/benchmark/own-metrics";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BenchmarkDashboardProps {
  industryType: string;
  participating: boolean;
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
  spaceTypes: string[];
  assetCategories: string[];
}

type MetricKind = "percentage" | "currency" | "years" | "count";

interface MetricDef {
  code: string;
  label: string;
  kind: MetricKind;
}

interface MetricContext {
  spaceType?: string | null;
  assetCategory?: string | null;
}

const LIFECYCLE_METRICS: MetricDef[] = [
  { code: "avg_space_age_years", label: "Average Space Age", kind: "years" },
  { code: "portfolio_pct_overdue", label: "Overdue %", kind: "percentage" },
  { code: "portfolio_pct_due_this_year", label: "Due This Year %", kind: "percentage" },
  { code: "portfolio_pct_due_1_3_years", label: "Due in 1–3 Years %", kind: "percentage" },
  { code: "portfolio_pct_due_4_7_years", label: "Due in 4–7 Years %", kind: "percentage" },
  { code: "portfolio_pct_due_beyond_7_years", label: "Due Beyond 7 Years %", kind: "percentage" },
  { code: "avg_refresh_cycle_years", label: "Average Refresh Cycle", kind: "years" },
  { code: "median_refresh_cycle_years", label: "Median Refresh Cycle", kind: "years" },
];

const FINANCIAL_METRICS: MetricDef[] = [
  { code: "avg_replacement_cost_per_space", label: "Average Replacement Cost per Space", kind: "currency" },
  { code: "median_replacement_cost_per_space", label: "Median Replacement Cost per Space", kind: "currency" },
  { code: "five_year_forecast_per_space", label: "5-Year Forecast per Space", kind: "currency" },
  { code: "portfolio_pct_value_overdue", label: "Portfolio Value Overdue %", kind: "percentage" },
];

const PLANNING_METRICS: MetricDef[] = [
  { code: "pct_lifecycle_need_planned", label: "Lifecycle Need With Plan %", kind: "percentage" },
  { code: "pct_scheduled", label: "Scheduled %", kind: "percentage" },
  { code: "pct_deferred", label: "Deferred %", kind: "percentage" },
  { code: "pct_overdue_scheduled", label: "Overdue but Scheduled %", kind: "percentage" },
  { code: "pct_upcoming_with_planned_replacement", label: "Upcoming Lifecycle Need With Plan %", kind: "percentage" },
];

const SPACE_TYPE_METRICS: MetricDef[] = [
  { code: "space_type_avg_lifecycle_years", label: "Average Lifecycle", kind: "years" },
  { code: "space_type_median_lifecycle_years", label: "Median Lifecycle", kind: "years" },
  { code: "space_type_overdue_pct", label: "Overdue %", kind: "percentage" },
  { code: "space_type_due_pct", label: "Due %", kind: "percentage" },
  { code: "space_type_avg_asset_count", label: "Average Asset Count", kind: "count" },
  { code: "space_type_planned_refresh_coverage_pct", label: "Planned Refresh Coverage %", kind: "percentage" },
];

const EQUIPMENT_METRICS: MetricDef[] = [
  { code: "category_avg_lifecycle_years", label: "Average Lifecycle", kind: "years" },
  { code: "category_median_lifecycle_years", label: "Median Lifecycle", kind: "years" },
  { code: "category_avg_replacement_cost", label: "Average Replacement Cost", kind: "currency" },
  { code: "category_median_replacement_cost", label: "Median Replacement Cost", kind: "currency" },
  { code: "category_overdue_pct", label: "Overdue %", kind: "percentage" },
  { code: "category_forecast_cost", label: "Forecast Cost per Asset", kind: "currency" },
];

function formatBenchmarkValue(value: number | null, kind: MetricKind): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (kind === "percentage") return `${Math.round(value)}%`;
  if (kind === "years") return `${value.toFixed(1)} yrs`;
  if (kind === "currency") return formatCurrency(value);
  return String(Math.round(value));
}

function matchesContext(
  row: { spaceType?: string | null; assetCategory?: string | null },
  context?: MetricContext,
): boolean {
  if (context?.spaceType !== undefined) {
    return (row.spaceType ?? null) === (context.spaceType ?? null);
  }
  if (context?.assetCategory !== undefined) {
    return (row.assetCategory ?? null) === (context.assetCategory ?? null);
  }
  return (row.spaceType ?? null) === null && (row.assetCategory ?? null) === null;
}

function findOwnValue(
  ownMetrics: OwnBenchmarkMetric[],
  code: string,
  context?: MetricContext,
): number | null {
  return (
    ownMetrics.find((metric) => metric.code === code && matchesContext(metric, context))?.value ??
    null
  );
}

function findPeerMetric(
  peerMetrics: BenchmarkMetricPublic[],
  code: string,
  context?: MetricContext,
): BenchmarkMetricPublic | null {
  return (
    peerMetrics.find(
      (metric) =>
        metric.metric_code === code &&
        (context?.spaceType !== undefined
          ? metric.space_type === context.spaceType
          : context?.assetCategory !== undefined
            ? metric.asset_category === context.assetCategory
            : !metric.space_type && !metric.asset_category),
    ) ?? null
  );
}

function BenchmarkRangeCard({
  metric,
  ownMetrics,
  peerMetrics,
  context,
}: {
  metric: MetricDef;
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
  context?: MetricContext;
}) {
  const orgValue = findOwnValue(ownMetrics, metric.code, context);
  const peer = findPeerMetric(peerMetrics, metric.code, context);

  if (!peer) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{metric.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{BENCHMARK_UNAVAILABLE_MESSAGE}</p>
          {orgValue != null && (
            <p className="mt-3 text-sm">
              Your organization:{" "}
              <span className="font-semibold">{formatBenchmarkValue(orgValue, metric.kind)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const p25 = peer.percentile_25;
  const p75 = peer.percentile_75;
  const median = peer.median;
  const rangeMin = p25 ?? peer.average ?? 0;
  const rangeMax = p75 ?? peer.average ?? rangeMin;
  const span = rangeMax - rangeMin || 1;
  const orgPosition =
    orgValue != null ? Math.min(100, Math.max(0, ((orgValue - rangeMin) / span) * 100)) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{metric.label}</CardTitle>
        <CardDescription>Your organization compared with anonymous peer range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div>
            <p>25th percentile</p>
            <p className="font-medium text-foreground">{formatBenchmarkValue(p25, metric.kind)}</p>
          </div>
          <div className="text-center">
            <p>Median</p>
            <p className="font-medium text-foreground">{formatBenchmarkValue(median, metric.kind)}</p>
          </div>
          <div className="text-right">
            <p>75th percentile</p>
            <p className="font-medium text-foreground">{formatBenchmarkValue(p75, metric.kind)}</p>
          </div>
        </div>
        <div className="relative h-3 rounded-full bg-muted">
          <div className="absolute inset-y-0 rounded-full bg-primary/20" style={{ left: "0%", right: "0%" }} />
          {orgPosition != null && (
            <div
              className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-primary"
              style={{ left: `${orgPosition}%` }}
              title={`Your organization: ${formatBenchmarkValue(orgValue, metric.kind)}`}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Peer average</span>
          <span className="font-medium">{formatBenchmarkValue(peer.average, metric.kind)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your organization</span>
          <span className="font-semibold text-primary">{formatBenchmarkValue(orgValue, metric.kind)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ContextBenchmarkSection({
  title,
  description,
  contextLabel,
  contextOptions,
  selectedContext,
  onContextChange,
  metrics,
  ownMetrics,
  peerMetrics,
  contextKey,
}: {
  title: string;
  description: string;
  contextLabel: string;
  contextOptions: string[];
  selectedContext: string;
  onContextChange: (value: string) => void;
  metrics: MetricDef[];
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
  contextKey: "spaceType" | "assetCategory";
}) {
  const context =
    contextKey === "spaceType"
      ? { spaceType: selectedContext }
      : { assetCategory: selectedContext };

  if (contextOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No {contextLabel.toLowerCase()} data in your portfolio yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="sr-only" htmlFor={`benchmark-${contextKey}`}>
            {contextLabel}
          </label>
          <select
            id={`benchmark-${contextKey}`}
            value={selectedContext}
            onChange={(event) => onContextChange(event.target.value)}
            className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {contextOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <BenchmarkRangeCard
            key={`${selectedContext}-${metric.code}`}
            metric={metric}
            ownMetrics={ownMetrics}
            peerMetrics={peerMetrics}
            context={context}
          />
        ))}
      </div>
    </div>
  );
}

export function BenchmarkDashboard({
  industryType,
  participating,
  ownMetrics,
  peerMetrics,
  spaceTypes,
  assetCategories,
}: BenchmarkDashboardProps) {
  const [tab, setTab] = useState("overview");
  const [spaceType, setSpaceType] = useState(spaceTypes[0] ?? "");
  const [assetCategory, setAssetCategory] = useState(assetCategories[0] ?? "");
  const industryLabel =
    INDUSTRY_TYPE_LABELS[industryType as IndustryTypeCode] ?? industryType.replace("_", " ");

  const filteredPeerMetrics = useMemo(
    () => peerMetrics.filter((metric) => metric.industry_type === industryType),
    [peerMetrics, industryType],
  );

  if (!participating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{industryLabel} Benchmark</CardTitle>
          <CardDescription>
            Benchmark participation is disabled for your organization. Enable it in Settings to
            compare with industry peers (reciprocal access applies).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{industryLabel} Benchmark</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare your lifecycle performance with anonymized, aggregated industry data.
        </p>
      </div>

      {filteredPeerMetrics.length === 0 && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">{BENCHMARK_UNAVAILABLE_MESSAGE}</p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {[
            ["overview", "Overview"],
            ["lifecycle", "Lifecycle Health"],
            ["financial", "Financial"],
            ["planning", "Planning"],
            ["space-types", "Space Types"],
            ["equipment", "Equipment"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="cursor-pointer">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {LIFECYCLE_METRICS.slice(0, 4).map((metric) => (
              <BenchmarkRangeCard
                key={metric.code}
                metric={metric}
                ownMetrics={ownMetrics}
                peerMetrics={filteredPeerMetrics}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {LIFECYCLE_METRICS.map((metric) => (
              <BenchmarkRangeCard
                key={metric.code}
                metric={metric}
                ownMetrics={ownMetrics}
                peerMetrics={filteredPeerMetrics}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {FINANCIAL_METRICS.map((metric) => (
              <BenchmarkRangeCard
                key={metric.code}
                metric={metric}
                ownMetrics={ownMetrics}
                peerMetrics={filteredPeerMetrics}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {PLANNING_METRICS.map((metric) => (
              <BenchmarkRangeCard
                key={metric.code}
                metric={metric}
                ownMetrics={ownMetrics}
                peerMetrics={filteredPeerMetrics}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="space-types" className="mt-4">
          <ContextBenchmarkSection
            title="Space Type Benchmarks"
            description="Compare lifecycle metrics for a specific Space Type against industry peers."
            contextLabel="Space Type"
            contextOptions={spaceTypes}
            selectedContext={spaceType || spaceTypes[0] || ""}
            onContextChange={setSpaceType}
            metrics={SPACE_TYPE_METRICS}
            ownMetrics={ownMetrics}
            peerMetrics={filteredPeerMetrics}
            contextKey="spaceType"
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <ContextBenchmarkSection
            title="Equipment Category Benchmarks"
            description="Compare asset category metrics against industry peers within your cohort."
            contextLabel="Asset Category"
            contextOptions={assetCategories}
            selectedContext={assetCategory || assetCategories[0] || ""}
            onContextChange={setAssetCategory}
            metrics={EQUIPMENT_METRICS}
            ownMetrics={ownMetrics}
            peerMetrics={filteredPeerMetrics}
            contextKey="assetCategory"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
