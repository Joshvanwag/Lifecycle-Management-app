"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { RankedListChart } from "@/components/charts/ranked-list-chart";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
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
  formatStatusLabel,
} from "@/lib/data/analytics";
import { hasEmptyPortfolioCosts } from "@/lib/data/portfolio-counts";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Asset, LifecycleStatus, PlanningStatus, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SpaceFiltersState>(emptySpaceFilters);
  const [lifecycleDrill, setLifecycleDrill] = useState<string | null>(null);
  const [planningDrill, setPlanningDrill] = useState<string | null>(null);
  const [yearDrill, setYearDrill] = useState<string | null>(null);
  const [spaceTypeDrill, setSpaceTypeDrill] = useState<string | null>(null);
  const [categoryDrill, setCategoryDrill] = useState<string | null>(null);

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

  const replacementChartData = useMemo(() => {
    const rows = yearDrill
      ? replacementByYear.filter((row) => String(row.year) === yearDrill)
      : replacementByYear;
    return rows.map((row) => ({ name: String(row.year), value: row.amount }));
  }, [replacementByYear, yearDrill]);

  const groupedChartData = useMemo(() => {
    if (!yearDrill) return recommendedVsPlanned;
    const year = Number(yearDrill);
    return recommendedVsPlanned.filter((row) => row.year === year);
  }, [recommendedVsPlanned, yearDrill]);

  const spaceTypeChartData = useMemo(() => {
    const rows = spaceTypeDrill
      ? spacesByType.filter((row) => row.name === spaceTypeDrill)
      : spacesByType;
    return rows.map((row) => ({ name: row.name, value: row.value }));
  }, [spacesByType, spaceTypeDrill]);

  const categoryChartData = useMemo(() => {
    const rows = categoryDrill
      ? topCategories.filter((row) => row.name === categoryDrill)
      : topCategories;
    return rows.map((row) => ({ name: row.name, value: row.amount }));
  }, [topCategories, categoryDrill]);

  const clearLifecycleDrill = () => {
    setLifecycleDrill(null);
    setAppliedFilters({ ...appliedFilters, lifecycleStatus: [] });
  };

  const clearPlanningDrill = () => {
    setPlanningDrill(null);
    setAppliedFilters({ ...appliedFilters, planningStatus: [] });
  };

  return (
    <div className="space-y-6">
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Spaces..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
        appliedFilters={appliedFilters}
        onFiltersChange={setAppliedFilters}
        organizationOptions={organizationOptions}
        filteredCount={filteredSpaces.length}
        totalCount={spaces.length}
      />

      {emptyCosts && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          These Spaces have inventory, but replacement costs are still $0. Financial metrics stay
          empty until Space lump-sum costs are entered.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Spaces" value={metrics.spaceCount} icon={Building2} />
        <KpiCard label="Assets" value={metrics.assetCount} icon={Package} />
        <KpiCard
          label="Portfolio Value"
          value={formatCurrency(metrics.totalPortfolioValue)}
          icon={DollarSign}
        />
        <KpiCard
          label="5-Year Need"
          value={formatCurrency(metrics.fiveYearNeed)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Due This Year"
          value={formatCurrency(metrics.dueThisYear)}
          icon={CalendarClock}
        />
        <KpiCard label="Due Spaces" value={metrics.dueSpaces} icon={Clock3} />
        <KpiCard
          label="Overdue"
          value={formatCurrency(metrics.overdueAmount)}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Planned"
          value={formatCurrency(metrics.plannedAmount)}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart
          title="Lifecycle Distribution"
          description="Spaces by upcoming, due, and overdue refresh timing"
          data={lifecycleDistribution}
          onSegmentClick={(name) => {
            setLifecycleDrill(name);
            setAppliedFilters({
              ...appliedFilters,
              lifecycleStatus: [name as LifecycleStatus],
            });
          }}
          selectedName={lifecycleDrill}
          drillLabel={lifecycleDrill ? formatStatusLabel(lifecycleDrill) : undefined}
          onReset={clearLifecycleDrill}
        />
        <LabeledBarChart
          title="Replacement Need by Year"
          description="Future replacement cost with visible dollar labels"
          data={replacementChartData}
          colorScheme={{ type: "years", years: replacementByYear.map((row) => row.year) }}
          onBarClick={(name) => setYearDrill(name)}
          selectedName={yearDrill}
          drillLabel={yearDrill ? `Year ${yearDrill}` : undefined}
          onReset={() => setYearDrill(null)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupedBarChart
          title="Recommended vs Planned"
          description="Recommended lifecycle need compared with intentionally planned work"
          data={groupedChartData}
          onBarClick={(year) => setYearDrill(String(year))}
          selectedYear={yearDrill ? Number(yearDrill) : null}
          drillLabel={yearDrill ? `Year ${yearDrill}` : undefined}
          onReset={() => setYearDrill(null)}
        />
        <RankedListChart
          title="Portfolio by Space Type"
          description="Distribution of Spaces across types"
          data={spaceTypeChartData}
          valueFormatter={(value) => String(value)}
          onItemClick={setSpaceTypeDrill}
          selectedName={spaceTypeDrill}
          drillLabel={spaceTypeDrill ?? undefined}
          onReset={() => setSpaceTypeDrill(null)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart
          title="Planning Status"
          description="Unplanned, scheduled, deferred, and completed lifecycle planning"
          data={planningDistribution}
          colorType="planningStatus"
          onSegmentClick={(name) => {
            setPlanningDrill(name);
            setAppliedFilters({
              ...appliedFilters,
              planningStatus: [name as PlanningStatus],
            });
          }}
          selectedName={planningDrill}
          drillLabel={planningDrill ? formatStatusLabel(planningDrill) : undefined}
          onReset={clearPlanningDrill}
        />
        <RankedListChart
          title="Top Future Cost Categories"
          description="Asset categories driving the largest future lifecycle costs"
          data={categoryChartData}
          valueFormatter={(value) => formatCurrency(value)}
          onItemClick={setCategoryDrill}
          selectedName={categoryDrill}
          drillLabel={categoryDrill ?? undefined}
          onReset={() => setCategoryDrill(null)}
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
