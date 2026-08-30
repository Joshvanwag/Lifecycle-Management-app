"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/context";
import { suggestColumnMap, type ImportWorkflow } from "@/lib/import/fields";
import { isImportFieldKey, validateColumnMap, type ColumnMap } from "@/lib/import/map-rows";
import { parseImportFile } from "@/lib/import/parse";
import {
  mappedRowsFromFile,
  processAddSpacesImport,
  processCorrectInventoryImport,
  processFullRefreshImport,
  processPartialRefreshImport,
  type ImportProcessResult,
} from "@/lib/import/process";
import { requireWriter } from "@/lib/lifecycle/access";
import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

export interface ImportPreview {
  headers: string[];
  suggestedMap: ColumnMap;
  rowCount: number;
  previewRows: Array<Record<string, string>>;
}

function parseColumnMap(raw: string): ColumnMap {
  const parsed = JSON.parse(raw) as Record<string, string>;
  const map: ColumnMap = {};
  for (const [header, field] of Object.entries(parsed)) {
    map[header] = field && isImportFieldKey(field) ? field : "";
  }
  return map;
}

type Client = Awaited<ReturnType<typeof createClient>>;

async function saveImportMapping(
  client: Client,
  organizationId: string,
  name: string,
  workflow: ImportWorkflow,
  map: ColumnMap,
) {
  const { data: existing } = await client
    .from("import_mappings")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("workflow", workflow)
    .ilike("name", name)
    .maybeSingle();

  const existingId = (existing as { id: string } | null)?.id;
  if (existingId) {
    const { error } = await writable(client.from("import_mappings"))
      .update({ column_map: map, updated_at: new Date().toISOString() })
      .eq("id", existingId)
      .eq("organization_id", organizationId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await writable(client.from("import_mappings")).insert({
    organization_id: organizationId,
    name,
    workflow,
    column_map: map,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function previewImport(formData: FormData): Promise<ImportPreview | { error: string }> {
  const auth = await requireAuthContext();
  requireWriter(auth, "/imports");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV or Excel file." };
  }

  try {
    const parsed = await parseImportFile(file);
    if (parsed.headers.length === 0) {
      return { error: "No header row found." };
    }
    return {
      headers: parsed.headers,
      suggestedMap: suggestColumnMap(parsed.headers),
      rowCount: parsed.rows.length,
      previewRows: parsed.rows.slice(0, 5),
    };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Could not read that file." };
  }
}

export async function runImport(
  formData: FormData,
): Promise<{ result: ImportProcessResult } | { error: string }> {
  const auth = await requireAuthContext();
  requireWriter(auth, "/imports");

  const workflow = String(formData.get("workflow") ?? "") as ImportWorkflow;
  const file = formData.get("file");
  const spaceId = String(formData.get("spaceId") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "") || new Date().toISOString().slice(0, 10);
  const retiredAssetIds = formData.getAll("retireAssetIds").map((value) => String(value));
  const mappingName = String(formData.get("mappingName") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV or Excel file." };
  }

  let map: ColumnMap;
  try {
    map = parseColumnMap(String(formData.get("columnMap") ?? "{}"));
    validateColumnMap(map, workflow);
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Column mapping is invalid." };
  }

  try {
    const parsed = await parseImportFile(file);
    const rows = mappedRowsFromFile(parsed.rows, map);
    const supabase = await createClient();
    const defaults = {
      refreshCycleYears: auth.organization.default_refresh_cycle_years,
      inflationRate: Number(auth.organization.default_inflation_rate),
    };

    let result: ImportProcessResult;
    if (workflow === "add") {
      result = await processAddSpacesImport(supabase, auth.organization.id, defaults, rows);
    } else if (workflow === "full_refresh") {
      if (!spaceId) return { error: "Select the Space being refreshed." };
      result = await processFullRefreshImport(supabase, {
        organizationId: auth.organization.id,
        spaceId,
        eventDate,
        refreshCycleYears: defaults.refreshCycleYears,
        inflationRate: defaults.inflationRate,
        rows,
      });
    } else if (workflow === "partial_refresh") {
      if (!spaceId) return { error: "Select the Space being refreshed." };
      result = await processPartialRefreshImport(supabase, {
        organizationId: auth.organization.id,
        spaceId,
        eventDate,
        refreshCycleYears: defaults.refreshCycleYears,
        inflationRate: defaults.inflationRate,
        retiredAssetIds,
        rows,
      });
    } else if (workflow === "correct") {
      if (!spaceId) return { error: "Select the Space to correct." };
      result = await processCorrectInventoryImport(supabase, {
        organizationId: auth.organization.id,
        spaceId,
        refreshCycleYears: defaults.refreshCycleYears,
        inflationRate: defaults.inflationRate,
        rows,
      });
    } else {
      return { error: "Unknown import action." };
    }

    if (mappingName) {
      try {
        await saveImportMapping(supabase, auth.organization.id, mappingName, workflow, map);
      } catch {
        // The import already succeeded; keep the reusable mapping optional.
      }
    }

    revalidatePath("/");
    revalidatePath("/spaces");
    revalidatePath("/imports");
    if (spaceId) {
      revalidatePath(`/spaces/${spaceId}`);
    }

    return { result };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Import failed." };
  }
}

export async function loadSavedMappings(workflow: ImportWorkflow) {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_mappings")
    .select("id, name, column_map")
    .eq("organization_id", auth.organization.id)
    .eq("workflow", workflow)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as Array<{ id: string; name: string; column_map: ColumnMap }>;
}
