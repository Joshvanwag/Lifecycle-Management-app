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
}

type MetricKind = "percentage" | "currency" | "years" | "count";

interface MetricDef {
  code: string;
  label: string;
  kind: MetricKind;
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

function formatBenchmarkValue(value: number | null, kind: MetricKind): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (kind === "percentage") return `${Math.round(value)}%`;
  if (kind === "years") return `${value.toFixed(1)} yrs`;
  if (kind === "currency") return formatCurrency(value);
  return String(Math.round(value));
}

function findOwnValue(ownMetrics: OwnBenchmarkMetric[], code: string): number | null {
  return ownMetrics.find((metric) => metric.code === code)?.value ?? null;
}

function findPeerMetric(peerMetrics: BenchmarkMetricPublic[], code: string): BenchmarkMetricPublic | null {
  return peerMetrics.find((metric) => metric.metric_code === code && !metric.space_type && !metric.asset_category) ?? null;
}

function BenchmarkRangeCard({
  metric,
  ownMetrics,
  peerMetrics,
}: {
  metric: MetricDef;
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
}) {
  const orgValue = findOwnValue(ownMetrics, metric.code);
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

export function BenchmarkDashboard({
  industryType,
  participating,
  ownMetrics,
  peerMetrics,
}: BenchmarkDashboardProps) {
  const [tab, setTab] = useState("overview");
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
          {["overview", "lifecycle", "financial", "planning"].map((value) => (
            <TabsTrigger key={value} value={value} className="cursor-pointer capitalize">
              {value.replace("-", " ")}
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
      </Tabs>
    </div>
  );
}
