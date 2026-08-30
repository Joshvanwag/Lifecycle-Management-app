"use client";

import { useMemo, useState } from "react";
import type { Asset, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { downloadCsv, downloadXlsx } from "@/lib/reports/export";
import { removeSavedReport, saveCustomReport } from "@/lib/reports/actions";
import type { SavedReport } from "@/lib/data/saved-reports";
import type { ChartDisplaySettings } from "@/lib/charts/chart-settings";
import {
  CHART_TYPE_OPTIONS,
  REPORT_METRIC_OPTIONS,
  buildFilteredDataset,
  buildReportDataset,
  chartTypesForMetric,
  defaultReportDefinition,
  parseCustomReportFilters,
  serializeCustomReport,
  type CustomReportDefinition,
  type ReportChartType,
} from "@/lib/reports/custom-report";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { PieDistributionChart } from "@/components/charts/pie-distribution-chart";
import { RankedListChart } from "@/components/charts/ranked-list-chart";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import {
  SpaceFilters,
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import { buildSpaceFilterOptions, countActiveFilters } from "@/lib/filters/space-filters";
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

interface ReportsHubProps {
  spaces: Space[];
  assets: Asset[];
  savedReports: SavedReport[];
}

function ReportChartPreview({
  definition,
  settings,
  onSettingsChange,
  spaces,
  assets,
}: {
  definition: CustomReportDefinition;
  settings: ChartDisplaySettings;
  onSettingsChange: (settings: ChartDisplaySettings) => void;
  spaces: Space[];
  assets: Asset[];
}) {
  const { filteredSpaces, filteredAssets } = useMemo(
    () => buildFilteredDataset(spaces, assets, definition.search, definition.filters),
    [spaces, assets, definition.search, definition.filters],
  );

  const dataset = useMemo(
    () => buildReportDataset(definition.metric, filteredSpaces, filteredAssets),
    [definition.metric, filteredSpaces, filteredAssets],
  );

  const currencyMetrics = new Set([
    "replacement-by-year",
    "replacement-by-category",
    "recommended-vs-planned",
  ]);
  const isCurrency = currencyMetrics.has(definition.metric);

  if (definition.chartType === "table") {
    const columns = dataset.tableRows[0] ? Object.keys(dataset.tableRows[0]) : [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>{definition.name}</CardTitle>
          <CardDescription>{dataset.tableRows.length} rows</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.tableRows.slice(0, 100).map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (definition.chartType === "grouped-bar") {
    return (
      <GroupedBarChart
        title={definition.name}
        description="Recommended vs planned by year"
        data={dataset.grouped}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    );
  }

  if (definition.chartType === "pie") {
    return (
      <PieDistributionChart
        title={definition.name}
        description="Distribution for filtered portfolio data"
        data={dataset.simple.map((row) => ({
          name: row.name,
          value: row.value,
          percentage: row.percentage ?? 0,
        }))}
        colorType={
          definition.metric === "planning-distribution" ? "planningStatus" : "lifecycleStatus"
        }
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    );
  }

  if (definition.chartType === "ranked-list") {
    return (
      <RankedListChart
        title={definition.name}
        description="Ranked values for filtered portfolio data"
        data={dataset.simple.map((row) => ({ name: row.name, value: row.value }))}
        valueFormatter={(value) => (isCurrency ? formatCurrency(value) : String(value))}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    );
  }

  return (
    <LabeledBarChart
      title={definition.name}
      description="Bar chart for filtered portfolio data"
      data={dataset.simple.map((row) => ({ name: row.name, value: row.value }))}
      valueFormatter={(value) => (isCurrency ? formatCurrency(value) : String(value))}
      labelFormatter={(value) => (isCurrency ? formatCurrency(value) : String(value))}
      colorScheme={
        definition.metric === "replacement-by-year"
          ? {
              type: "years",
              years: dataset.simple.map((row) => Number(row.name)),
            }
          : { type: "lifecycleStatus" }
      }
      settings={settings}
      onSettingsChange={onSettingsChange}
    />
  );
}

export function ReportsHub({ spaces, assets, savedReports }: ReportsHubProps) {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SpaceFiltersState>(emptySpaceFilters);
  const [draft, setDraft] = useState<CustomReportDefinition>(defaultReportDefinition());
  const [activeReport, setActiveReport] = useState<CustomReportDefinition | null>(null);
  const [activeSettings, setActiveSettings] = useState<ChartDisplaySettings>(
    defaultReportDefinition().settings,
  );

  const filterOptions = useMemo(() => buildSpaceFilterOptions(spaces), [spaces]);
  const activeFilterCount = countActiveFilters(appliedFilters);
  const compatibleChartTypes = chartTypesForMetric(draft.metric);

  const { filteredSpaces, filteredAssets } = useMemo(
    () => buildFilteredDataset(spaces, assets, search, appliedFilters),
    [spaces, assets, search, appliedFilters],
  );

  const previewDataset = useMemo(() => {
    if (!activeReport) return null;
    const scoped = buildFilteredDataset(
      spaces,
      assets,
      activeReport.search,
      activeReport.filters,
    );
    return buildReportDataset(activeReport.metric, scoped.filteredSpaces, scoped.filteredAssets);
  }, [activeReport, spaces, assets]);

  const createReport = () => {
    const chartType = compatibleChartTypes.includes(draft.chartType)
      ? draft.chartType
      : compatibleChartTypes[0] ?? "table";

    const nextReport: CustomReportDefinition = {
      ...draft,
      chartType,
      search,
      filters: appliedFilters,
    };
    setActiveReport(nextReport);
    setActiveSettings(nextReport.settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build a custom report</CardTitle>
          <CardDescription>
            Filter your portfolio, choose a metric and chart type, then customize display settings
            from the chart&apos;s settings icon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search Spaces and assets..."
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
            appliedFilters={appliedFilters}
            onFiltersChange={setAppliedFilters}
            filteredCount={filteredSpaces.length}
            totalCount={spaces.length}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report name</Label>
              <Input
                id="reportName"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportMetric">Data to chart</Label>
              <select
                id="reportMetric"
                value={draft.metric}
                onChange={(event) => {
                  const metric = event.target.value as CustomReportDefinition["metric"];
                  const nextTypes = chartTypesForMetric(metric);
                  setDraft((current) => ({
                    ...current,
                    metric,
                    chartType: nextTypes.includes(current.chartType)
                      ? current.chartType
                      : nextTypes[0] ?? "table",
                  }));
                }}
                className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
              >
                {REPORT_METRIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportChartType">Chart type</Label>
              <select
                id="reportChartType"
                value={draft.chartType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    chartType: event.target.value as ReportChartType,
                  }))
                }
                className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
              >
                {CHART_TYPE_OPTIONS.filter((option) => compatibleChartTypes.includes(option.value)).map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full cursor-pointer" onClick={createReport}>
                Create chart
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {REPORT_METRIC_OPTIONS.find((option) => option.value === draft.metric)?.description} ·{" "}
            {filteredSpaces.length} Spaces · {filteredAssets.length} assets in scope
          </p>
        </CardContent>
      </Card>

      {activeReport && (
        <div className="space-y-4">
          <ReportChartPreview
            definition={activeReport}
            settings={activeSettings}
            onSettingsChange={setActiveSettings}
            spaces={spaces}
            assets={assets}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => downloadCsv(activeReport.name, previewDataset?.tableRows ?? [])}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => downloadXlsx(activeReport.name, previewDataset?.tableRows ?? [])}
            >
              Export Excel
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved reports</CardTitle>
          <CardDescription>Reuse a named report with its filters, chart type, and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeReport && (
            <form action={saveCustomReport} className="flex flex-wrap items-end gap-3">
              {Object.entries(
                serializeCustomReport({ ...activeReport, settings: activeSettings }),
              ).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
              <Button type="submit" className="cursor-pointer">
                Save current report
              </Button>
            </form>
          )}

          {savedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved reports yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {savedReports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <button
                    type="button"
                    className="cursor-pointer text-left font-medium text-primary hover:underline"
                    onClick={() => {
                      const parsed = parseCustomReportFilters(report.filters);
                      const loaded = { ...parsed, name: report.name };
                      setActiveReport(loaded);
                      setActiveSettings(loaded.settings);
                      setSearch(loaded.search);
                      setAppliedFilters(loaded.filters);
                      setDraft(loaded);
                    }}
                  >
                    {report.name}
                  </button>
                  <form action={removeSavedReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit" variant="ghost" size="sm" className="cursor-pointer">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
