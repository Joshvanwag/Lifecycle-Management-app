"use client";

import { useMemo, useState } from "react";
import {
  INDUSTRY_TYPE_LABELS,
  type BenchmarkMetricPublic,
  type IndustryTypeCode,
} from "@/lib/benchmark/constants";
import type { OwnBenchmarkMetric } from "@/lib/benchmark/own-metrics";
import { BenchmarkRange } from "@/components/benchmark/benchmark-range";
import { FilterCombobox } from "@/components/design-system/filter-combobox";
import {
  BENCHMARK_COMPARE_SERIES,
  GroupedBarChart,
} from "@/components/charts/grouped-bar-chart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";

interface BenchmarkDashboardProps {
  industryType: string;
  participating: boolean;
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
  spaceTypes: string[];
  assetCategories: string[];
}

interface BenchmarkFilters {
  spaceType: string[];
  assetCategory: string[];
}

const emptyFilters: BenchmarkFilters = { spaceType: [], assetCategory: [] };

function formatValue(value: number | null | undefined, kind: OwnBenchmarkMetric["kind"]) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (kind === "percentage") return `${value.toFixed(1)}%`;
  if (kind === "years") return `${value.toFixed(1)} yrs`;
  if (kind === "count") return value.toFixed(1);
  return formatCurrency(value);
}

const FEATURED = [
  "avg_space_age_years",
  "portfolio_pct_overdue",
  "avg_replacement_cost_per_space",
  "pct_lifecycle_need_planned",
] as const;

const LIFECYCLE_CODES = [
  { code: "portfolio_pct_overdue", label: "Overdue %" },
  { code: "portfolio_pct_due_this_year", label: "Due This Year %" },
  { code: "portfolio_pct_due_1_3_years", label: "Due 1–3 Years %" },
  { code: "portfolio_pct_due_4_7_years", label: "Due 4–7 Years %" },
  { code: "portfolio_pct_due_beyond_7_years", label: "Due Beyond 7 Years %" },
] as const;

const PLANNING_CODES = [
  { code: "pct_lifecycle_need_planned", label: "Need With Plan %" },
  { code: "pct_scheduled", label: "Scheduled %" },
  { code: "pct_deferred", label: "Deferred %" },
  { code: "pct_overdue_scheduled", label: "Overdue Scheduled %" },
  { code: "pct_upcoming_with_planned_replacement", label: "Upcoming With Plan %" },
] as const;

function findPeer(
  peers: BenchmarkMetricPublic[],
  code: string,
  spaceType?: string | null,
  assetCategory?: string | null,
) {
  return peers.find(
    (metric) =>
      metric.metric_code === code &&
      (spaceType ? metric.space_type === spaceType : !metric.space_type) &&
      (assetCategory ? metric.asset_category === assetCategory : !metric.asset_category),
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
  const industryLabel = INDUSTRY_TYPE_LABELS[industryType as IndustryTypeCode] ?? industryType;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<BenchmarkFilters>(emptyFilters);
  const [applied, setApplied] = useState<BenchmarkFilters>(emptyFilters);

  const orgPeers = useMemo(
    () => peerMetrics.filter((metric) => !metric.space_type && !metric.asset_category),
    [peerMetrics],
  );
  const ownByCode = useMemo(
    () => new Map(ownMetrics.filter((metric) => !metric.spaceType && !metric.assetCategory).map((metric) => [metric.code, metric])),
    [ownMetrics],
  );
  const peersUnavailable = orgPeers.length === 0;

  const filteredSpaceTypes = applied.spaceType.length ? applied.spaceType : spaceTypes;
  const filteredCategories = applied.assetCategory.length ? applied.assetCategory : assetCategories;

  if (!participating) {
    return (
      <p className="text-sm text-muted-foreground">
        Industry benchmarking is disabled for this organization. Enable it in Settings to contribute
        anonymized metrics and view peer results.
      </p>
    );
  }

  const toGrouped = (rows: ReadonlyArray<{ code: string; label: string }>) =>
    rows.map((row, index) => {
      const own = ownByCode.get(row.code);
      const peer = findPeer(orgPeers, row.code);
      return {
        year: index + 1,
        recommended: own?.value ?? 0,
        planned: peer?.median ?? 0,
        gap: 0,
        label: row.label,
      };
    });

  const applyFilters = () => {
    setApplied(draft);
    setFiltersOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{industryLabel} Benchmark</p>
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Benchmark Filters
        </Button>
      </div>

      {(applied.spaceType.length > 0 || applied.assetCategory.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {[...applied.spaceType, ...applied.assetCategory].map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1">
              {value}
              <button
                type="button"
                className="cursor-pointer rounded-sm p-0.5"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  setApplied({
                    spaceType: applied.spaceType.filter((item) => item !== value),
                    assetCategory: applied.assetCategory.filter((item) => item !== value),
                  })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setApplied(emptyFilters);
              setDraft(emptyFilters);
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {peersUnavailable && (
        <p className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Industry benchmark data is still building. Metrics appear automatically once sufficient
          anonymized peer data is available.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {FEATURED.map((code) => {
          const own = ownByCode.get(code);
          const peer = findPeer(orgPeers, code);
          if (!own) return null;
          return (
            <Card key={code}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{own.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Your Organization</p>
                  <p className="text-xl font-semibold">{formatValue(own.value, own.kind)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Industry Median</p>
                  <p className="text-sm font-medium">
                    {peer ? formatValue(peer.median, own.kind) : "Unavailable"}
                  </p>
                </div>
                {peer && (
                  <BenchmarkRange
                    ownValue={own.value}
                    p25={peer.percentile_25}
                    median={peer.median}
                    p75={peer.percentile_75}
                    format={(value) => formatValue(value, own.kind)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Lifecycle Health</h2>
        <GroupedBarChart
          title="Due timing vs industry median"
          description="Your Organization compared with Industry Median"
          data={toGrouped(LIFECYCLE_CODES)}
          series={BENCHMARK_COMPARE_SERIES}
          valueKind="percent"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Financial Comparison</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {["avg_replacement_cost_per_space", "five_year_forecast_per_space", "avg_cost_per_asset"].map(
            (code) => {
              const own = ownByCode.get(code);
              const peer = findPeer(orgPeers, code);
              if (!own) return null;
              return (
                <Card key={code}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{own.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">Your Organization</p>
                    <p className="text-lg font-semibold">{formatValue(own.value, own.kind)}</p>
                    <p className="text-xs text-muted-foreground">Industry Median</p>
                    <p className="text-sm">{peer ? formatValue(peer.median, own.kind) : "Unavailable"}</p>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Planning Maturity</h2>
        <GroupedBarChart
          title="Planning coverage vs industry median"
          description="Your Organization compared with Industry Median"
          data={toGrouped(PLANNING_CODES)}
          series={BENCHMARK_COMPARE_SERIES}
          valueKind="percent"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Equipment Category Benchmark</h2>
        <ContextBenchmarkTable
          rows={filteredCategories.map((category) => ({
            name: category,
            cells: [
              metricPair(ownMetrics, peerMetrics, "category_avg_lifecycle_years", "years", undefined, category),
              metricPair(ownMetrics, peerMetrics, "category_avg_replacement_cost", "currency", undefined, category),
              metricPair(ownMetrics, peerMetrics, "category_overdue_pct", "percentage", undefined, category),
            ],
          }))}
          columns={["Lifecycle", "Replacement Cost", "Overdue %"]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Space Type Benchmark</h2>
        <ContextBenchmarkTable
          rows={filteredSpaceTypes.map((spaceType) => ({
            name: spaceType,
            cells: [
              metricPair(ownMetrics, peerMetrics, "space_type_avg_replacement_cost", "currency", spaceType),
              metricPair(ownMetrics, peerMetrics, "space_type_avg_lifecycle_years", "years", spaceType),
              metricPair(ownMetrics, peerMetrics, "space_type_overdue_pct", "percentage", spaceType),
              metricPair(
                ownMetrics,
                peerMetrics,
                "space_type_planned_refresh_coverage_pct",
                "percentage",
                spaceType,
              ),
            ],
          }))}
          columns={["Avg Replacement", "Lifecycle", "Overdue %", "Planned Coverage"]}
        />
      </section>

      <Sheet
        open={filtersOpen}
        onOpenChange={(open) => {
          setFiltersOpen(open);
          if (open) setDraft(applied);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Benchmark Filters</SheetTitle>
            <SheetDescription>
              Adjust filters, then click Apply Filters. The peer industry cannot be changed here.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <FilterCombobox
              label="Space Type"
              values={spaceTypes}
              selected={draft.spaceType}
              onChange={(spaceType) => setDraft({ ...draft, spaceType })}
            />
            <FilterCombobox
              label="Asset Category"
              values={assetCategories}
              selected={draft.assetCategory}
              onChange={(assetCategory) => setDraft({ ...draft, assetCategory })}
            />
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDraft(emptyFilters)}>
              Clear
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function metricPair(
  ownMetrics: OwnBenchmarkMetric[],
  peers: BenchmarkMetricPublic[],
  code: string,
  kind: OwnBenchmarkMetric["kind"],
  spaceType?: string,
  assetCategory?: string,
) {
  const own = ownMetrics.find(
    (metric) =>
      metric.code === code &&
      (spaceType ? metric.spaceType === spaceType : true) &&
      (assetCategory ? metric.assetCategory === assetCategory : true),
  );
  const peer = findPeer(peers, code, spaceType, assetCategory);
  return {
    own: formatValue(own?.value, kind),
    peer: peer ? formatValue(peer.median, kind) : "Unavailable",
  };
}

function ContextBenchmarkTable({
  rows,
  columns,
}: {
  rows: Array<{ name: string; cells: Array<{ own: string; peer: string }> }>;
  columns: string[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No qualifying rows for the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              {row.cells.map((cell, index) => (
                <td key={`${row.name}-${index}`} className="px-3 py-2">
                  <p>{cell.own}</p>
                  <p className="text-xs text-muted-foreground">Industry {cell.peer}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
