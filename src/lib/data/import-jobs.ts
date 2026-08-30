import type { ImportProcessResult } from "@/lib/import/process";
import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

type Client = Awaited<ReturnType<typeof createClient>>;

export type FileImportWorkflow = "add" | "full_refresh" | "partial_refresh";

export interface ImportJobRecord {
  id: string;
  workflow: FileImportWorkflow;
  source_filename: string | null;
  status: string;
  spaces_created: number;
  spaces_updated: number;
  assets_created: number;
  assets_updated: number;
  assets_retired: number;
  error_message: string | null;
  created_at: string;
  created_by: string | null;
}

export async function recordImportJob(
  client: Client,
  params: {
    organizationId: string;
    createdBy: string;
    workflow: FileImportWorkflow;
    sourceFilename: string;
    status: "completed" | "failed";
    result?: ImportProcessResult;
    errorMessage?: string;
  },
) {
  const { error } = await writable(client.from("import_jobs")).insert({
    organization_id: params.organizationId,
    created_by: params.createdBy,
    workflow: params.workflow,
    source_filename: params.sourceFilename,
    status: params.status,
    spaces_created: params.result?.spacesCreated ?? 0,
    spaces_updated: 0,
    assets_created: params.result?.assetsCreated ?? 0,
    assets_updated: params.result?.assetsUpdated ?? 0,
    assets_retired: params.result?.assetsRetired ?? 0,
    error_message: params.errorMessage ?? null,
  });

  if (error) {
    console.error("Failed to record import job:", error.message);
  }
}

export async function listImportJobs(
  client: Client,
  organizationId: string,
  limit = 20,
): Promise<ImportJobRecord[]> {
  const { data, error } = await client
    .from("import_jobs")
    .select(
      "id, workflow, source_filename, status, spaces_created, spaces_updated, assets_created, assets_updated, assets_retired, error_message, created_at, created_by",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load import history: ${error.message}`);
  }

  return (data ?? []) as ImportJobRecord[];
}
