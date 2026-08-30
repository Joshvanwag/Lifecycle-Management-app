"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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
}

export function SpacesTable({ spaces }: SpacesTableProps) {
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Spaces" value={summary.spaceCount} />
        <KpiCard label="Current Portfolio Value" value={formatCurrency(summary.totalPortfolioValue)} />
        <KpiCard label="5-Year Replacement Need" value={formatCurrency(summary.fiveYearNeed)} />
        <KpiCard label="Overdue Spaces" value={summary.overdueSpaces} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <p className="text-xs text-muted-foreground">
          Lifecycle: {lifecycleDistribution.map((row) => `${row.name} ${row.value}`).join(" · ") || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Types: {spacesByType.slice(0, 4).map((row) => `${row.name} ${row.value}`).join(" · ") || "—"}
        </p>
      </div>

      <FilterToolbar
        showSearch
        searchSlot={
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Spaces..."
            className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          />
        }
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
        appliedFilters={appliedFilters}
        onFiltersChange={setAppliedFilters}
        filteredCount={filteredSpaces.length}
        totalCount={spaces.length}
      />

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
                  <TableCell className="text-muted-foreground">{space.locationLabel}</TableCell>
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

      <p className="text-sm text-muted-foreground">
        Showing {filteredSpaces.length} of {spaces.length} Spaces
      </p>

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
