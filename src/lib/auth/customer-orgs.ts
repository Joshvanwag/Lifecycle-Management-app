import type { Organization } from "@/lib/database.types";

/** Customer tenants only — excludes the DEV platform organization. */
export function getCustomerOrganizations(organizations: Organization[]): Organization[] {
  return organizations.filter((organization) => !organization.is_dev_org);
}

export function buildOrganizationNameMap(
  organizations: Organization[],
): Map<string, string> {
  return new Map(organizations.map((organization) => [organization.id, organization.name]));
}
