import type { AuthContext } from "@/lib/auth/context";
import { getAllAssets, getAllSpaces } from "@/lib/data/spaces";
import type { Asset, Space } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface PlatformDashboardData {
  spaces: Space[];
  assets: Asset[];
  organizationOptions: { id: string; name: string }[];
  isAggregatedView: boolean;
}

/**
 * Loads dashboard inventory for the active organization only.
 * DEV org switching changes auth.organization; pages must not mix other tenants.
 */
export async function loadPlatformDashboardData(
  auth: AuthContext,
  supabase: Client,
  options: { includeAssets?: boolean; activeOrganizationOnly?: boolean } = {},
): Promise<PlatformDashboardData> {
  const includeAssets = options.includeAssets ?? true;
  const organizationName = auth.organization.name;
  const [spaces, assets] = await Promise.all([
    getAllSpaces(supabase, auth.organization.id, organizationName),
    includeAssets
      ? getAllAssets(supabase, auth.organization.id, organizationName)
      : Promise.resolve([]),
  ]);

  return {
    spaces,
    assets,
    organizationOptions: [{ id: auth.organization.id, name: organizationName }],
    isAggregatedView: false,
  };
}
