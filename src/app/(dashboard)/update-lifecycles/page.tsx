import { Suspense } from "react";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { UpdateLifecyclesHub } from "@/components/update-lifecycles/update-lifecycles-hub";
import { requireAuthContext } from "@/lib/auth/context";
import { listImportJobs } from "@/lib/data/import-jobs";
import { listOrganizationMembers } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";

export default async function UpdateLifecyclesPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const [jobs, members] = await Promise.all([
    listImportJobs(supabase, auth.organization.id, 50),
    listOrganizationMembers(supabase, auth.organization.id),
  ]);

  const emails = new Map(members.map((member) => [member.userId, member.email]));

  return (
    <AuthenticatedDashboardShell
      title="Update Lifecycles"
      description="Choose a workflow, then provide the details that workflow needs."
    >
      <Suspense>
        <UpdateLifecyclesHub
          jobs={jobs.map((job) => ({
            ...job,
            userLabel: job.created_by ? (emails.get(job.created_by) ?? "—") : "—",
          }))}
        />
      </Suspense>
    </AuthenticatedDashboardShell>
  );
}
