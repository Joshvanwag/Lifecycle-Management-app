"use client";

import { useMemo, useState } from "react";
import type { Asset, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { downloadCsv, downloadXlsx } from "@/lib/reports/export";
import { removeSavedReport, saveReportFilter } from "@/lib/reports/actions";
import type { SavedReport } from "@/lib/data/saved-reports";
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
  { key: "spaces", title: "Spaces capital plan", description: "Spaces with recommended year and forecast" },
  { key: "space-type", title: "Average cost by Space type", description: "Lump-sum Space cost averages — not per-asset" },
  { key: "assets", title: "Asset inventory", description: "Counts and product types, not average cost per asset" },
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

  const types = useMemo(
    () => [...new Set(spaces.map((space) => space.spaceType).filter(Boolean))].sort(),
    [spaces],
  );

  const filteredSpaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return spaces.filter((space) => {
      if (spaceType && space.spaceType !== spaceType) return false;
      if (!query) return true;
      return [space.name, space.locationLabel, space.spaceType].join(" ").toLowerCase().includes(query);
    });
  }, [spaces, search, spaceType]);

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

  const exportRows = (): Array<Record<string, string | number>> => {
    if (reportKey === "space-type") {
      return spaceTypeRows.map((row) => ({
        "Space type": row.type,
        Spaces: row.spaces,
        "Total original cost": Math.round(row.total),
        "Average Space cost": Math.round(row.average),
      }));
    }
    if (reportKey === "assets") {
      return filteredAssets.map((asset) => ({
        Manufacturer: asset.manufacturer,
        Model: asset.modelNumber,
        Category: asset.category,
        Serial: asset.serialNumber ?? "",
      }));
    }
    return filteredSpaces.map((space) => ({
      Space: space.name,
      Type: space.spaceType,
      Location: space.locationLabel,
      "Recommended year": space.recommendedRefreshYear,
      "Original cost": Math.round(space.originalCost),
      Forecast: Math.round(space.forecastAmount),
      "Planning status": space.planningStatus,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {REPORTS.map((report) => (
          <button
            key={report.key}
            type="button"
            onClick={() => setReportKey(report.key)}
            className={`cursor-pointer rounded-lg border p-4 text-left ${
              reportKey === report.key ? "border-primary bg-primary/5" : "hover:bg-accent/40"
            }`}
          >
            <p className="font-medium">{report.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Filter..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
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
        <Button variant="outline" onClick={() => downloadCsv(reportKey, exportRows())}>
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => downloadXlsx(reportKey, exportRows())}>
          Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Save this filter</CardTitle>
          <CardDescription>Keeps the current report and filter for this organization</CardDescription>
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

      {reportKey === "spaces" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>Year</TableHead>
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
              <TableHead className="text-right">Average Space cost</TableHead>
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
              <TableHead>Type</TableHead>
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
    </div>
  );
}
