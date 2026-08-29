import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrganizationMembership } from "@/lib/database.types";

export interface AuthContext {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  organization: Organization;
  membership: OrganizationMembership;
}

function getDisplayName(email: string, metadata: Record<string, unknown>): string {
  const fullName = metadata.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  return email.split("@")[0] ?? "User";
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, user_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<OrganizationMembership>();

  if (membershipError || !membership) {
    return null;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .single<Organization>();

  if (organizationError || !organization) {
    return null;
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = getDisplayName(user.email, metadata);

  return {
    userId: user.id,
    email: user.email,
    displayName,
    initials: getInitials(displayName),
    organization,
    membership,
  };
});

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}
