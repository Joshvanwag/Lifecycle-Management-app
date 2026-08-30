import { SpaceWorkflowPicker } from "@/components/update-lifecycles/space-workflow-picker";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function FullRefreshWorkflowPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const spaces = await getAllSpaces(supabase, auth.organization.id, auth.organization.name);

  return (
    <SpaceWorkflowPicker
      title="Full Refresh"
      description="Replace the active inventory for an existing Space and restart its full lifecycle."
      importHref="/imports/full-refresh"
      importDescription="Upload a file to refresh one or more Spaces."
      spaceHref={(spaceId) => `/spaces/${spaceId}/full-refresh`}
      spaces={spaces.map((space) => ({
        id: space.id,
        name: space.name,
        location: space.locationLabel,
      }))}
    />
  );
}
