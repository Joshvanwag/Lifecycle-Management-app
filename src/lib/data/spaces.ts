import { createClient } from "@/lib/supabase/server";
import { computeDashboardMetrics } from "@/lib/data/dashboard-metrics";
import {
  deriveLifecycleStatus,
  deriveRecommendedRefreshYear,
  formatLocationLabel,
  toPlanningStatus,
} from "@/lib/lifecycle/display";
import { summarizeForecast } from "@/lib/lifecycle/engine";
import type { AssetRow, RefreshEventRow } from "@/lib/database.types";
import type { Asset, DashboardMetrics, RefreshEvent, Space } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;

interface SpaceLocationRow {
  space_id: string;
  physical_locations: {
    name: string;
    location_type: string;
    buildings: {
      name: string;
      campuses: {
        name: string;
      };
    };
  } | null;
}

interface SpaceListRow {
  id: string;
  name: string;
  space_type: string;
  commissioned_date: string;
  refresh_cycle_years: number;
  original_cost: number;
  planning_status: string;
  planned_refresh_year: number | null;
}

interface ForecastComponentRow {
  space_id: string;
  asset_id: string | null;
  forecast_amount: number;
  recommended_replacement_year: number;
  cost_basis: number;
}

function mapSpaceRow(
  row: SpaceListRow,
  location: SpaceLocationRow["physical_locations"],
  assetCount: number,
  components: ForecastComponentRow[],
  organizationId: string,
  organizationName: string,
): Space {
  const campus = location?.buildings.campuses.name ?? "";
  const building = location?.buildings.name ?? "";
  const room = location?.location_type === "room" ? location.name : undefined;
  const fallbackYear =
    row.planned_refresh_year ??
    deriveRecommendedRefreshYear(row.commissioned_date, row.refresh_cycle_years);
  const forecast = summarizeForecast(
    components.map((component) => ({
      forecastAmount: Number(component.forecast_amount),
      recommendedReplacementYear: component.recommended_replacement_year,
    })),
    fallbackYear,
  );

  return {
    id: row.id,
    organizationId,
    organizationName,
    name: row.name,
    spaceType: row.space_type,
    campus,
    building,
    room,
    locationLabel: formatLocationLabel({ campus, building, room }),
    commissionedDate: row.commissioned_date,
    commissionedYear: new Date(row.commissioned_date).getFullYear(),
    refreshCycleYears: row.refresh_cycle_years,
    recommendedRefreshYear: forecast.recommendedRefreshYear,
    lifecycleStatus: deriveLifecycleStatus(forecast.recommendedRefreshYear),
    planningStatus: toPlanningStatus(row.planning_status),
    plannedRefreshYear: row.planned_refresh_year ?? undefined,
    originalCost: Number(row.original_cost),
    forecastAmount: forecast.forecastAmount,
    forecastByYear: forecast.forecastByYear,
    assetCount,
  };
}

async function getSpaceLocations(client: Client, spaceIds: string[]) {
  if (spaceIds.length === 0) {
    return new Map<string, SpaceLocationRow["physical_locations"]>();
  }

  const { data, error } = await client
    .from("space_locations")
    .select(
      `
      space_id,
      physical_locations (
        name,
        location_type,
        buildings (
          name,
          campuses (
            name
          )
        )
      )
    `,
    )
    .in("space_id", spaceIds);

  if (error) {
    throw new Error(`Failed to load space locations: ${error.message}`);
  }

  const map = new Map<string, SpaceLocationRow["physical_locations"]>();
  for (const row of (data ?? []) as SpaceLocationRow[]) {
    if (!map.has(row.space_id)) {
      map.set(row.space_id, row.physical_locations);
    }
  }
  return map;
}

async function getAssetCounts(client: Client, organizationId: string, spaceIds: string[]) {
  if (spaceIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await client
    .from("assets")
    .select("space_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("space_id", spaceIds);

  if (error) {
    throw new Error(`Failed to load asset counts: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { space_id: string }[]) {
    counts.set(row.space_id, (counts.get(row.space_id) ?? 0) + 1);
  }
  return counts;
}

async function getForecastComponents(
  client: Client,
  organizationId: string,
  spaceIds: string[],
) {
  if (spaceIds.length === 0) {
    return new Map<string, ForecastComponentRow[]>();
  }

  const { data, error } = await client
    .from("forecast_cost_components")
    .select("space_id, asset_id, forecast_amount, recommended_replacement_year, cost_basis")
    .eq("organization_id", organizationId)
    .in("space_id", spaceIds);

  if (error) {
    throw new Error(`Failed to load forecast components: ${error.message}`);
  }

  const map = new Map<string, ForecastComponentRow[]>();
  for (const row of (data ?? []) as ForecastComponentRow[]) {
    const list = map.get(row.space_id) ?? [];
    list.push(row);
    map.set(row.space_id, list);
  }
  return map;
}

export interface ListSpacesOptions {
  page?: number;
  pageSize?: number;
}

export interface ListSpacesResult {
  spaces: Space[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function listSpaces(
  client: Client,
  organizationId: string,
  options: ListSpacesOptions = {},
  organizationName = "",
): Promise<ListSpacesResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(1000, Math.max(1, options.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await client
    .from("spaces")
    .select(
      "id, name, space_type, commissioned_date, refresh_cycle_years, original_cost, planning_status, planned_refresh_year",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load spaces: ${error.message}`);
  }

  const rows = (data ?? []) as SpaceListRow[];
  const spaceIds = rows.map((row) => row.id);
  const [locations, assetCounts, forecastComponents] = await Promise.all([
    getSpaceLocations(client, spaceIds),
    getAssetCounts(client, organizationId, spaceIds),
    getForecastComponents(client, organizationId, spaceIds),
  ]);

  const spaces = rows.map((row) =>
    mapSpaceRow(
      row,
      locations.get(row.id) ?? null,
      assetCounts.get(row.id) ?? 0,
      forecastComponents.get(row.id) ?? [],
      organizationId,
      organizationName,
    ),
  );

  return {
    spaces,
    totalCount: count ?? spaces.length,
    page,
    pageSize,
  };
}

export async function getAllSpaces(
  client: Client,
  organizationId: string,
  organizationName = "",
): Promise<Space[]> {
  const spaces: Space[] = [];
  let page = 1;

  while (true) {
    const result = await listSpaces(client, organizationId, { page, pageSize: 1000 }, organizationName);
    spaces.push(...result.spaces);
    if (spaces.length >= result.totalCount) {
      break;
    }
    page += 1;
  }

  return spaces;
}

export async function getAllSpacesForOrganizations(
  client: Client,
  organizationIds: string[],
  organizationNames: Map<string, string>,
): Promise<Space[]> {
  const groups = await Promise.all(
    organizationIds.map((organizationId) =>
      getAllSpaces(client, organizationId, organizationNames.get(organizationId) ?? "Unknown"),
    ),
  );
  return groups.flat();
}

function mapAssetRow(row: AssetRow, organizationId: string, organizationName: string): Asset {
  const recommendedRefreshYear = deriveRecommendedRefreshYear(
    row.install_date,
    row.refresh_cycle_years,
  );

  return {
    id: row.id,
    organizationId,
    organizationName,
    spaceId: row.space_id,
    manufacturer: row.manufacturer,
    modelNumber: row.model_number,
    category: row.category,
    serialNumber: row.serial_number ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    macAddress: row.mac_address ?? undefined,
    installDate: row.install_date,
    cost: Number(row.cost),
    refreshCycleYears: row.refresh_cycle_years,
    recommendedRefreshYear,
    lifecycleStatus: deriveLifecycleStatus(recommendedRefreshYear),
    status: row.status,
  };
}

export interface ListAssetsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListAssetsResult {
  assets: Asset[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function listAssets(
  client: Client,
  organizationId: string,
  options: ListAssetsOptions = {},
  organizationName = "",
): Promise<ListAssetsResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(1000, Math.max(1, options.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = options.search?.trim() ?? "";

  let query = client
    .from("assets")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("manufacturer", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (search) {
    const pattern = `%${search.replaceAll("%", "\\%").replaceAll(",", " ")}%`;
    query = query.or(
      `manufacturer.ilike.${pattern},model_number.ilike.${pattern},category.ilike.${pattern},serial_number.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to load assets: ${error.message}`);
  }

  return {
    assets: ((data ?? []) as AssetRow[]).map((row) =>
      mapAssetRow(row, organizationId, organizationName),
    ),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAllAssets(
  client: Client,
  organizationId: string,
  organizationName = "",
): Promise<Asset[]> {
  const assets: Asset[] = [];
  let page = 1;

  while (true) {
    const result = await listAssets(
      client,
      organizationId,
      { page, pageSize: 1000 },
      organizationName,
    );
    assets.push(...result.assets);
    if (assets.length >= result.totalCount) {
      break;
    }
    page += 1;
  }

  return assets;
}

export async function getAssetChartSource(
  client: Client,
  organizationId: string,
): Promise<Array<{ manufacturer: string; category: string }>> {
  const pageSize = 1000;
  const rows: Array<{ manufacturer: string; category: string }> = [];
  let from = 0;

  for (;;) {
    const { data, error } = await client
      .from("assets")
      .select("manufacturer, category")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to load asset chart source: ${error.message}`);
    }

    rows.push(...((data ?? []) as Array<{ manufacturer: string; category: string }>));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export async function getAllAssetsForOrganizations(
  client: Client,
  organizationIds: string[],
  organizationNames: Map<string, string>,
): Promise<Asset[]> {
  const groups = await Promise.all(
    organizationIds.map((organizationId) =>
      getAllAssets(client, organizationId, organizationNames.get(organizationId) ?? "Unknown"),
    ),
  );
  return groups.flat();
}

export async function getSpaceById(
  client: Client,
  organizationId: string,
  spaceId: string,
  organizationName = "",
): Promise<Space | null> {
  const { data, error } = await client
    .from("spaces")
    .select(
      "id, name, space_type, commissioned_date, refresh_cycle_years, original_cost, planning_status, planned_refresh_year",
    )
    .eq("organization_id", organizationId)
    .eq("id", spaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load space: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const row = data as SpaceListRow;
  const [locations, assetCounts, forecastComponents] = await Promise.all([
    getSpaceLocations(client, [row.id]),
    getAssetCounts(client, organizationId, [row.id]),
    getForecastComponents(client, organizationId, [row.id]),
  ]);

  return mapSpaceRow(
    row,
    locations.get(row.id) ?? null,
    assetCounts.get(row.id) ?? 0,
    forecastComponents.get(row.id) ?? [],
    organizationId,
    organizationName,
  );
}

export async function getAssetsBySpaceId(
  client: Client,
  organizationId: string,
  spaceId: string,
  organizationName = "",
): Promise<Asset[]> {
  const { data, error } = await client
    .from("assets")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("space_id", spaceId)
    .eq("status", "active")
    .order("manufacturer", { ascending: true });

  if (error) {
    throw new Error(`Failed to load assets: ${error.message}`);
  }

  return ((data ?? []) as AssetRow[]).map((row) =>
    mapAssetRow(row, organizationId, organizationName),
  );
}

export async function getRefreshHistoryBySpaceId(
  client: Client,
  organizationId: string,
  spaceId: string,
): Promise<RefreshEvent[]> {
  const { data, error } = await client
    .from("refresh_events")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("space_id", spaceId)
    .order("event_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load refresh history: ${error.message}`);
  }

  return ((data ?? []) as RefreshEventRow[]).map((row) => ({
    id: row.id,
    spaceId: row.space_id,
    type: row.type,
    date: row.event_date,
    description: row.description,
    cost: row.cost === null ? undefined : Number(row.cost),
  }));
}

export async function getDashboardMetrics(
  client: Client,
  organizationId: string,
): Promise<DashboardMetrics> {
  const spaces = await getAllSpaces(client, organizationId);
  return computeDashboardMetrics(spaces);
}
