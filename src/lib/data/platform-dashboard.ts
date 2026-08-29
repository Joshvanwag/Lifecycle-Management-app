import type { AuthContext } from "@/lib/auth/context";
import {
  buildOrganizationNameMap,
  getCustomerOrganizations,
} from "@/lib/auth/customer-orgs";
import {
  getAllAssets,
  getAllAssetsForOrganizations,
  getAllSpaces,
  getAllSpacesForOrganizations,
} from "@/lib/data/spaces";
import type { Asset, Space } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface PlatformDashboardData {
  spaces: Space[];
  assets: Asset[];
  organizationOptions: { id: string; name: string }[];
  isAggregatedView: boolean;
}

/** Loads dashboard inventory for the current auth context. */
export async function loadPlatformDashboardData(
  auth: AuthContext,
  supabase: Client,
): Promise<PlatformDashboardData> {
  if (!auth.isPlatformAdmin) {
    const organizationName = auth.organization.name;
    const [spaces, assets] = await Promise.all([
      getAllSpaces(supabase, auth.organization.id, organizationName),
      getAllAssets(supabase, auth.organization.id, organizationName),
    ]);

    return {
      spaces,
      assets,
      organizationOptions: [{ id: auth.organization.id, name: organizationName }],
      isAggregatedView: false,
    };
  }

  const customerOrganizations = getCustomerOrganizations(auth.organizations);
  const organizationIds = customerOrganizations.map((organization) => organization.id);
  const organizationNames = buildOrganizationNameMap(customerOrganizations);

  const [spaces, assets] = await Promise.all([
    getAllSpacesForOrganizations(supabase, organizationIds, organizationNames),
    getAllAssetsForOrganizations(supabase, organizationIds, organizationNames),
  ]);

  return {
    spaces,
    assets,
    organizationOptions: customerOrganizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
    })),
    isAggregatedView: true,
  };
}
