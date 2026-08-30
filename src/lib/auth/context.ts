import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/auth/constants";
import { pickDefaultActiveOrganization } from "@/lib/auth/dev-org";
import { userHasDevOrgAccess } from "@/lib/auth/platform-admin";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrganizationMembership } from "@/lib/database.types";

export interface AuthContext {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  isPlatformAdmin: boolean;
  devOrganization: Organization | null;
  organization: Organization;
  membership: OrganizationMembership;
  organizations: Organization[];
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

function syntheticMembership(organizationId: string): OrganizationMembership {
  return {
    id: "dev-org-access",
    organization_id: organizationId,
    user_id: "dev-org-access",
    role: "owner",
    created_at: new Date(0).toISOString(),
  };
}

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const isPlatformAdmin = await userHasDevOrgAccess();

  const { data: membershipRows, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, user_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const memberships = (membershipRows ?? []) as OrganizationMembership[];

  if (membershipError) {
    return null;
  }

  let organizations: Organization[] = [];

  if (isPlatformAdmin) {
    const { data: allOrganizationRows, error: organizationsError } = await supabase
      .from("organizations")
      .select("*")
      .order("name", { ascending: true });

    const allOrganizations = (allOrganizationRows ?? []) as Organization[];

    if (organizationsError || !allOrganizations.length) {
      return null;
    }

    organizations = allOrganizations;
  } else {
    if (!memberships.length) {
      return null;
    }

    const organizationIds = memberships.map((membership) => membership.organization_id);
    const { data: memberOrganizationRows, error: organizationsError } = await supabase
      .from("organizations")
      .select("*")
      .in("id", organizationIds)
      .order("name", { ascending: true });

    const memberOrganizations = (memberOrganizationRows ?? []) as Organization[];

    if (organizationsError || !memberOrganizations.length) {
      return null;
    }

    organizations = memberOrganizations;
  }

  const devOrganization = organizations.find((organization) => organization.is_dev_org) ?? null;

  const cookieStore = await cookies();
  const preferredOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value;

  const organization =
    pickDefaultActiveOrganization(organizations, preferredOrganizationId) ?? organizations[0]!;

  const membership =
    memberships.find((entry) => entry.organization_id === organization.id) ??
    (isPlatformAdmin ? syntheticMembership(organization.id) : null);

  if (!membership) {
    return null;
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = getDisplayName(user.email, metadata);

  return {
    userId: user.id,
    email: user.email,
    displayName,
    initials: getInitials(displayName),
    isPlatformAdmin,
    devOrganization,
    organization,
    membership,
    organizations,
  };
});

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login?error=no-organization");
  }
  return context;
}
