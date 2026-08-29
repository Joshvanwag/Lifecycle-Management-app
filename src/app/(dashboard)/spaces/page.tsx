import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { SpacesTable } from "@/components/spaces/spaces-table";
import { requireAuthContext } from "@/lib/auth/context";
import { listSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { spaces, totalCount } = await listSpaces(supabase, auth.organization.id, {
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <AuthenticatedDashboardShell
      title="Spaces"
      description={`${totalCount} Spaces in ${auth.organization.name}`}
    >
      <SpacesTable
        spaces={spaces}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </AuthenticatedDashboardShell>
  );
}
