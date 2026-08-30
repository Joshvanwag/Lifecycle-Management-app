"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { INDUSTRY_TYPE_CODES } from "@/lib/benchmark/constants";
import { recordAuditEvent } from "@/lib/data/audit";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function requirePlatformAdmin(auth: Awaited<ReturnType<typeof requireAuthContext>>) {
  if (!auth.isPlatformAdmin) {
    redirect("/?error=unauthorized");
  }
}

export async function createOrganization(formData: FormData) {
  const auth = await requireAuthContext();
  requirePlatformAdmin(auth);

  const name = String(formData.get("name") ?? "").trim();
  const industryType = String(formData.get("industryType") ?? "other").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();

  if (!name || !ownerEmail) {
    redirect("/admin?error=missing-fields");
  }

  if (!INDUSTRY_TYPE_CODES.includes(industryType as (typeof INDUSTRY_TYPE_CODES)[number])) {
    redirect("/admin?error=invalid-industry");
  }

  const admin = createServiceRoleClient();

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({
      name,
      industry_type: industryType,
      benchmark_participation: true,
    })
    .select("id")
    .single();

  if (organizationError || !organization) {
    redirect(`/admin?error=${encodeURIComponent(organizationError?.message ?? "create-failed")}`);
  }

  const { error: invitationError } = await admin.from("organization_invitations").insert({
    organization_id: organization.id,
    email: ownerEmail,
    role: "owner",
    invited_by: auth.userId,
  });

  if (invitationError) {
    redirect(`/admin?error=${encodeURIComponent(invitationError.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?created=1");
}

export async function createInvitation(formData: FormData) {
  const auth = await requireAuthContext();

  const organizationId = String(formData.get("organizationId") ?? auth.organization.id).trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member").trim();
  const returnPath = String(formData.get("returnTo") ?? "/settings").trim() || "/settings";

  if (!email) {
    redirect(`${returnPath}?error=missing-email`);
  }

  if (!["owner", "admin", "member", "read_only"].includes(role)) {
    redirect(`${returnPath}?error=invalid-role`);
  }

  const canManageCurrentOrg =
    auth.isPlatformAdmin ||
    ((auth.membership.role === "owner" || auth.membership.role === "admin") &&
      organizationId === auth.organization.id);

  if (!canManageCurrentOrg) {
    redirect(`${returnPath}?error=unauthorized`);
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from("organization_invitations").insert({
    organization_id: organizationId,
    email,
    role: role as "owner" | "admin" | "member" | "read_only",
    invited_by: auth.userId,
  });

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  const supabase = await createClient();
  await recordAuditEvent(supabase, {
    organizationId,
    actorUserId: auth.userId,
    action: "user_invited",
    targetType: "invitation",
    metadata: { email, role },
  });

  revalidatePath("/settings");
  revalidatePath("/admin");
  redirect(`${returnPath}?invited=1`);
}

export async function revokeInvitation(formData: FormData) {
  const auth = await requireAuthContext();
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const returnPath = String(formData.get("returnTo") ?? "/admin").trim() || "/admin";

  if (!invitationId) {
    redirect(`${returnPath}?error=missing-invitation`);
  }

  const admin = createServiceRoleClient();
  const { data: invitation, error: readError } = await admin
    .from("organization_invitations")
    .select("id, organization_id, accepted_at, revoked_at")
    .eq("id", invitationId)
    .maybeSingle();

  if (readError || !invitation || invitation.accepted_at || invitation.revoked_at) {
    redirect(`${returnPath}?error=invalid-invitation`);
  }

  const canManage =
    auth.isPlatformAdmin ||
    ((auth.membership.role === "owner" || auth.membership.role === "admin") &&
      invitation.organization_id === auth.organization.id);

  if (!canManage) {
    redirect(`${returnPath}?error=unauthorized`);
  }

  const { error } = await admin
    .from("organization_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/settings");
  redirect(`${returnPath}?revoked=1`);
}
