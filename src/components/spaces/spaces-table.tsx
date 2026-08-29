"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
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
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
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
}

export function SpacesTable({ spaces, totalCount }: SpacesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(() => buildSpaceFilterOptions(spaces), [spaces]);

  const filteredSpaces = useMemo(
    () => filterSpaces(spaces, search, filters),
    [spaces, search, filters],
  );

  const activeFilterCount = countActiveFilters(filters);

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

      <p className="text-sm text-muted-foreground">
        Showing {filteredSpaces.length} of {totalCount ?? spaces.length} Spaces
      </p>

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
