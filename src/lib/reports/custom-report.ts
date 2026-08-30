import {
  computeAssetAgeBuckets,
  computeLifecycleDistribution,
  computePlanningDistribution,
  computeReplacementByYear,
  computeReplacementNeedByCategory,
  computeSpacesByType,
  computeYearComparison,
} from "@/lib/data/analytics";
import { computeManufacturerSlices, computeProductTypeSlices } from "@/lib/data/chart-data";
import {
  defaultChartSettings as defaultSettings,
  type ChartDisplaySettings,
} from "@/lib/charts/chart-settings";
import { emptySpaceFilters, filterSpaces, type SpaceFiltersState } from "@/lib/filters/space-filters";
import type { Asset, Space } from "@/lib/types";

export type ReportMetric =
  | "lifecycle-distribution"
  | "planning-distribution"
  | "spaces-by-type"
  | "replacement-by-year"
  | "recommended-vs-planned"
  | "assets-by-category"
  | "assets-by-manufacturer"
  | "replacement-by-category"
  | "asset-age-buckets"
  | "space-inventory"
  | "asset-inventory";

export type ReportChartType = "pie" | "ranked-list" | "bar" | "line" | "grouped-bar" | "table";

export interface CustomReportDefinition {
  name: string;
  metric: ReportMetric;
  chartType: ReportChartType;
  search: string;
  filters: SpaceFiltersState;
  settings: ChartDisplaySettings;
}

export const REPORT_METRIC_OPTIONS: Array<{ value: ReportMetric; label: string; description: string }> =
  [
    { value: "lifecycle-distribution", label: "Lifecycle distribution", description: "Spaces by upcoming, due, and overdue" },
    { value: "planning-distribution", label: "Planning distribution", description: "Spaces by planning status" },
    { value: "spaces-by-type", label: "Spaces by type", description: "Count of Spaces grouped by type" },
    { value: "replacement-by-year", label: "Replacement need by year", description: "Forecast replacement amounts by year" },
    { value: "recommended-vs-planned", label: "Recommended vs planned", description: "Compare recommended and planned amounts by year" },
    { value: "assets-by-category", label: "Assets by category", description: "Active asset counts by category" },
    { value: "assets-by-manufacturer", label: "Assets by manufacturer", description: "Active asset counts by manufacturer" },
    { value: "replacement-by-category", label: "Replacement need by category", description: "Future replacement cost by asset category" },
    { value: "asset-age-buckets", label: "Asset age distribution", description: "Assets grouped by install age" },
    { value: "space-inventory", label: "Space inventory", description: "Detailed Space list for export" },
    { value: "asset-inventory", label: "Asset inventory", description: "Detailed asset list for export" },
  ];

export const CHART_TYPE_OPTIONS: Array<{ value: ReportChartType; label: string }> = [
  { value: "pie", label: "Pie chart" },
  { value: "ranked-list", label: "Ranked list" },
  { value: "bar", label: "Bar chart" },
  { value: "line", label: "Line chart" },
  { value: "grouped-bar", label: "Grouped bar chart" },
  { value: "table", label: "Table" },
];

export function chartTypesForMetric(metric: ReportMetric): ReportChartType[] {
  switch (metric) {
    case "lifecycle-distribution":
    case "planning-distribution":
      return ["pie", "ranked-list", "table"];
    case "spaces-by-type":
    case "assets-by-category":
    case "assets-by-manufacturer":
    case "replacement-by-category":
    case "asset-age-buckets":
      return ["ranked-list", "bar", "table"];
    case "replacement-by-year":
      return ["line", "bar", "ranked-list", "table"];
    case "recommended-vs-planned":
      return ["grouped-bar", "table"];
    case "space-inventory":
    case "asset-inventory":
      return ["table"];
    default:
      return ["table"];
  }
}

export function defaultReportDefinition(): CustomReportDefinition {
  return {
    name: "New report",
    metric: "lifecycle-distribution",
    chartType: "pie",
    search: "",
    filters: emptySpaceFilters,
    settings: defaultSettings,
  };
}

export function parseCustomReportFilters(raw: Record<string, string>): CustomReportDefinition {
  if (!raw.metric) {
    return {
      ...defaultReportDefinition(),
      name: raw.name ?? "Saved report",
      metric: raw.reportKey === "assets" ? "asset-inventory" : "space-inventory",
      chartType: "table",
      search: raw.search ?? "",
      filters: {
        ...emptySpaceFilters,
        spaceType: raw.spaceType ? [raw.spaceType] : [],
      },
    };
  }

  const parsedFilters = raw.filtersJson ? JSON.parse(raw.filtersJson) : emptySpaceFilters;
  const parsedSettings = raw.settingsJson ? JSON.parse(raw.settingsJson) : defaultSettings;

  return {
    name: raw.name ?? "Saved report",
    metric: (raw.metric as ReportMetric) ?? "lifecycle-distribution",
    chartType: (raw.chartType as ReportChartType) ?? "pie",
    search: raw.search ?? "",
    filters: parsedFilters,
    settings: parsedSettings,
  };
}

export function serializeCustomReport(definition: CustomReportDefinition): Record<string, string> {
  return {
    name: definition.name,
    metric: definition.metric,
    chartType: definition.chartType,
    search: definition.search,
    filtersJson: JSON.stringify(definition.filters),
    settingsJson: JSON.stringify(definition.settings),
  };
}

export interface ReportDataset {
  simple: Array<{ name: string; value: number; percentage?: number }>;
  grouped: Array<{ year: number; recommended: number; planned: number; gap?: number }>;
  tableRows: Array<Record<string, string | number>>;
}

export function buildFilteredDataset(
  spaces: Space[],
  assets: Asset[],
  search: string,
  filters: SpaceFiltersState,
) {
  const filteredSpaces = filterSpaces(spaces, search, filters);
  const spaceIds = new Set(filteredSpaces.map((space) => space.id));
  const filteredAssets = assets.filter((asset) => spaceIds.has(asset.spaceId));
  return { filteredSpaces, filteredAssets };
}

export function buildReportDataset(
  metric: ReportMetric,
  spaces: Space[],
  assets: Asset[],
): ReportDataset {
  const empty: ReportDataset = { simple: [], grouped: [], tableRows: [] };

  switch (metric) {
    case "lifecycle-distribution": {
      const rows = computeLifecycleDistribution(spaces);
      return {
        simple: rows.map((row) => ({ name: row.name, value: row.value, percentage: row.percentage })),
        grouped: [],
        tableRows: rows.map((row) => ({ Status: row.name, Spaces: row.value, Percent: `${row.percentage}%` })),
      };
    }
    case "planning-distribution": {
      const rows = computePlanningDistribution(spaces);
      return {
        simple: rows.map((row) => ({ name: row.name, value: row.value, percentage: row.percentage })),
        grouped: [],
        tableRows: rows.map((row) => ({ Status: row.name, Spaces: row.value, Percent: `${row.percentage}%` })),
      };
    }
    case "spaces-by-type": {
      const rows = computeSpacesByType(spaces);
      return {
        simple: rows.map((row) => ({ name: row.name, value: row.value })),
        grouped: [],
        tableRows: rows.map((row) => ({ "Space type": row.name, Spaces: row.value })),
      };
    }
    case "replacement-by-year": {
      const rows = computeReplacementByYear(spaces, 15);
      return {
        simple: rows.map((row) => ({ name: String(row.year), value: row.amount })),
        grouped: [],
        tableRows: rows.map((row) => ({ Year: row.year, Amount: Math.round(row.amount) })),
      };
    }
    case "recommended-vs-planned": {
      const rows = computeYearComparison(spaces, 10);
      return {
        simple: [],
        grouped: rows,
        tableRows: rows.map((row) => ({
          Year: row.year,
          Recommended: Math.round(row.recommended),
          Planned: Math.round(row.planned),
          Gap: Math.round(row.gap),
        })),
      };
    }
    case "assets-by-category": {
      const rows = computeProductTypeSlices(assets).map((slice) => ({ name: slice.name, value: slice.value }));
      return {
        simple: rows,
        grouped: [],
        tableRows: rows.map((row) => ({ Category: row.name, Assets: row.value })),
      };
    }
    case "assets-by-manufacturer": {
      const rows = computeManufacturerSlices(assets).map((slice) => ({ name: slice.name, value: slice.value }));
      return {
        simple: rows,
        grouped: [],
        tableRows: rows.map((row) => ({ Manufacturer: row.name, Assets: row.value })),
      };
    }
    case "replacement-by-category": {
      const rows = computeReplacementNeedByCategory(assets);
      return {
        simple: rows.map((row) => ({ name: row.name, value: row.amount })),
        grouped: [],
        tableRows: rows.map((row) => ({ Category: row.name, Amount: Math.round(row.amount) })),
      };
    }
    case "asset-age-buckets": {
      const rows = computeAssetAgeBuckets(assets);
      return {
        simple: rows.map((row) => ({ name: row.name, value: row.value })),
        grouped: [],
        tableRows: rows.map((row) => ({ "Age bucket": row.name, Assets: row.value })),
      };
    }
    case "space-inventory":
      return {
        simple: [],
        grouped: [],
        tableRows: spaces.map((space) => ({
          Space: space.name,
          Type: space.spaceType,
          Location: space.locationLabel,
          "Recommended year": space.recommendedRefreshYear,
          "Planned year": space.plannedRefreshYear ?? "",
          "Original cost": Math.round(space.originalCost),
          Forecast: Math.round(space.forecastAmount),
          Lifecycle: space.lifecycleStatus,
          Planning: space.planningStatus,
        })),
      };
    case "asset-inventory":
      return {
        simple: [],
        grouped: [],
        tableRows: assets.map((asset) => ({
          Manufacturer: asset.manufacturer,
          Model: asset.modelNumber,
          Category: asset.category,
          Serial: asset.serialNumber ?? "",
          "Install date": asset.installDate,
          "Recommended year": asset.recommendedRefreshYear,
          Cost: Math.round(asset.cost),
        })),
      };
    default:
      return empty;
  }
}
