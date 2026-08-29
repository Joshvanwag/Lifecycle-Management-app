"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { findOrCreateSpaceLocation } from "@/lib/data/locations";
import { requireWriter } from "@/lib/lifecycle/access";
import {
  parseAssetsJson,
  parseMoney,
  parsePositiveInt,
  parseYear,
  type AssetInput,
} from "@/lib/lifecycle/form-utils";
import { toPlanningStatus } from "@/lib/lifecycle/display";
import {
  applyPartialRefreshComponents,
  syncSpaceComponentsFromInventory,
} from "@/lib/lifecycle/recompute";
import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

function revalidateSpacePaths(spaceId?: string) {
  revalidatePath("/");
  revalidatePath("/spaces");
  if (spaceId) {
    revalidatePath(`/spaces/${spaceId}`);
  }
}

async function insertAssets(
  client: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  spaceId: string,
  assets: AssetInput[],
) {
  for (const asset of assets) {
    const { error } = await writable(client.from("assets")).insert({
      organization_id: organizationId,
      space_id: spaceId,
      manufacturer: asset.manufacturer,
      model_number: asset.modelNumber,
      category: asset.category,
      install_date: asset.installDate,
      cost: asset.cost,
      refresh_cycle_years: asset.refreshCycleYears,
      status: "active",
    });
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function updatePlanningStatus(formData: FormData) {
  const auth = await requireAuthContext();
  const spaceId = String(formData.get("spaceId") ?? "");
  requireWriter(auth, `/spaces/${spaceId}`);

  const planningStatus = toPlanningStatus(String(formData.get("planningStatus") ?? "unplanned"));
  const plannedRefreshYear = parseYear(formData.get("plannedRefreshYear"));

  const supabase = await createClient();
  const { error } = await writable(supabase.from("spaces"))
    .update({
      planning_status: planningStatus,
      planned_refresh_year: plannedRefreshYear,
    })
    .eq("id", spaceId)
    .eq("organization_id", auth.organization.id);

  if (error) {
    redirect(`/spaces/${spaceId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateSpacePaths(spaceId);
  redirect(`/spaces/${spaceId}?saved=planning`);
}

export async function createSpace(formData: FormData) {
  const auth = await requireAuthContext();
  requireWriter(auth, "/spaces/new");

  const name = String(formData.get("name") ?? "").trim();
  const spaceType = String(formData.get("spaceType") ?? "").trim();
  const commissionedDate = String(formData.get("commissionedDate") ?? "").trim();
  const refreshCycleYears = parsePositiveInt(
    formData.get("refreshCycleYears"),
    auth.organization.default_refresh_cycle_years,
  );
  const originalCost = parseMoney(formData.get("originalCost"));
  const assets = parseAssetsJson(formData.get("assetsJson"), refreshCycleYears);

  if (!name || !spaceType || !commissionedDate) {
    redirect("/spaces/new?error=missing-fields");
  }

  const supabase = await createClient();
  const { data, error } = await writable(supabase.from("spaces"))
    .insert({
      organization_id: auth.organization.id,
      name,
      space_type: spaceType,
      commissioned_date: commissionedDate,
      refresh_cycle_years: refreshCycleYears,
      original_cost: originalCost,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/spaces/new?error=${encodeURIComponent(error?.message ?? "Failed to create Space")}`);
  }

  const spaceId = (data as { id: string }).id;

  try {
    await findOrCreateSpaceLocation(supabase, auth.organization.id, spaceId, {
      campus: String(formData.get("campus") ?? ""),
      building: String(formData.get("building") ?? ""),
      room: String(formData.get("room") ?? ""),
    });
    await insertAssets(supabase, auth.organization.id, spaceId, assets);
    await writable(supabase.from("refresh_events")).insert({
      organization_id: auth.organization.id,
      space_id: spaceId,
      type: "initial_deployment",
      event_date: commissionedDate,
      description: "Initial Space deployment",
      cost: originalCost,
    });
    await syncSpaceComponentsFromInventory(
      supabase,
      auth.organization.id,
      {
        id: spaceId,
        originalCost,
        commissionedDate,
        refreshCycleYears,
      },
      Number(auth.organization.default_inflation_rate),
    );
  } catch (cause) {
    redirect(
      `/spaces/new?error=${encodeURIComponent(cause instanceof Error ? cause.message : "Failed to finish Space setup")}`,
    );
  }

  revalidateSpacePaths(spaceId);
  redirect(`/spaces/${spaceId}`);
}

export async function recordFullRefresh(formData: FormData) {
  const auth = await requireAuthContext();
  const spaceId = String(formData.get("spaceId") ?? "");
  requireWriter(auth, `/spaces/${spaceId}/full-refresh`);

  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const refreshCycleYears = parsePositiveInt(
    formData.get("refreshCycleYears"),
    auth.organization.default_refresh_cycle_years,
  );
  const lumpAmount = parseMoney(formData.get("lumpAmount"));
  const assets = parseAssetsJson(formData.get("assetsJson"), refreshCycleYears);

  if (!spaceId || !eventDate) {
    redirect(`/spaces/${spaceId}/full-refresh?error=missing-fields`);
  }

  const supabase = await createClient();
  const { data: existingAssets, error: loadError } = await supabase
    .from("assets")
    .select("id")
    .eq("organization_id", auth.organization.id)
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (loadError) {
    redirect(`/spaces/${spaceId}/full-refresh?error=${encodeURIComponent(loadError.message)}`);
  }

  const originalCost =
    lumpAmount + assets.reduce((sum, asset) => sum + asset.cost, 0);

  const { error: retireError } = await writable(supabase.from("assets"))
    .update({ status: "retired", removed_date: eventDate })
    .eq("organization_id", auth.organization.id)
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (retireError) {
    redirect(`/spaces/${spaceId}/full-refresh?error=${encodeURIComponent(retireError.message)}`);
  }

  try {
    await insertAssets(supabase, auth.organization.id, spaceId, assets);
    const { error: spaceError } = await writable(supabase.from("spaces"))
      .update({
        commissioned_date: eventDate,
        refresh_cycle_years: refreshCycleYears,
        original_cost: originalCost,
        planning_status: "completed",
      })
      .eq("id", spaceId)
      .eq("organization_id", auth.organization.id);
    if (spaceError) {
      throw new Error(spaceError.message);
    }

    const { error: eventError } = await writable(supabase.from("refresh_events")).insert({
      organization_id: auth.organization.id,
      space_id: spaceId,
      type: "full_refresh",
      event_date: eventDate,
      description: description || "Full Space refresh",
      cost: originalCost,
    });
    if (eventError) {
      throw new Error(eventError.message);
    }

    await syncSpaceComponentsFromInventory(
      supabase,
      auth.organization.id,
      {
        id: spaceId,
        originalCost,
        commissionedDate: eventDate,
        refreshCycleYears,
      },
      Number(auth.organization.default_inflation_rate),
    );
  } catch (cause) {
    redirect(
      `/spaces/${spaceId}/full-refresh?error=${encodeURIComponent(cause instanceof Error ? cause.message : "Full refresh failed")}`,
    );
  }

  void existingAssets;
  revalidateSpacePaths(spaceId);
  redirect(`/spaces/${spaceId}`);
}

export async function recordPartialRefresh(formData: FormData) {
  const auth = await requireAuthContext();
  const spaceId = String(formData.get("spaceId") ?? "");
  requireWriter(auth, `/spaces/${spaceId}/partial-refresh`);

  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const retiredAssetIds = formData.getAll("retireAssetIds").map((value) => String(value));
  const lumpAmount = parseMoney(formData.get("lumpAmount"));
  const refreshCycleYears = parsePositiveInt(
    formData.get("refreshCycleYears"),
    auth.organization.default_refresh_cycle_years,
  );
  const assets = parseAssetsJson(formData.get("assetsJson"), refreshCycleYears);

  if (!spaceId || !eventDate) {
    redirect(`/spaces/${spaceId}/partial-refresh?error=missing-fields`);
  }
  if (retiredAssetIds.length === 0) {
    redirect(`/spaces/${spaceId}/partial-refresh?error=select-assets`);
  }

  const supabase = await createClient();
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("refresh_cycle_years")
    .eq("id", spaceId)
    .eq("organization_id", auth.organization.id)
    .maybeSingle();

  if (spaceError || !space) {
    redirect(`/spaces/${spaceId}/partial-refresh?error=space-not-found`);
  }

  const { error: retireError } = await writable(supabase.from("assets"))
    .update({ status: "retired", removed_date: eventDate })
    .eq("organization_id", auth.organization.id)
    .eq("space_id", spaceId)
    .in("id", retiredAssetIds);

  if (retireError) {
    redirect(`/spaces/${spaceId}/partial-refresh?error=${encodeURIComponent(retireError.message)}`);
  }

  const newSpend = lumpAmount + assets.reduce((sum, asset) => sum + asset.cost, 0);
  const eventType = retiredAssetIds.length === 1 ? "individual_replacement" : "partial_refresh";

  try {
    await insertAssets(supabase, auth.organization.id, spaceId, assets);
    const { error: eventError } = await writable(supabase.from("refresh_events")).insert({
      organization_id: auth.organization.id,
      space_id: spaceId,
      type: eventType,
      event_date: eventDate,
      description:
        description ||
        (eventType === "individual_replacement"
          ? "Individual asset replacement"
          : "Partial Space refresh"),
      cost: newSpend,
    });
    if (eventError) {
      throw new Error(eventError.message);
    }

    await applyPartialRefreshComponents(supabase, {
      organizationId: auth.organization.id,
      spaceId,
      inflationRate: Number(auth.organization.default_inflation_rate),
      retiredAssetIds,
      newSpend,
      newSpendDate: eventDate,
      newLumpAmount: lumpAmount,
      newLumpCycleYears: refreshCycleYears,
      spaceRefreshCycleYears: (space as { refresh_cycle_years: number }).refresh_cycle_years,
    });
  } catch (cause) {
    redirect(
      `/spaces/${spaceId}/partial-refresh?error=${encodeURIComponent(cause instanceof Error ? cause.message : "Partial refresh failed")}`,
    );
  }

  revalidateSpacePaths(spaceId);
  redirect(`/spaces/${spaceId}`);
}

export async function correctInventory(formData: FormData) {
  const auth = await requireAuthContext();
  const spaceId = String(formData.get("spaceId") ?? "");
  requireWriter(auth, `/spaces/${spaceId}/correct`);

  const name = String(formData.get("name") ?? "").trim();
  const spaceType = String(formData.get("spaceType") ?? "").trim();
  const commissionedDate = String(formData.get("commissionedDate") ?? "").trim();
  const refreshCycleYears = parsePositiveInt(
    formData.get("refreshCycleYears"),
    auth.organization.default_refresh_cycle_years,
  );
  const originalCost = parseMoney(formData.get("originalCost"));

  if (!spaceId || !name || !spaceType || !commissionedDate) {
    redirect(`/spaces/${spaceId}/correct?error=missing-fields`);
  }

  const supabase = await createClient();
  const { error: spaceError } = await writable(supabase.from("spaces"))
    .update({
      name,
      space_type: spaceType,
      commissioned_date: commissionedDate,
      refresh_cycle_years: refreshCycleYears,
      original_cost: originalCost,
    })
    .eq("id", spaceId)
    .eq("organization_id", auth.organization.id);

  if (spaceError) {
    redirect(`/spaces/${spaceId}/correct?error=${encodeURIComponent(spaceError.message)}`);
  }

  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .select("id")
    .eq("organization_id", auth.organization.id)
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (assetsError) {
    redirect(`/spaces/${spaceId}/correct?error=${encodeURIComponent(assetsError.message)}`);
  }

  for (const asset of (assets ?? []) as Array<{ id: string }>) {
    const prefix = `asset-${asset.id}-`;
    const { error } = await writable(supabase.from("assets"))
      .update({
        manufacturer: String(formData.get(`${prefix}manufacturer`) ?? "").trim(),
        model_number: String(formData.get(`${prefix}modelNumber`) ?? "").trim(),
        category: String(formData.get(`${prefix}category`) ?? "").trim(),
        install_date: String(formData.get(`${prefix}installDate`) ?? ""),
        cost: parseMoney(formData.get(`${prefix}cost`)),
        refresh_cycle_years: parsePositiveInt(formData.get(`${prefix}refreshCycleYears`), refreshCycleYears),
      })
      .eq("id", asset.id)
      .eq("organization_id", auth.organization.id);

    if (error) {
      redirect(`/spaces/${spaceId}/correct?error=${encodeURIComponent(error.message)}`);
    }
  }

  try {
    await syncSpaceComponentsFromInventory(
      supabase,
      auth.organization.id,
      {
        id: spaceId,
        originalCost,
        commissionedDate,
        refreshCycleYears,
      },
      Number(auth.organization.default_inflation_rate),
    );
  } catch (cause) {
    redirect(
      `/spaces/${spaceId}/correct?error=${encodeURIComponent(cause instanceof Error ? cause.message : "Failed to update forecast")}`,
    );
  }

  revalidateSpacePaths(spaceId);
  redirect(`/spaces/${spaceId}?saved=inventory`);
}
