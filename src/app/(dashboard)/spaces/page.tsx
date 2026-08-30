import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { SpacesTable } from "@/components/spaces/spaces-table";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function SpacesPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const spaces = await getAllSpaces(supabase, auth.organization.id, auth.organization.name);

  return (
    <AuthenticatedDashboardShell
      title="Spaces"
      description="Manage lifecycle Spaces and understand upcoming replacement needs."
    >
      <SpacesTable spaces={spaces} />
    </AuthenticatedDashboardShell>
  );
}
