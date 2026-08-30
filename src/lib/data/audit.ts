import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function recordAuditEvent(
  client: Client,
  params: {
    organizationId: string;
    actorUserId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, Json | undefined>;
  },
) {
  const { error } = await writable(client.from("admin_audit_events")).insert({
    organization_id: params.organizationId,
    actor_user_id: params.actorUserId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("Failed to record audit event:", error.message);
  }
}

export async function listAuditEvents(client: Client, organizationId: string, limit = 25) {
  const { data, error } = await client
    .from("admin_audit_events")
    .select("id, action, target_type, target_id, metadata, created_at, actor_user_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load audit events: ${error.message}`);
  }

  return data ?? [];
}
