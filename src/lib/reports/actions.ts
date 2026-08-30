"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/context";
import { createSavedReport, deleteSavedReport } from "@/lib/data/saved-reports";
import { createClient } from "@/lib/supabase/server";

export async function saveCustomReport(formData: FormData) {
  const auth = await requireAuthContext();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const filters: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "name") continue;
    filters[key] = String(value);
  }

  const supabase = await createClient();
  await createSavedReport(supabase, {
    organizationId: auth.organization.id,
    userId: auth.userId,
    name,
    reportKey: "custom",
    filters,
  });
  revalidatePath("/reports");
}

export async function removeSavedReport(formData: FormData) {
  const auth = await requireAuthContext();
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (!reportId) return;

  const supabase = await createClient();
  await deleteSavedReport(supabase, auth.organization.id, auth.userId, reportId);
  revalidatePath("/reports");
}

// Backward compatibility for any legacy forms
export async function saveReportFilter(formData: FormData) {
  await saveCustomReport(formData);
}
