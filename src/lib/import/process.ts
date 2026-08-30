import { createClient } from "@/lib/supabase/server";
import { findOrCreateSpaceLocation } from "@/lib/data/locations";
import {
  applyColumnMap,
  groupRowsBySpace,
  rowHasAsset,
  spaceCostFromRows,
  toAssetInput,
  type ColumnMap,
  type MappedImportRow,
} from "@/lib/import/map-rows";
import type { AssetInput } from "@/lib/lifecycle/form-utils";
import {
  applyPartialRefreshComponents,
  syncSpaceComponentsFromInventory,
} from "@/lib/lifecycle/recompute";
import { writable } from "@/lib/supabase/writable";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface ImportProcessResult {
  spacesCreated: number;
  assetsCreated: number;
  assetsUpdated: number;
  assetsRetired: number;
  eventsCreated: number;
}

const ASSET_INSERT_BATCH = 250;

async function insertAssets(
  client: Client,
  organizationId: string,
  spaceId: string,
  assets: AssetInput[],
) {
  const rows = assets.map((asset) => ({
    organization_id: organizationId,
    space_id: spaceId,
    manufacturer: asset.manufacturer,
    model_number: asset.modelNumber,
    category: asset.category,
    install_date: asset.installDate,
    cost: asset.cost,
    refresh_cycle_years: asset.refreshCycleYears,
    serial_number: asset.serialNumber || null,
    ip_address: asset.ipAddress || null,
    mac_address: asset.macAddress || null,
    status: "active" as const,
  }));

  for (let index = 0; index < rows.length; index += ASSET_INSERT_BATCH) {
    const chunk = rows.slice(index, index + ASSET_INSERT_BATCH);
    const { error } = await writable(client.from("assets")).insert(chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
}

function assetsFromRows(rows: MappedImportRow[], fallbackCycle: number, fallbackDate: string) {
  return rows.filter(rowHasAsset).map((row) => toAssetInput(row, fallbackCycle, fallbackDate));
}

export async function processAddSpacesImport(
  client: Client,
  organizationId: string,
  defaults: { refreshCycleYears: number; inflationRate: number },
  rows: MappedImportRow[],
): Promise<ImportProcessResult> {
  const result: ImportProcessResult = {
    spacesCreated: 0,
    assetsCreated: 0,
    assetsUpdated: 0,
    assetsRetired: 0,
    eventsCreated: 0,
  };
  const today = new Date().toISOString().slice(0, 10);
  const groups = groupRowsBySpace(rows);

  for (const [, group] of groups) {
    const first = group[0];
    if (!first?.spaceName) {
      continue;
    }

    const commissionedDate = first.commissionedDate || first.installDate || today;
    const refreshCycleYears = Number(first.spaceRefreshCycleYears) || defaults.refreshCycleYears;
    const assets = assetsFromRows(group, refreshCycleYears, commissionedDate);
    const originalCost = spaceCostFromRows(group, assets);

    const { data, error } = await writable(client.from("spaces"))
      .insert({
        organization_id: organizationId,
        name: first.spaceName,
        space_type: first.spaceType || "Space",
        commissioned_date: commissionedDate,
        refresh_cycle_years: refreshCycleYears,
        original_cost: originalCost,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create Space");
    }

    const spaceId = data.id;
    await findOrCreateSpaceLocation(client, organizationId, spaceId, {
      campus: first.campus,
      building: first.building,
      room: first.room,
    });
    await insertAssets(client, organizationId, spaceId, assets);
    await writable(client.from("refresh_events")).insert({
      organization_id: organizationId,
      space_id: spaceId,
      type: "initial_deployment",
      event_date: commissionedDate,
      description: "Imported new Space",
      cost: originalCost,
    });
    await syncSpaceComponentsFromInventory(
      client,
      organizationId,
      {
        id: spaceId,
        originalCost,
        commissionedDate,
        refreshCycleYears,
      },
      defaults.inflationRate,
    );

    result.spacesCreated += 1;
    result.assetsCreated += assets.length;
    result.eventsCreated += 1;
  }

  return result;
}

export async function processFullRefreshImport(
  client: Client,
  params: {
    organizationId: string;
    spaceId: string;
    eventDate: string;
    refreshCycleYears: number;
    inflationRate: number;
    rows: MappedImportRow[];
  },
): Promise<ImportProcessResult> {
  const assets = assetsFromRows(params.rows, params.refreshCycleYears, params.eventDate);
  const originalCost = spaceCostFromRows(params.rows, assets);

  const { data: existing } = await client
    .from("assets")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("space_id", params.spaceId)
    .eq("status", "active");

  const { error: retireError } = await writable(client.from("assets"))
    .update({ status: "retired", removed_date: params.eventDate })
    .eq("organization_id", params.organizationId)
    .eq("space_id", params.spaceId)
    .eq("status", "active");
  if (retireError) {
    throw new Error(retireError.message);
  }

  await insertAssets(client, params.organizationId, params.spaceId, assets);
  const { error: spaceError } = await writable(client.from("spaces")).update({
    commissioned_date: params.eventDate,
    refresh_cycle_years: params.refreshCycleYears,
    original_cost: originalCost,
    planning_status: "completed",
  }).eq("id", params.spaceId).eq("organization_id", params.organizationId);
  if (spaceError) {
    throw new Error(spaceError.message);
  }

  await writable(client.from("refresh_events")).insert({
    organization_id: params.organizationId,
    space_id: params.spaceId,
    type: "full_refresh",
    event_date: params.eventDate,
    description: "Imported full refresh",
    cost: originalCost,
  });
  await syncSpaceComponentsFromInventory(
    client,
    params.organizationId,
    {
      id: params.spaceId,
      originalCost,
      commissionedDate: params.eventDate,
      refreshCycleYears: params.refreshCycleYears,
    },
    params.inflationRate,
  );

  return {
    spacesCreated: 0,
    assetsCreated: assets.length,
    assetsUpdated: 0,
    assetsRetired: ((existing ?? []) as Array<{ id: string }>).length,
    eventsCreated: 1,
  };
}

export async function processPartialRefreshImport(
  client: Client,
  params: {
    organizationId: string;
    spaceId: string;
    eventDate: string;
    refreshCycleYears: number;
    inflationRate: number;
    retiredAssetIds: string[];
    rows: MappedImportRow[];
  },
): Promise<ImportProcessResult> {
  if (params.retiredAssetIds.length === 0) {
    throw new Error("Select the assets being replaced.");
  }

  const { data: space, error: spaceError } = await client
    .from("spaces")
    .select("refresh_cycle_years")
    .eq("id", params.spaceId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();
  if (spaceError || !space) {
    throw new Error("Space not found.");
  }

  const assets = assetsFromRows(params.rows, params.refreshCycleYears, params.eventDate);
  const lumpAmount = spaceCostFromRows(params.rows, []);
  const newSpend = lumpAmount + assets.reduce((sum, asset) => sum + asset.cost, 0);
  const eventType = params.retiredAssetIds.length === 1 ? "individual_replacement" : "partial_refresh";

  const { error: retireError } = await writable(client.from("assets"))
    .update({ status: "retired", removed_date: params.eventDate })
    .eq("organization_id", params.organizationId)
    .eq("space_id", params.spaceId)
    .in("id", params.retiredAssetIds);
  if (retireError) {
    throw new Error(retireError.message);
  }

  await insertAssets(client, params.organizationId, params.spaceId, assets);
  await writable(client.from("refresh_events")).insert({
    organization_id: params.organizationId,
    space_id: params.spaceId,
    type: eventType,
    event_date: params.eventDate,
    description: "Imported partial refresh",
    cost: newSpend,
  });
  await applyPartialRefreshComponents(client, {
    organizationId: params.organizationId,
    spaceId: params.spaceId,
    inflationRate: params.inflationRate,
    retiredAssetIds: params.retiredAssetIds,
    newSpend,
    newSpendDate: params.eventDate,
    newLumpAmount: lumpAmount,
    newLumpCycleYears: params.refreshCycleYears,
    spaceRefreshCycleYears: (space as { refresh_cycle_years: number }).refresh_cycle_years,
  });

  return {
    spacesCreated: 0,
    assetsCreated: assets.length,
    assetsUpdated: 0,
    assetsRetired: params.retiredAssetIds.length,
    eventsCreated: 1,
  };
}

function normalizeMatch(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export async function processCorrectInventoryImport(
  client: Client,
  params: {
    organizationId: string;
    spaceId: string;
    refreshCycleYears: number;
    inflationRate: number;
    rows: MappedImportRow[];
  },
): Promise<ImportProcessResult> {
  const { data: space, error: spaceError } = await client
    .from("spaces")
    .select("id, name, space_type, commissioned_date, refresh_cycle_years, original_cost")
    .eq("id", params.spaceId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();
  if (spaceError || !space) {
    throw new Error("Space not found.");
  }

  const spaceRow = space as {
    id: string;
    name: string;
    space_type: string;
    commissioned_date: string;
    refresh_cycle_years: number;
    original_cost: number;
  };

  const { data: existingAssets, error: assetsError } = await client
    .from("assets")
    .select("id, manufacturer, model_number, serial_number, mac_address")
    .eq("organization_id", params.organizationId)
    .eq("space_id", params.spaceId)
    .eq("status", "active");
  if (assetsError) {
    throw new Error(assetsError.message);
  }

  const current = (existingAssets ?? []) as Array<{
    id: string;
    manufacturer: string;
    model_number: string;
    serial_number: string | null;
    mac_address: string | null;
  }>;

  let assetsCreated = 0;
  let assetsUpdated = 0;

  for (const row of params.rows) {
    if (!rowHasAsset(row) && !row.spaceCost && !row.spaceType) {
      continue;
    }

    const asset = toAssetInput(row, params.refreshCycleYears, spaceRow.commissioned_date);
    const serial = normalizeMatch(row.serialNumber);
    const mac = normalizeMatch(row.macAddress);
    const matched =
      current.find((item) => serial && normalizeMatch(item.serial_number) === serial) ??
      current.find((item) => mac && normalizeMatch(item.mac_address) === mac);

    if (matched) {
      const patch: Record<string, string | number | null> = {};
      if (row.manufacturer) {
        patch.manufacturer = asset.manufacturer;
      }
      if (row.modelNumber) {
        patch.model_number = asset.modelNumber;
      }
      if (row.category) {
        patch.category = asset.category;
      }
      if (row.installDate || row.commissionedDate) {
        patch.install_date = asset.installDate;
      }
      if (row.assetCost) {
        patch.cost = asset.cost;
      }
      if (row.assetRefreshCycleYears || row.replacementYear) {
        patch.refresh_cycle_years = asset.refreshCycleYears;
      }
      if (row.serialNumber) {
        patch.serial_number = asset.serialNumber || matched.serial_number;
      }
      if (row.ipAddress) {
        patch.ip_address = asset.ipAddress || null;
      }
      if (row.macAddress) {
        patch.mac_address = asset.macAddress || matched.mac_address;
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await writable(client.from("assets"))
          .update(patch)
          .eq("id", matched.id)
          .eq("organization_id", params.organizationId);
        if (error) {
          throw new Error(error.message);
        }
        assetsUpdated += 1;
      }
      continue;
    }

    if (rowHasAsset(row)) {
      await insertAssets(client, params.organizationId, params.spaceId, [asset]);
      assetsCreated += 1;
    }
  }

  const first = params.rows[0];
  const originalCost = first ? spaceCostFromRows(params.rows, []) || Number(spaceRow.original_cost) : Number(spaceRow.original_cost);
  const { error: spaceUpdateError } = await writable(client.from("spaces")).update({
    space_type: first?.spaceType || spaceRow.space_type,
    original_cost: originalCost,
  }).eq("id", params.spaceId).eq("organization_id", params.organizationId);
  if (spaceUpdateError) {
    throw new Error(spaceUpdateError.message);
  }

  await syncSpaceComponentsFromInventory(
    client,
    params.organizationId,
    {
      id: params.spaceId,
      originalCost,
      commissionedDate: spaceRow.commissioned_date,
      refreshCycleYears: spaceRow.refresh_cycle_years,
    },
    params.inflationRate,
  );

  return {
    spacesCreated: 0,
    assetsCreated,
    assetsUpdated,
    assetsRetired: 0,
    eventsCreated: 0,
  };
}

export function mappedRowsFromFile(
  rows: Array<Record<string, string>>,
  map: ColumnMap,
): MappedImportRow[] {
  return applyColumnMap(rows, map);
}
