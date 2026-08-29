import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SpacesTable } from "@/components/spaces/spaces-table";
import { requireAuthContext } from "@/lib/auth/context";
import { listSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function SpacesPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const { spaces, totalCount } = await listSpaces(supabase, auth.organization.id, {
    page: 1,
    pageSize: 50,
  });

  return (
    <DashboardShell
      title="Spaces"
      description={`${totalCount} Spaces in ${auth.organization.name}`}
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
    >
      <SpacesTable spaces={spaces} totalCount={totalCount} />
    </DashboardShell>
  );
}
