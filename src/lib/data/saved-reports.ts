import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface SavedReport {
  id: string;
  name: string;
  reportKey: string;
  filters: Record<string, string>;
  createdAt: string;
}

export async function listSavedReports(
  client: Client,
  organizationId: string,
  userId: string,
): Promise<SavedReport[]> {
  const { data, error } = await client
    .from("saved_reports")
    .select("id, name, report_key, filters, created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load saved reports: ${error.message}`);
  }

  return ((data ?? []) as Array<{
    id: string;
    name: string;
    report_key: string;
    filters: Json;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    reportKey: row.report_key,
    filters: (row.filters ?? {}) as Record<string, string>,
    createdAt: row.created_at,
  }));
}

export async function createSavedReport(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    name: string;
    reportKey: string;
    filters: Record<string, string>;
  },
) {
  const { error } = await writable(client.from("saved_reports")).insert({
    organization_id: params.organizationId,
    user_id: params.userId,
    name: params.name,
    report_key: params.reportKey,
    filters: params.filters,
  });

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }
}

export async function deleteSavedReport(
  client: Client,
  organizationId: string,
  userId: string,
  reportId: string,
) {
  const { error } = await writable(client.from("saved_reports"))
    .delete()
    .eq("id", reportId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete saved report: ${error.message}`);
  }
}
