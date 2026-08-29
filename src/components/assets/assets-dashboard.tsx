"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import {
  ActiveFilterChips,
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import {
  computeManufacturerSlices,
  computeProductTypeSlices,
} from "@/lib/data/chart-data";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Asset, Space } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssetsDashboardProps {
  spaces: Space[];
  assets: Asset[];
  organizationOptions?: { id: string; name: string }[];
}

export function AssetsDashboard({
  spaces,
  assets,
  organizationOptions = [],
}: AssetsDashboardProps) {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(
    () => buildSpaceFilterOptions(spaces, organizationOptions),
    [spaces, organizationOptions],
  );

  const filteredSpaceIds = useMemo(() => {
    const filtered = filterSpaces(spaces, search, filters);
    return new Set(filtered.map((space) => space.id));
  }, [spaces, search, filters]);

  const filteredAssets = useMemo(
    () => assets.filter((asset) => filteredSpaceIds.has(asset.spaceId)),
    [assets, filteredSpaceIds],
  );

  const manufacturerSlices = useMemo(
    () => computeManufacturerSlices(filteredAssets),
    [filteredAssets],
  );

  const productTypeSlices = useMemo(
    () => computeProductTypeSlices(filteredAssets),
    [filteredAssets],
  );

  const activeFilterCount = countActiveFilters(filters);

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
        filters={filters}
        onFiltersChange={setFilters}
        organizationOptions={organizationOptions}
      />

      {filteredAssets.length !== assets.length && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredAssets.length} of {assets.length} assets across filtered Spaces
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart
          title="Asset Manufacturer — Top 10"
          description="Most common manufacturers in the filtered asset inventory"
          data={manufacturerSlices}
        />
        <CategoryPieChart
          title="Asset Product Type"
          description="Equipment categories in the filtered asset inventory"
          data={productTypeSlices}
        />
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
