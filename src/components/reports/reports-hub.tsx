"use client";

import { useMemo, useState } from "react";
import type { Asset, LifecycleStatus, PlanningStatus, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { downloadCsv, downloadXlsx } from "@/lib/reports/export";
import { removeSavedReport, saveReportFilter } from "@/lib/reports/actions";
import type { SavedReport } from "@/lib/data/saved-reports";
import { computeReplacementByYear } from "@/lib/data/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REPORTS = [
  {
    key: "spaces",
    title: "Space Capital Plan",
    description: "Spaces with recommended year, forecast, and planning status",
  },
  {
    key: "assets",
    title: "Asset Inventory",
    description: "Full asset inventory with manufacturer, model, and category",
  },
  {
    key: "space-type",
    title: "Average Cost by Space Type",
    description: "Lump-sum Space cost averages by type",
  },
  {
    key: "lifecycle-status",
    title: "Lifecycle Status",
    description: "Spaces grouped by upcoming, due, and overdue status",
  },
  {
    key: "replacement-by-year",
    title: "Replacement Need by Year",
    description: "Forecast replacement amounts by planning year",
  },
  {
    key: "manufacturer",
    title: "Manufacturer Summary",
    description: "Asset counts by manufacturer",
  },
  {
    key: "category",
    title: "Asset Category Summary",
    description: "Asset counts by equipment category",
  },
  {
    key: "planning-status",
    title: "Planning Status",
    description: "Spaces by unplanned, scheduled, deferred, and completed",
  },
] as const;

type ReportKey = (typeof REPORTS)[number]["key"];

interface ReportsHubProps {
  spaces: Space[];
  assets: Asset[];
  savedReports: SavedReport[];
}

export function ReportsHub({ spaces, assets, savedReports }: ReportsHubProps) {
  const [reportKey, setReportKey] = useState<ReportKey>("spaces");
  const [search, setSearch] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus | "">("");
  const [planningStatus, setPlanningStatus] = useState<PlanningStatus | "">("");

  const types = useMemo(
    () => [...new Set(spaces.map((space) => space.spaceType).filter(Boolean))].sort(),
    [spaces],
  );

  const filteredSpaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return spaces.filter((space) => {
      if (spaceType && space.spaceType !== spaceType) return false;
      if (lifecycleStatus && space.lifecycleStatus !== lifecycleStatus) return false;
      if (planningStatus && space.planningStatus !== planningStatus) return false;
      if (!query) return true;
      return [space.name, space.locationLabel, space.spaceType].join(" ").toLowerCase().includes(query);
    });
  }, [spaces, search, spaceType, lifecycleStatus, planningStatus]);

  const filteredAssets = useMemo(() => {
    const spaceIds = new Set(filteredSpaces.map((space) => space.id));
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (!spaceIds.has(asset.spaceId)) return false;
      if (!query) return true;
      return [asset.manufacturer, asset.modelNumber, asset.category].join(" ").toLowerCase().includes(query);
    });
  }, [assets, filteredSpaces, search]);

  const spaceTypeRows = useMemo(() => {
    const groups = new Map<string, { count: number; cost: number }>();
    for (const space of filteredSpaces) {
      const current = groups.get(space.spaceType) ?? { count: 0, cost: 0 };
      current.count += 1;
      current.cost += space.originalCost;
      groups.set(space.spaceType, current);
    }
    return [...groups.entries()]
      .map(([type, value]) => ({
        type,
        spaces: value.count,
        total: value.cost,
        average: value.count ? value.cost / value.count : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSpaces]);

  const lifecycleRows = useMemo(() => {
    const groups = new Map<LifecycleStatus, number>();
    for (const space of filteredSpaces) {
      groups.set(space.lifecycleStatus, (groups.get(space.lifecycleStatus) ?? 0) + 1);
    }
    return [...groups.entries()].map(([status, count]) => ({ status, count }));
  }, [filteredSpaces]);

  const planningRows = useMemo(() => {
    const groups = new Map<PlanningStatus, number>();
    for (const space of filteredSpaces) {
      groups.set(space.planningStatus, (groups.get(space.planningStatus) ?? 0) + 1);
    }
    return [...groups.entries()].map(([status, count]) => ({ status, count }));
  }, [filteredSpaces]);

  const replacementRows = useMemo(() => computeReplacementByYear(filteredSpaces, 15), [filteredSpaces]);

  const manufacturerRows = useMemo(() => {
    const groups = new Map<string, number>();
    for (const asset of filteredAssets) {
      const name = asset.manufacturer.trim() || "Unknown";
      groups.set(name, (groups.get(name) ?? 0) + 1);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([manufacturer, count]) => ({ manufacturer, count }));
  }, [filteredAssets]);

  const categoryRows = useMemo(() => {
    const groups = new Map<string, number>();
    for (const asset of filteredAssets) {
      const name = asset.category.trim() || "Unknown";
      groups.set(name, (groups.get(name) ?? 0) + 1);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }, [filteredAssets]);

  const exportRows = (): Array<Record<string, string | number>> => {
    switch (reportKey) {
      case "space-type":
        return spaceTypeRows.map((row) => ({
          "Space type": row.type,
          Spaces: row.spaces,
          "Total original cost": Math.round(row.total),
          "Average Space cost": Math.round(row.average),
        }));
      case "assets":
        return filteredAssets.map((asset) => ({
          Manufacturer: asset.manufacturer,
          Model: asset.modelNumber,
          Category: asset.category,
          Serial: asset.serialNumber ?? "",
          "Install date": asset.installDate,
          "Recommended year": asset.recommendedRefreshYear,
        }));
      case "lifecycle-status":
        return lifecycleRows.map((row) => ({
          "Lifecycle status": row.status,
          Spaces: row.count,
        }));
      case "planning-status":
        return planningRows.map((row) => ({
          "Planning status": row.status,
          Spaces: row.count,
        }));
      case "replacement-by-year":
        return replacementRows.map((row) => ({
          Year: row.year,
          "Replacement need": Math.round(row.amount),
        }));
      case "manufacturer":
        return manufacturerRows.map((row) => ({
          Manufacturer: row.manufacturer,
          Assets: row.count,
        }));
      case "category":
        return categoryRows.map((row) => ({
          Category: row.category,
          Assets: row.count,
        }));
      default:
        return filteredSpaces.map((space) => ({
          Space: space.name,
          Type: space.spaceType,
          Location: space.locationLabel,
          "Recommended year": space.recommendedRefreshYear,
          "Planned year": space.plannedRefreshYear ?? "",
          "Original cost": Math.round(space.originalCost),
          Forecast: Math.round(space.forecastAmount),
          "Lifecycle status": space.lifecycleStatus,
          "Planning status": space.planningStatus,
        }));
    }
  };

  const showLifecycleFilter = ["spaces", "lifecycle-status", "planning-status"].includes(reportKey);
  const showPlanningFilter = ["spaces", "planning-status"].includes(reportKey);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((report) => (
          <button
            key={report.key}
            type="button"
            onClick={() => setReportKey(report.key)}
            className={`cursor-pointer rounded-lg border p-4 text-left transition-colors ${
              reportKey === report.key ? "border-primary bg-primary/5" : "hover:bg-accent/40"
            }`}
          >
            <p className="font-medium">{report.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report filters</CardTitle>
          <CardDescription>Filters apply to the preview and export below</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-xs"
          />
          <select
            value={spaceType}
            onChange={(event) => setSpaceType(event.target.value)}
            className="flex h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Space types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {showLifecycleFilter && (
            <select
              value={lifecycleStatus}
              onChange={(event) => setLifecycleStatus(event.target.value as LifecycleStatus | "")}
              className="flex h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All lifecycle statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
          {showPlanningFilter && (
            <select
              value={planningStatus}
              onChange={(event) => setPlanningStatus(event.target.value as PlanningStatus | "")}
              className="flex h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All planning statuses</option>
              <option value="unplanned">Unplanned</option>
              <option value="scheduled">Scheduled</option>
              <option value="deferred">Deferred</option>
              <option value="completed">Completed</option>
            </select>
          )}
          <Button variant="outline" onClick={() => downloadCsv(reportKey, exportRows())}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => downloadXlsx(reportKey, exportRows())}>
            Export Excel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {REPORTS.find((report) => report.key === reportKey)?.title} — {exportRows().length} rows
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reportKey === "spaces" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Planning</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpaces.slice(0, 80).map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <p className="font-medium">{space.name}</p>
                      <p className="text-xs text-muted-foreground">{space.locationLabel}</p>
                    </TableCell>
                    <TableCell>{space.recommendedRefreshYear}</TableCell>
                    <TableCell className="capitalize">{space.planningStatus}</TableCell>
                    <TableCell className="text-right">{formatCurrency(space.forecastAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "space-type" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space type</TableHead>
                  <TableHead className="text-right">Spaces</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaceTypeRows.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell>{row.type}</TableCell>
                    <TableCell className="text-right">{row.spaces}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.average)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "assets" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.slice(0, 80).map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      {asset.manufacturer} {asset.modelNumber}
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.serialNumber ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "lifecycle-status" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Spaces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lifecycleRows.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "planning-status" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Spaces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planningRows.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "replacement-by-year" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Replacement need</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replacementRows.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "manufacturer" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead className="text-right">Assets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manufacturerRows.map((row) => (
                  <TableRow key={row.manufacturer}>
                    <TableCell>{row.manufacturer}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportKey === "category" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Assets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRows.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved filter configurations</CardTitle>
          <CardDescription>Reuse a report with saved filters</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveReportFilter} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="reportKey" value={reportKey} />
            <input type="hidden" name="search" value={search} />
            <input type="hidden" name="spaceType" value={spaceType} />
            <div className="space-y-1">
              <Label htmlFor="savedReportName">Name</Label>
              <Input id="savedReportName" name="name" required className="w-56" />
            </div>
            <Button type="submit">Save</Button>
          </form>
          {savedReports.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {savedReports.map((report) => (
                <li key={report.id} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="cursor-pointer text-left text-primary hover:underline"
                    onClick={() => {
                      setReportKey((report.reportKey as ReportKey) || "spaces");
                      setSearch(report.filters.search ?? "");
                      setSpaceType(report.filters.spaceType ?? "");
                    }}
                  >
                    {report.name}
                  </button>
                  <form action={removeSavedReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
