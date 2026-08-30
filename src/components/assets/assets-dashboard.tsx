"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssetsDashboardProps {
  spaces: Space[];
  assets: Asset[];
  chartAssets?: Array<Pick<Asset, "manufacturer" | "category">>;
  organizationOptions?: { id: string; name: string }[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  search?: string;
}

export function AssetsDashboard({
  spaces,
  assets,
  chartAssets: chartSource,
  organizationOptions = [],
  totalCount,
  page = 1,
  pageSize = 50,
  search: initialSearch = "",
}: AssetsDashboardProps) {
  const [search, setSearch] = useState(initialSearch);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SpaceFiltersState>(emptySpaceFilters);
  const serverPaged = totalCount != null;

  const filterOptions = useMemo(
    () => buildSpaceFilterOptions(spaces, organizationOptions),
    [spaces, organizationOptions],
  );

  const filteredSpaceIds = useMemo(() => {
    const filtered = filterSpaces(spaces, serverPaged ? "" : search, filters);
    return new Set(filtered.map((space) => space.id));
  }, [spaces, search, filters, serverPaged]);

  const chartAssets = useMemo(() => {
    if (chartSource) return chartSource;
    if (serverPaged) return assets;
    return assets.filter((asset) => filteredSpaceIds.has(asset.spaceId));
  }, [assets, chartSource, filteredSpaceIds, serverPaged]);

  const tableAssets = useMemo(() => {
    if (serverPaged) return assets;
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (!filteredSpaceIds.has(asset.spaceId)) return false;
      if (!query) return true;
      return [asset.manufacturer, asset.modelNumber, asset.category, asset.serialNumber]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assets, filteredSpaceIds, search, serverPaged]);

  const manufacturerSlices = useMemo(
    () => computeManufacturerSlices(chartAssets),
    [chartAssets],
  );

  const productTypeSlices = useMemo(
    () => computeProductTypeSlices(chartAssets),
    [chartAssets],
  );

  const activeFilterCount = countActiveFilters(filters);
  const total = totalCount ?? tableAssets.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const spaceById = useMemo(() => new Map(spaces.map((space) => [space.id, space])), [spaces]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {serverPaged ? (
          <form className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search manufacturer, model, serial..."
              defaultValue={initialSearch}
              className="pl-9"
            />
          </form>
        ) : (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets or Spaces..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        )}
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

      <p className="text-sm text-muted-foreground">
        {serverPaged
          ? `${total} assets in the current organization`
          : `Showing ${tableAssets.length} of ${assets.length} assets`}
      </p>

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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Space</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                No assets match the current search.
              </TableCell>
            </TableRow>
          ) : (
            tableAssets.map((asset) => {
              const space = spaceById.get(asset.spaceId);
              return (
                <TableRow key={asset.id}>
                  <TableCell>
                    <p className="font-medium">
                      {asset.manufacturer} {asset.modelNumber}
                    </p>
                  </TableCell>
                  <TableCell>
                    {space ? (
                      <Link href={`/spaces/${space.id}`} className="hover:underline">
                        {space.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {asset.serialNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{asset.category || "—"}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {serverPaged && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link href={`/assets?page=${page - 1}${initialSearch ? `&q=${encodeURIComponent(initialSearch)}` : ""}`}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link href={`/assets?page=${page + 1}${initialSearch ? `&q=${encodeURIComponent(initialSearch)}` : ""}`}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

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
