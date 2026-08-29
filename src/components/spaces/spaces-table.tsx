"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import {
  ActiveFilterChips,
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
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
  const [filters, setFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(
    () => ({
      campuses: [...new Set(spaces.map((s) => s.campus))].sort(),
      buildings: [...new Set(spaces.map((s) => s.building))].sort(),
      spaceTypes: [...new Set(spaces.map((s) => s.spaceType))].sort(),
      years: [...new Set(spaces.map((s) => String(s.recommendedRefreshYear)))].sort(),
    }),
    [spaces],
  );

  const filteredSpaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return spaces.filter((space) => {
      const matchesSearch =
        !query ||
        space.name.toLowerCase().includes(query) ||
        space.locationLabel.toLowerCase().includes(query) ||
        space.spaceType.toLowerCase().includes(query);

      const matchesCampus =
        filters.campus.length === 0 || filters.campus.includes(space.campus);
      const matchesBuilding =
        filters.building.length === 0 || filters.building.includes(space.building);
      const matchesSpaceType =
        filters.spaceType.length === 0 || filters.spaceType.includes(space.spaceType);
      const matchesLifecycle =
        filters.lifecycleStatus.length === 0 ||
        filters.lifecycleStatus.includes(space.lifecycleStatus);
      const matchesPlanning =
        filters.planningStatus.length === 0 ||
        filters.planningStatus.includes(space.planningStatus);
      const matchesYear =
        filters.year.length === 0 ||
        filters.year.includes(String(space.recommendedRefreshYear));

      return (
        matchesSearch &&
        matchesCampus &&
        matchesBuilding &&
        matchesSpaceType &&
        matchesLifecycle &&
        matchesPlanning &&
        matchesYear
      );
    });
  }, [spaces, search, filters]);

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const total = totalCount ?? spaces.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
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

      <ActiveFilterChips filters={filters} onFiltersChange={setFilters} />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Planning</TableHead>
              <TableHead>Refresh Year</TableHead>
              <TableHead className="text-right">Forecast</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">{space.assetCount} assets</p>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {space.locationLabel}
                  </TableCell>
                  <TableCell>{space.spaceType}</TableCell>
                  <TableCell>
                    <LifecycleStatusBadge status={space.lifecycleStatus} />
                  </TableCell>
                  <TableCell>
                    <PlanningStatusBadge status={space.planningStatus} />
                  </TableCell>
                  <TableCell>{space.recommendedRefreshYear}</TableCell>
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
        filters={filters}
        onFiltersChange={setFilters}
        options={filterOptions}
      />
    </div>
  );
}
