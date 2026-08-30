"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { INDUSTRY_TYPE_CODES } from "@/lib/benchmark/constants";
import { recordAuditEvent } from "@/lib/data/audit";
import type { Database } from "@/lib/database.types";
import { recalculateOrganizationForecasts } from "@/lib/lifecycle/recompute";
import { createClient } from "@/lib/supabase/server";

type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

export async function updateOrganizationSettings(formData: FormData) {
  const auth = await requireAuthContext();

  if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
    redirect("/settings?error=unauthorized");
  }

  const industryType = String(formData.get("industryType") ?? "").trim();
  const benchmarkParticipation = formData.get("benchmarkParticipation") === "on";
  const floorsEnabled = formData.get("floorsEnabled") === "on";
  const refreshCycleYears = Number(formData.get("defaultRefreshCycleYears"));
  const inflationPercent = Number(formData.get("defaultInflationPercent"));

  if (!INDUSTRY_TYPE_CODES.includes(industryType as (typeof INDUSTRY_TYPE_CODES)[number])) {
    redirect("/settings?error=invalid-industry");
  }

  if (!Number.isFinite(refreshCycleYears) || refreshCycleYears < 1 || refreshCycleYears > 50) {
    redirect("/settings?error=invalid-lifecycle-defaults");
  }

  if (!Number.isFinite(inflationPercent) || inflationPercent < 0 || inflationPercent > 50) {
    redirect("/settings?error=invalid-lifecycle-defaults");
  }

  const inflationRate = inflationPercent / 100;

  const payload: OrganizationUpdate = {
    industry_type: industryType,
    benchmark_participation: benchmarkParticipation,
    floors_enabled: floorsEnabled,
    default_refresh_cycle_years: Math.round(refreshCycleYears),
    default_inflation_rate: inflationRate,
  };

  const supabase = await createClient();
  const organizations = supabase.from("organizations") as unknown as {
    update: (values: OrganizationUpdate) => {
      eq: (column: "id", value: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const { error } = await organizations.update(payload).eq("id", auth.organization.id);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  const inflationChanged = inflationRate !== Number(auth.organization.default_inflation_rate);
  if (inflationChanged) {
    await recalculateOrganizationForecasts(supabase, auth.organization.id, inflationRate);
  }

  await recordAuditEvent(supabase, {
    organizationId: auth.organization.id,
    actorUserId: auth.userId,
    action: "organization_settings_updated",
    targetType: "organization",
    targetId: auth.organization.id,
    metadata: {
      inflationChanged,
      floorsEnabled,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/spaces");
  redirect("/settings?saved=1");
}
