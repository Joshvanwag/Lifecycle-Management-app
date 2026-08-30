import {
  IMPORT_FIELD_KEYS,
  type ImportFieldKey,
} from "@/lib/import/fields";
import type { AssetInput } from "@/lib/lifecycle/form-utils";

export type ColumnMap = Record<string, ImportFieldKey | "">;

export interface MappedImportRow {
  spaceName: string;
  spaceType: string;
  campus: string;
  building: string;
  room: string;
  commissionedDate: string;
  spaceRefreshCycleYears: string;
  spaceCost: string;
  manufacturer: string;
  modelNumber: string;
  category: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  installDate: string;
  assetCost: string;
  assetRefreshCycleYears: string;
  replacementYear: string;
}

function valueFor(row: Record<string, string>, map: ColumnMap, field: ImportFieldKey): string {
  const header = Object.keys(map).find((key) => map[key] === field);
  if (!header) {
    return "";
  }
  return (row[header] ?? "").trim();
}

export function applyColumnMap(
  rows: Array<Record<string, string>>,
  map: ColumnMap,
): MappedImportRow[] {
  return rows.map((row) => ({
    spaceName: valueFor(row, map, "space_name"),
    spaceType: valueFor(row, map, "space_type"),
    campus: valueFor(row, map, "campus"),
    building: valueFor(row, map, "building"),
    room: valueFor(row, map, "room"),
    commissionedDate: valueFor(row, map, "commissioned_date"),
    spaceRefreshCycleYears: valueFor(row, map, "space_refresh_cycle_years"),
    spaceCost: valueFor(row, map, "space_cost"),
    manufacturer: valueFor(row, map, "manufacturer"),
    modelNumber: valueFor(row, map, "model_number"),
    category: valueFor(row, map, "category"),
    serialNumber: valueFor(row, map, "serial_number"),
    ipAddress: valueFor(row, map, "ip_address"),
    macAddress: valueFor(row, map, "mac_address"),
    installDate: valueFor(row, map, "install_date"),
    assetCost: valueFor(row, map, "asset_cost"),
    assetRefreshCycleYears: valueFor(row, map, "asset_refresh_cycle_years"),
    replacementYear: valueFor(row, map, "replacement_year"),
  }));
}

function parseDate(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toISOString().slice(0, 10);
}

function parseCycle(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.round(parsed);
}

function parseCost(value: string): number {
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function cycleFromReplacement(installDate: string, replacementYear: string, fallback: number): number {
  if (!replacementYear) {
    return fallback;
  }
  const year = Number(replacementYear);
  const installYear = new Date(`${installDate}T00:00:00`).getFullYear();
  if (!Number.isFinite(year) || Number.isNaN(installYear)) {
    return fallback;
  }
  return Math.min(30, Math.max(1, year - installYear));
}

export function rowHasAsset(row: MappedImportRow): boolean {
  return Boolean(
    row.manufacturer ||
      row.modelNumber ||
      row.category ||
      row.serialNumber ||
      row.installDate ||
      row.assetCost,
  );
}

export function toAssetInput(row: MappedImportRow, fallbackCycle: number, fallbackDate: string): AssetInput {
  const installDate = parseDate(row.installDate || row.commissionedDate, fallbackDate);
  const cycle = row.assetRefreshCycleYears
    ? parseCycle(row.assetRefreshCycleYears, fallbackCycle)
    : cycleFromReplacement(installDate, row.replacementYear, fallbackCycle);

  return {
    manufacturer: row.manufacturer,
    modelNumber: row.modelNumber,
    category: row.category,
    installDate,
    cost: parseCost(row.assetCost),
    refreshCycleYears: cycle,
    serialNumber: row.serialNumber || undefined,
    ipAddress: row.ipAddress || undefined,
    macAddress: row.macAddress || undefined,
  };
}

export function spaceCostFromRows(rows: MappedImportRow[], assets: AssetInput[]): number {
  const explicit = rows.map((row) => parseCost(row.spaceCost)).find((value) => value > 0);
  if (explicit && explicit > 0) {
    return explicit;
  }
  return assets.reduce((sum, asset) => sum + asset.cost, 0);
}

export function groupRowsBySpace(rows: MappedImportRow[]): Map<string, MappedImportRow[]> {
  const groups = new Map<string, MappedImportRow[]>();
  for (const row of rows) {
    const key = [row.spaceName, row.campus, row.building, row.room].join("|");
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return groups;
}

export function validateColumnMap(map: ColumnMap, workflow: "add" | "full_refresh" | "partial_refresh" | "correct") {
  const mapped = new Set(Object.values(map).filter(Boolean));
  if (workflow === "add" && !mapped.has("space_name")) {
    throw new Error("Map a column to Space name.");
  }
  if (
    (workflow === "full_refresh" || workflow === "partial_refresh" || workflow === "correct") &&
    mapped.size === 0
  ) {
    throw new Error("Map at least one equipment column.");
  }
}

export function isImportFieldKey(value: string): value is ImportFieldKey {
  return (IMPORT_FIELD_KEYS as readonly string[]).includes(value);
}
