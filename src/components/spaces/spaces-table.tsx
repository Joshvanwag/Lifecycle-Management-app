"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ActiveFilterChips,
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import {
  computeExtendedMetrics,
  computeLifecycleDistribution,
  computeSpacesByType,
} from "@/lib/data/analytics";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SpacesTableProps {
  spaces: Space[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export function SpacesTable({
  spaces,
  totalCount,
  page = 1,
  pageSize = 50,
}: SpacesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(() => buildSpaceFilterOptions(spaces), [spaces]);

  const filteredSpaces = useMemo(
    () => filterSpaces(spaces, search, appliedFilters),
    [spaces, search, appliedFilters],
  );

  const summary = useMemo(() => computeExtendedMetrics(filteredSpaces), [filteredSpaces]);
  const lifecycleDistribution = useMemo(
    () => computeLifecycleDistribution(filteredSpaces),
    [filteredSpaces],
  );
  const spacesByType = useMemo(() => computeSpacesByType(filteredSpaces), [filteredSpaces]);

  const activeFilterCount = countActiveFilters(appliedFilters);
  const total = totalCount ?? spaces.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Spaces" value={summary.spaceCount} />
        <KpiCard label="Current Portfolio Value" value={formatCurrency(summary.totalPortfolioValue)} />
        <KpiCard label="5-Year Replacement Need" value={formatCurrency(summary.fiveYearNeed)} />
        <KpiCard label="Overdue Spaces" value={summary.overdueSpaces} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart
          title="Spaces by Lifecycle Status"
          description="Upcoming, due, and overdue counts with percentages"
          data={lifecycleDistribution}
        />
        <LabeledBarChart
          title="Spaces by Type"
          description="Space type distribution"
          data={spacesByType.slice(0, 8).map((row) => ({ name: row.name, value: row.value }))}
          valueFormatter={(v) => String(v)}
          labelFormatter={(v) => String(v)}
          layout="horizontal"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      <ActiveFilterChips filters={appliedFilters} onFiltersChange={setAppliedFilters} />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Assets</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead className="text-right">Recommended Year</TableHead>
              <TableHead>Planning</TableHead>
              <TableHead className="text-right">Planned Year</TableHead>
              <TableHead className="text-right">Forecast</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No Spaces match your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredSpaces.map((space) => (
                <TableRow
                  key={space.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/spaces/${space.id}`)}
                  data-clickable="true"
                >
                  <TableCell>
                    <Link
                      href={`/spaces/${space.id}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {space.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {space.locationLabel}
                  </TableCell>
                  <TableCell>{space.spaceType}</TableCell>
                  <TableCell className="text-right">{space.assetCount}</TableCell>
                  <TableCell>
                    <LifecycleStatusBadge status={space.lifecycleStatus} />
                  </TableCell>
                  <TableCell className="text-right">{space.recommendedRefreshYear}</TableCell>
                  <TableCell>
                    <PlanningStatusBadge status={space.planningStatus} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {space.plannedRefreshYear ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(space.forecastAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {search || activeFilterCount > 0
            ? `Showing ${filteredSpaces.length} filtered on this page (${rangeStart}–${rangeEnd} of ${total} Spaces)`
            : `Showing ${rangeStart}–${rangeEnd} of ${total} Spaces`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={page === 2 ? "/spaces" : `/spaces?page=${page - 1}`}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/spaces?page=${page + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
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
