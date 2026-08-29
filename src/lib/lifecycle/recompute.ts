import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";
import type { Database } from "@/lib/database.types";
import {
  buildInventoryComponents,
  computeCostComponent,
  recalculateForecastAmount,
  reduceLumpBasis,
  resolveInflationRate,
  type ComputedCostComponent,
} from "@/lib/lifecycle/engine";

type Client = Awaited<ReturnType<typeof createClient>>;
type ForecastInsert = Database["public"]["Tables"]["forecast_cost_components"]["Insert"];
type ForecastRow = Database["public"]["Tables"]["forecast_cost_components"]["Row"];

interface InventorySpace {
  originalCost: number;
  commissionedDate: string;
  refreshCycleYears: number;
}

interface ActiveAssetRow {
  id: string;
  cost: number;
  install_date: string;
  refresh_cycle_years: number;
}

function toInsert(
  organizationId: string,
  spaceId: string,
  component: ComputedCostComponent,
): ForecastInsert {
  return {
    organization_id: organizationId,
    space_id: spaceId,
    asset_id: component.assetId,
    cost_basis: component.costBasis,
    cost_basis_date: component.costBasisDate,
    refresh_cycle_years: component.refreshCycleYears,
    recommended_replacement_year: component.recommendedReplacementYear,
    inflation_rate: component.inflationRate,
    forecast_amount: component.forecastAmount,
  };
}

async function loadActiveAssets(
  client: Client,
  organizationId: string,
  spaceId: string,
): Promise<ActiveAssetRow[]> {
  const { data, error } = await client
    .from("assets")
    .select("id, cost, install_date, refresh_cycle_years")
    .eq("organization_id", organizationId)
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to load assets for forecast sync: ${error.message}`);
  }

  return (data ?? []) as ActiveAssetRow[];
}

async function replaceSpaceComponents(
  client: Client,
  organizationId: string,
  spaceId: string,
  components: ComputedCostComponent[],
) {
  const { error: deleteError } = await writable(client.from("forecast_cost_components"))
    .delete()
    .eq("organization_id", organizationId)
    .eq("space_id", spaceId);

  if (deleteError) {
    throw new Error(`Failed to clear forecast rows: ${deleteError.message}`);
  }

  if (components.length === 0) {
    return;
  }

  const { error: insertError } = await writable(client.from("forecast_cost_components"))
    .insert(components.map((component) => toInsert(organizationId, spaceId, component)));

  if (insertError) {
    throw new Error(`Failed to write forecast rows: ${insertError.message}`);
  }
}

export async function syncSpaceComponentsFromInventory(
  client: Client,
  organizationId: string,
  space: InventorySpace & { id: string },
  inflationRate: number,
) {
  const assets = await loadActiveAssets(client, organizationId, space.id);
  const components = buildInventoryComponents({
    originalCost: space.originalCost,
    commissionedDate: space.commissionedDate,
    refreshCycleYears: space.refreshCycleYears,
    inflationRate,
    activeAssets: assets.map((asset) => ({
      id: asset.id,
      cost: Number(asset.cost),
      installDate: asset.install_date,
      refreshCycleYears: asset.refresh_cycle_years,
    })),
  });

  await replaceSpaceComponents(client, organizationId, space.id, components);
}

export async function applyPartialRefreshComponents(
  client: Client,
  params: {
    organizationId: string;
    spaceId: string;
    inflationRate: number;
    retiredAssetIds: string[];
    newSpend: number;
    newSpendDate: string;
    newLumpAmount: number;
    newLumpCycleYears: number;
    spaceRefreshCycleYears: number;
  },
) {
  const { data, error } = await client
    .from("forecast_cost_components")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("space_id", params.spaceId);

  if (error) {
    throw new Error(`Failed to load forecast rows: ${error.message}`);
  }

  const existing = (data ?? []) as ForecastRow[];
  const retired = new Set(params.retiredAssetIds);
  const kept = existing.filter((row) => !row.asset_id || !retired.has(row.asset_id));
  const lumps = kept
    .filter((row) => row.asset_id === null)
    .sort((left, right) => left.cost_basis_date.localeCompare(right.cost_basis_date));
  const originalLump = lumps[0];
  const otherRows = kept.filter((row) => row.id !== originalLump?.id);

  const next: ComputedCostComponent[] = otherRows.map((row) =>
    computeCostComponent({
      assetId: row.asset_id,
      costBasis: Number(row.cost_basis),
      costBasisDate: row.cost_basis_date,
      refreshCycleYears: row.refresh_cycle_years,
      inflationRate: resolveInflationRate(Number(row.inflation_rate), params.inflationRate),
    }),
  );

  if (originalLump) {
    const reducedBasis = reduceLumpBasis({
      lumpCostBasis: Number(originalLump.cost_basis),
      lumpBasisDate: originalLump.cost_basis_date,
      newCost: params.newSpend,
      newCostDate: params.newSpendDate,
      inflationRate: resolveInflationRate(Number(originalLump.inflation_rate), params.inflationRate),
    });

    if (reducedBasis > 0) {
      next.push(
        computeCostComponent({
          assetId: null,
          costBasis: reducedBasis,
          costBasisDate: originalLump.cost_basis_date,
          refreshCycleYears: originalLump.refresh_cycle_years,
          inflationRate: resolveInflationRate(Number(originalLump.inflation_rate), params.inflationRate),
        }),
      );
    }
  }

  if (params.newLumpAmount > 0) {
    next.push(
      computeCostComponent({
        assetId: null,
        costBasis: params.newLumpAmount,
        costBasisDate: params.newSpendDate,
        refreshCycleYears: params.newLumpCycleYears || params.spaceRefreshCycleYears,
        inflationRate: params.inflationRate,
      }),
    );
  }

  const assets = await loadActiveAssets(client, params.organizationId, params.spaceId);
  const pricedAssets = assets.filter((asset) => Number(asset.cost) > 0);
  const existingAssetIds = new Set(next.map((component) => component.assetId).filter(Boolean));

  for (const asset of pricedAssets) {
    if (existingAssetIds.has(asset.id)) {
      continue;
    }
    next.push(
      computeCostComponent({
        assetId: asset.id,
        costBasis: Number(asset.cost),
        costBasisDate: asset.install_date,
        refreshCycleYears: asset.refresh_cycle_years,
        inflationRate: params.inflationRate,
      }),
    );
  }

  await replaceSpaceComponents(client, params.organizationId, params.spaceId, next);
}

export async function recalculateOrganizationForecasts(
  client: Client,
  organizationId: string,
  inflationRate: number,
) {
  const { data, error } = await client
    .from("forecast_cost_components")
    .select("id, cost_basis, cost_basis_date, recommended_replacement_year")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Failed to load forecast rows: ${error.message}`);
  }

  for (const row of (data ?? []) as Array<{
    id: string;
    cost_basis: number;
    cost_basis_date: string;
    recommended_replacement_year: number;
  }>) {
    const forecastAmount = recalculateForecastAmount(
      Number(row.cost_basis),
      inflationRate,
      row.cost_basis_date,
      row.recommended_replacement_year,
    );

    const { error: updateError } = await writable(client.from("forecast_cost_components"))
      .update({
        inflation_rate: inflationRate,
        forecast_amount: forecastAmount,
      })
      .eq("id", row.id)
      .eq("organization_id", organizationId);

    if (updateError) {
      throw new Error(`Failed to update forecast amount: ${updateError.message}`);
    }
  }
}

export async function backfillMissingSpaceForecasts(
  client: Client,
  organizationId: string,
  inflationRate: number,
) {
  const { data: spaces, error: spacesError } = await client
    .from("spaces")
    .select("id, original_cost, commissioned_date, refresh_cycle_years")
    .eq("organization_id", organizationId);

  if (spacesError) {
    throw new Error(`Failed to load spaces for forecast backfill: ${spacesError.message}`);
  }

  const { data: components, error: componentsError } = await client
    .from("forecast_cost_components")
    .select("space_id, forecast_amount, asset_id, cost_basis")
    .eq("organization_id", organizationId);

  if (componentsError) {
    throw new Error(`Failed to load forecast rows for backfill: ${componentsError.message}`);
  }

  const bySpace = new Map<
    string,
    Array<{ forecast_amount: number; asset_id: string | null; cost_basis: number }>
  >();
  for (const row of (components ?? []) as Array<{
    space_id: string;
    forecast_amount: number;
    asset_id: string | null;
    cost_basis: number;
  }>) {
    const list = bySpace.get(row.space_id) ?? [];
    list.push(row);
    bySpace.set(row.space_id, list);
  }

  for (const space of (spaces ?? []) as Array<{
    id: string;
    original_cost: number;
    commissioned_date: string;
    refresh_cycle_years: number;
  }>) {
    const rows = bySpace.get(space.id) ?? [];
    const lump = rows.find((row) => row.asset_id === null);
    const pricedComponents = rows.filter((row) => row.asset_id !== null);
    const doubleCounted =
      Boolean(lump) &&
      pricedComponents.length > 0 &&
      Number(lump?.cost_basis ?? 0) >= Number(space.original_cost) - 0.01;
    const totalForecast = rows.reduce((sum, row) => sum + Number(row.forecast_amount), 0);
    const needsRebuild =
      rows.length === 0 ||
      doubleCounted ||
      (Number(space.original_cost) > 0 && totalForecast === 0);

    if (!needsRebuild) {
      continue;
    }

    await syncSpaceComponentsFromInventory(
      client,
      organizationId,
      {
        id: space.id,
        originalCost: Number(space.original_cost),
        commissionedDate: space.commissioned_date,
        refreshCycleYears: space.refresh_cycle_years,
      },
      inflationRate,
    );
  }
}
