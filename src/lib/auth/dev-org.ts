import type { Organization } from "@/lib/database.types";

export function getDevOrganization(organizations: Organization[]): Organization | null {
  return organizations.find((organization) => organization.is_dev_org) ?? null;
}

export function isDevOrganization(organization: Organization): boolean {
  return organization.is_dev_org === true;
}

export function pickDefaultActiveOrganization(
  organizations: Organization[],
  preferredOrganizationId?: string,
): Organization | null {
  if (organizations.length === 0) {
    return null;
  }

  if (preferredOrganizationId) {
    const preferred = organizations.find((organization) => organization.id === preferredOrganizationId);
    if (preferred) {
      return preferred;
    }
  }

  const customerOrganization = organizations.find((organization) => !organization.is_dev_org);
  return customerOrganization ?? organizations[0] ?? null;
}
