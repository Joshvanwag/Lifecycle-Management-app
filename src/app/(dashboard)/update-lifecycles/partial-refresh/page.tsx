import { SpaceWorkflowPicker } from "@/components/update-lifecycles/space-workflow-picker";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllSpaces } from "@/lib/data/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function PartialRefreshWorkflowPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const spaces = await getAllSpaces(supabase, auth.organization.id, auth.organization.name);

  return (
    <SpaceWorkflowPicker
      title="Partial Refresh"
      description="Select existing equipment being replaced, then add the new equipment."
      importHref="/imports/partial-refresh"
      importDescription="Upload a file after choosing the assets being replaced."
      spaceHref={(spaceId) => `/spaces/${spaceId}/partial-refresh`}
      spaces={spaces.map((space) => ({
        id: space.id,
        name: space.name,
        location: space.locationLabel,
      }))}
    />
  );
}
