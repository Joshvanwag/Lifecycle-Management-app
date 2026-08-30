"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { RankedListChart } from "@/components/charts/ranked-list-chart";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import { LifecycleStatusBadge } from "@/components/spaces/status-badges";
import {
  computeAssetAgeBuckets,
  computeAssetKpis,
  computeReplacementNeedByCategory,
} from "@/lib/data/analytics";
import { computeManufacturerSlices, computeProductTypeSlices } from "@/lib/data/chart-data";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  filterSpaces,
} from "@/lib/filters/space-filters";
import type { Asset, Space } from "@/lib/types";
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
  const [appliedFilters, setAppliedFilters] = useState<SpaceFiltersState>(emptySpaceFilters);
  const [categoryDrill, setCategoryDrill] = useState<string | null>(null);
  const [manufacturerDrill, setManufacturerDrill] = useState<string | null>(null);
  const serverPaged = totalCount != null;

  const filterOptions = useMemo(
    () => buildSpaceFilterOptions(spaces, organizationOptions),
    [spaces, organizationOptions],
  );

  const filteredSpaceIds = useMemo(() => {
    const filtered = filterSpaces(spaces, serverPaged ? "" : search, appliedFilters);
    return new Set(filtered.map((space) => space.id));
  }, [spaces, search, appliedFilters, serverPaged]);

  const chartAssets = useMemo(() => {
    if (chartSource) return chartSource;
    if (serverPaged) return assets;
    return assets.filter((asset) => filteredSpaceIds.has(asset.spaceId));
  }, [assets, chartSource, filteredSpaceIds, serverPaged]);

  const tableAssets = useMemo(() => {
    const seen = new Set<string>();
    const unique = assets.filter((asset) => {
      if (seen.has(asset.id)) return false;
      seen.add(asset.id);
      return true;
    });
    if (serverPaged) return unique;
    const query = search.trim().toLowerCase();
    return unique.filter((asset) => {
      if (!filteredSpaceIds.has(asset.spaceId)) return false;
      if (!query) return true;
      return [asset.manufacturer, asset.modelNumber, asset.category, asset.serialNumber]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assets, filteredSpaceIds, search, serverPaged]);

  const kpis = useMemo(() => computeAssetKpis(chartAssets as Asset[]), [chartAssets]);
  const categoryBars = useMemo(
    () =>
      computeProductTypeSlices(chartAssets).map((slice) => ({
        name: slice.name,
        value: slice.value,
      })),
    [chartAssets],
  );
  const manufacturerBars = useMemo(
    () =>
      computeManufacturerSlices(chartAssets).map((slice) => ({ name: slice.name, value: slice.value })),
    [chartAssets],
  );
  const replacementByCategory = useMemo(
    () => computeReplacementNeedByCategory(chartAssets as Asset[]),
    [chartAssets],
  );
  const ageBuckets = useMemo(
    () => computeAssetAgeBuckets(chartAssets as Asset[]),
    [chartAssets],
  );

  const activeFilterCount = countActiveFilters(appliedFilters);
  const total = totalCount ?? tableAssets.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const spaceById = useMemo(() => new Map(spaces.map((space) => [space.id, space])), [spaces]);

  return (
    <div className="space-y-6">
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search assets..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
        appliedFilters={appliedFilters}
        onFiltersChange={setAppliedFilters}
        organizationOptions={organizationOptions}
        filteredCount={tableAssets.length}
        totalCount={assets.length}
        countLabel="assets"
        searchSlot={
          serverPaged ? (
            <form className="relative w-full max-w-md">
              <Input
                name="q"
                placeholder="Search manufacturer, model, serial..."
                defaultValue={initialSearch}
              />
            </form>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Assets" value={kpis.totalAssets} icon={Package} />
        <KpiCard
          label="Asset-Level Cost"
          value={formatCurrency(kpis.assetLevelCost)}
          description="Does not include lump-sum Space costs"
        />
        <KpiCard label="Due" value={kpis.due} icon={CalendarClock} />
        <KpiCard label="Overdue" value={kpis.overdue} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedListChart
          title="Assets by Category"
          description="Equipment counts by category"
          data={(categoryDrill
            ? categoryBars.filter((row) => row.name === categoryDrill)
            : categoryBars
          ).map((row) => ({ name: row.name, value: row.value }))}
          valueFormatter={(value) => String(value)}
          onItemClick={setCategoryDrill}
          selectedName={categoryDrill}
          drillLabel={categoryDrill ?? undefined}
          onReset={() => setCategoryDrill(null)}
        />
        <RankedListChart
          title="Assets by Manufacturer"
          description="Top manufacturers by asset count"
          data={(manufacturerDrill
            ? manufacturerBars.filter((row) => row.name === manufacturerDrill)
            : manufacturerBars
          ).map((row) => ({ name: row.name, value: row.value }))}
          valueFormatter={(value) => String(value)}
          onItemClick={setManufacturerDrill}
          selectedName={manufacturerDrill}
          drillLabel={manufacturerDrill ?? undefined}
          onReset={() => setManufacturerDrill(null)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedListChart
          title="Replacement Need by Category"
          description="Future replacement cost by asset category"
          data={replacementByCategory.map((row) => ({ name: row.name, value: row.amount }))}
          valueFormatter={(value) => formatCurrency(value)}
        />
        <LabeledBarChart
          title="Lifecycle Age Distribution"
          description="Active assets grouped by install age"
          data={ageBuckets.map((row) => ({ name: row.name, value: row.value }))}
          valueFormatter={(value) => String(value)}
          labelFormatter={(value) => String(value)}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Space</TableHead>
              <TableHead>Install Date</TableHead>
              <TableHead className="text-right">Recommended Year</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-sm text-muted-foreground">
                  No assets match the current search or filters.
                </TableCell>
              </TableRow>
            ) : (
              tableAssets.map((asset) => {
                const space = spaceById.get(asset.spaceId);
                return (
                  <TableRow key={`${asset.organizationId}:${asset.id}`}>
                    <TableCell className="font-medium">
                      {asset.manufacturer} {asset.modelNumber}
                    </TableCell>
                    <TableCell>{asset.manufacturer}</TableCell>
                    <TableCell>{asset.modelNumber}</TableCell>
                    <TableCell>{asset.category || "—"}</TableCell>
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
                      {asset.installDate ? new Date(asset.installDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">{asset.recommendedRefreshYear}</TableCell>
                    <TableCell>
                      <LifecycleStatusBadge status={asset.lifecycleStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.cost > 0 ? formatCurrency(asset.cost) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
        appliedFilters={appliedFilters}
        onApplyFilters={setAppliedFilters}
        options={filterOptions}
      />
    </div>
  );
}
