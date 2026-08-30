import { WorkflowNextSteps } from "@/components/update-lifecycles/workflow-next-steps";
import { requireAuthContext } from "@/lib/auth/context";

export default async function AddNewSpacesWorkflowPage() {
  await requireAuthContext();

  return (
    <WorkflowNextSteps
      title="Add New Spaces"
      description="Add newly deployed Spaces and equipment to the lifecycle inventory."
      options={[
        {
          title: "Enter Spaces manually",
          description: "Create one Space at a time, with optional equipment.",
          href: "/spaces/new",
        },
        {
          title: "Import from file",
          description: "Upload a CSV or Excel file to add multiple Spaces.",
          href: "/imports/add",
        },
      ]}
    />
  );
}
