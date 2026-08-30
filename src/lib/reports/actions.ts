"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/context";
import { createSavedReport, deleteSavedReport } from "@/lib/data/saved-reports";
import { createClient } from "@/lib/supabase/server";

export async function saveReportFilter(formData: FormData) {
  const auth = await requireAuthContext();
  const name = String(formData.get("name") ?? "").trim();
  const reportKey = String(formData.get("reportKey") ?? "").trim();
  const search = String(formData.get("search") ?? "").trim();
  const spaceType = String(formData.get("spaceType") ?? "").trim();

  if (!name || !reportKey) {
    return;
  }

  const supabase = await createClient();
  await createSavedReport(supabase, {
    organizationId: auth.organization.id,
    userId: auth.userId,
    name,
    reportKey,
    filters: { search, spaceType },
  });
  revalidatePath("/reports");
}

export async function removeSavedReport(formData: FormData) {
  const auth = await requireAuthContext();
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (!reportId) {
    return;
  }

  const supabase = await createClient();
  await deleteSavedReport(supabase, auth.organization.id, auth.userId, reportId);
  revalidatePath("/reports");
}
