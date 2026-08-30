"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Filter,
  Package,
  Search,
  TrendingUp,
} from "lucide-react";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ActiveFilterChips,
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import {
  computeExtendedMetrics,
  computeLifecycleDistribution,
  computePlanningDistribution,
  computeReplacementByYear,
  computeSpacesByType,
  computeTopFutureCostCategories,
  computeYearComparison,
} from "@/lib/data/analytics";
import { hasEmptyPortfolioCosts } from "@/lib/data/portfolio-counts";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Asset, LifecycleStatus, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OverviewDashboardProps {
  spaces: Space[];
  assets?: Asset[];
  organizationOptions?: { id: string; name: string }[];
}

export function OverviewDashboard({
  spaces,
  assets = [],
  organizationOptions = [],
}: OverviewDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(
    () => buildSpaceFilterOptions(spaces, organizationOptions),
    [spaces, organizationOptions],
  );

  const filteredSpaces = useMemo(
    () => filterSpaces(spaces, search, appliedFilters),
    [spaces, search, appliedFilters],
  );

  const filteredAssets = useMemo(() => {
    const spaceIds = new Set(filteredSpaces.map((space) => space.id));
    return assets.filter((asset) => spaceIds.has(asset.spaceId));
  }, [assets, filteredSpaces]);

  const metrics = useMemo(() => computeExtendedMetrics(filteredSpaces), [filteredSpaces]);
  const lifecycleDistribution = useMemo(
    () => computeLifecycleDistribution(filteredSpaces),
    [filteredSpaces],
  );
  const planningDistribution = useMemo(
    () => computePlanningDistribution(filteredSpaces),
    [filteredSpaces],
  );
  const replacementByYear = useMemo(
    () => computeReplacementByYear(filteredSpaces, 10),
    [filteredSpaces],
  );
  const recommendedVsPlanned = useMemo(
    () => computeYearComparison(filteredSpaces, 5),
    [filteredSpaces],
  );
  const spacesByType = useMemo(() => computeSpacesByType(filteredSpaces), [filteredSpaces]);
  const topCategories = useMemo(
    () => computeTopFutureCostCategories(filteredAssets, filteredSpaces),
    [filteredAssets, filteredSpaces],
  );
  const emptyCosts = useMemo(() => hasEmptyPortfolioCosts(filteredSpaces), [filteredSpaces]);
  const activeFilterCount = countActiveFilters(appliedFilters);

  const navigateWithLifecycle = (status: string) => {
    setAppliedFilters({ ...emptySpaceFilters, lifecycleStatus: [status as LifecycleStatus] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Spaces..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <ActiveFilterChips
        filters={appliedFilters}
        onFiltersChange={setAppliedFilters}
        organizationOptions={organizationOptions}
      />

      {filteredSpaces.length !== spaces.length && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredSpaces.length} of {spaces.length} Spaces
        </p>
      )}

      {emptyCosts && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          These Spaces have inventory, but replacement costs are still $0. Financial metrics stay
          empty until Space lump-sum costs are entered.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Spaces" value={metrics.spaceCount} icon={Building2} href="/spaces" />
        <KpiCard label="Assets" value={metrics.assetCount} icon={Package} href="/assets" />
        <KpiCard
          label="Current Portfolio Value"
          value={formatCurrency(metrics.totalPortfolioValue)}
          icon={DollarSign}
        />
        <KpiCard
          label="5-Year Replacement Need"
          value={formatCurrency(metrics.fiveYearNeed)}
          icon={TrendingUp}
          href="/forecast"
        />
        <KpiCard
          label="Due This Year"
          value={formatCurrency(metrics.dueThisYear)}
          icon={CalendarClock}
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(metrics.overdueAmount)}
          icon={AlertTriangle}
          href="/spaces"
        />
        <KpiCard
          label="Planned"
          value={formatCurrency(metrics.plannedAmount)}
          icon={CheckCircle2}
          href="/forecast"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart
          title="Lifecycle Distribution"
          description="Spaces by upcoming, due, and overdue refresh timing"
          data={lifecycleDistribution}
          onSegmentClick={navigateWithLifecycle}
        />
        <LabeledBarChart
          title="Replacement Need by Year"
          description="Future replacement cost with visible dollar labels"
          data={replacementByYear.map((row) => ({
            name: String(row.year),
            value: row.amount,
          }))}
          colorScheme={{ type: "years", years: replacementByYear.map((row) => row.year) }}
          onBarClick={(name) => router.push(`/forecast?year=${name}`)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupedBarChart
          title="Recommended vs Planned"
          description="Recommended lifecycle need compared with intentionally planned work"
          data={recommendedVsPlanned}
        />
        <LabeledBarChart
          title="Portfolio by Space Type"
          description="Distribution of Spaces across types"
          data={spacesByType.map((row) => ({ name: row.name, value: row.value }))}
          valueFormatter={(value) => String(value)}
          labelFormatter={(value) => String(value)}
          layout="horizontal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart
          title="Planning Status"
          description="Unplanned, scheduled, deferred, and completed lifecycle planning"
          data={planningDistribution}
          colorType="planningStatus"
        />
        <LabeledBarChart
          title="Top Future Cost Categories"
          description="Asset categories driving the largest future lifecycle costs"
          data={topCategories.map((row) => ({ name: row.name, value: row.amount }))}
          layout="horizontal"
        />
      </div>

      <SpaceFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        appliedFilters={appliedFilters}
        onApplyFilters={setAppliedFilters}
        options={filterOptions}
      />
    </div>
  );
}
