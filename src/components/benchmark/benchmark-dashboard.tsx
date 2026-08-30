"use client";

import { useMemo, useState } from "react";
import { BENCHMARK_UNAVAILABLE_MESSAGE, findOrgValue, findPeerMetric, formatBenchmarkValue } from "@/lib/data/benchmark";
import type { OrganizationBenchmarkValue } from "@/lib/data/benchmark";
import type { BenchmarkMetricPublic } from "@/lib/benchmark/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BenchmarkDashboardProps {
  industryLabel: string;
  canAccess: boolean;
  optedOut: boolean;
  orgValues: OrganizationBenchmarkValue[];
  peerMetrics: BenchmarkMetricPublic[];
}

interface MetricDef {
  code: string;
  label: string;
  kind: "percentage" | "currency" | "years" | "count";
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
  { code: "avg_cost_per_asset", label: "Cost per Asset", kind: "currency" },
  { code: "portfolio_pct_value_overdue", label: "Portfolio Value Overdue %", kind: "percentage" },
];

const PLANNING_METRICS: MetricDef[] = [
  { code: "pct_lifecycle_need_planned", label: "Lifecycle Need With Plan %", kind: "percentage" },
  { code: "pct_scheduled", label: "Scheduled %", kind: "percentage" },
  { code: "pct_deferred", label: "Deferred %", kind: "percentage" },
  { code: "pct_overdue_scheduled", label: "Overdue but Scheduled %", kind: "percentage" },
  { code: "pct_upcoming_with_planned_replacement", label: "Upcoming Lifecycle Need With Plan %", kind: "percentage" },
];

function BenchmarkRangeCard({
  metric,
  orgValues,
  peerMetrics,
}: {
  metric: MetricDef;
  orgValues: OrganizationBenchmarkValue[];
  peerMetrics: BenchmarkMetricPublic[];
}) {
  const orgValue = findOrgValue(orgValues, metric.code);
  const peer = findPeerMetric(peerMetrics, metric.code);

  if (!peer) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{metric.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{BENCHMARK_UNAVAILABLE_MESSAGE}</p>
        </CardContent>
      </Card>
    );
  }

  const p25 = peer.percentile_25;
  const p75 = peer.percentile_75;
  const median = peer.median;
  const org = orgValue;

  const rangeMin = p25 ?? peer.average ?? 0;
  const rangeMax = p75 ?? peer.average ?? rangeMin;
  const span = rangeMax - rangeMin || 1;
  const orgPosition =
    org != null ? Math.min(100, Math.max(0, ((org - rangeMin) / span) * 100)) : null;

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
          <div
            className="absolute inset-y-0 rounded-full bg-primary/20"
            style={{ left: "0%", right: "0%" }}
          />
          {orgPosition != null && (
            <div
              className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-primary"
              style={{ left: `${orgPosition}%` }}
              title={`Your organization: ${formatBenchmarkValue(org, metric.kind)}`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Peer average</span>
          <span className="font-medium">{formatBenchmarkValue(peer.average, metric.kind)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your organization</span>
          <span className="font-semibold text-primary">
            {formatBenchmarkValue(org, metric.kind)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ContextMetricSection({
  metrics,
  orgValues,
  peerMetrics,
  contextKey,
  contextValues,
}: {
  metrics: MetricDef[];
  orgValues: OrganizationBenchmarkValue[];
  peerMetrics: BenchmarkMetricPublic[];
  contextKey: "spaceType" | "assetCategory";
  contextValues: string[];
}) {
  if (contextValues.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No {contextKey === "spaceType" ? "Space types" : "asset categories"} available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {contextValues.map((contextValue) => (
        <div key={contextValue} className="space-y-3">
          <h3 className="text-sm font-semibold">{contextValue}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => (
              <BenchmarkRangeCard
                key={`${contextValue}-${metric.code}`}
                metric={metric}
                orgValues={orgValues.filter((row) =>
                  contextKey === "spaceType"
                    ? row.space_type === contextValue
                    : row.asset_category === contextValue,
                )}
                peerMetrics={peerMetrics.filter((row) =>
                  contextKey === "spaceType"
                    ? row.space_type === contextValue
                    : row.asset_category === contextValue,
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BenchmarkDashboard({
  industryLabel,
  canAccess,
  optedOut,
  orgValues,
  peerMetrics,
}: BenchmarkDashboardProps) {
  const [tab, setTab] = useState("overview");

  const spaceTypes = useMemo(
    () =>
      [...new Set(orgValues.map((row) => row.space_type).filter(Boolean) as string[])].sort(),
    [orgValues],
  );
  const categories = useMemo(
    () =>
      [...new Set(orgValues.map((row) => row.asset_category).filter(Boolean) as string[])].sort(),
    [orgValues],
  );

  if (optedOut) {
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

  if (!canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{industryLabel} Benchmark</CardTitle>
          <CardDescription>{BENCHMARK_UNAVAILABLE_MESSAGE}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const equipmentMetrics: MetricDef[] = [
    { code: "category_avg_lifecycle_years", label: "Average Lifecycle", kind: "years" },
    { code: "category_median_lifecycle_years", label: "Median Lifecycle", kind: "years" },
    { code: "category_avg_replacement_cost", label: "Average Replacement Cost", kind: "currency" },
    { code: "category_median_replacement_cost", label: "Median Replacement Cost", kind: "currency" },
    { code: "category_overdue_pct", label: "Overdue %", kind: "percentage" },
    { code: "category_forecast_cost", label: "Forecast Cost", kind: "currency" },
  ];

  const spaceTypeMetrics: MetricDef[] = [
    { code: "space_type_avg_lifecycle_years", label: "Average Lifecycle", kind: "years" },
    { code: "space_type_overdue_pct", label: "Overdue %", kind: "percentage" },
    { code: "space_type_due_pct", label: "Due %", kind: "percentage" },
    { code: "space_type_avg_asset_count", label: "Average Asset Count per Space", kind: "count" },
    { code: "space_type_planned_refresh_coverage_pct", label: "Planned Refresh Coverage", kind: "percentage" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{industryLabel} Benchmark</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare your lifecycle performance with anonymized, aggregated industry data.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {["overview", "lifecycle", "financial", "planning", "equipment", "space-types"].map(
            (value) => (
              <TabsTrigger key={value} value={value} className="cursor-pointer capitalize">
                {value.replace("-", " ")}
              </TabsTrigger>
            ),
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {LIFECYCLE_METRICS.slice(0, 4).map((metric) => (
              <BenchmarkRangeCard
                key={metric.code}
                metric={metric}
                orgValues={orgValues}
                peerMetrics={peerMetrics}
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
                orgValues={orgValues}
                peerMetrics={peerMetrics}
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
                orgValues={orgValues}
                peerMetrics={peerMetrics}
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
                orgValues={orgValues}
                peerMetrics={peerMetrics}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <ContextMetricSection
            metrics={equipmentMetrics}
            orgValues={orgValues}
            peerMetrics={peerMetrics}
            contextKey="assetCategory"
            contextValues={categories.slice(0, 12)}
          />
        </TabsContent>

        <TabsContent value="space-types" className="mt-4">
          <ContextMetricSection
            metrics={spaceTypeMetrics}
            orgValues={orgValues}
            peerMetrics={peerMetrics}
            contextKey="spaceType"
            contextValues={spaceTypes.slice(0, 12)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
