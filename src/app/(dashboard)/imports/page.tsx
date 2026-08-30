import Link from "next/link";
import { FileUp } from "lucide-react";
import { ImportHistory } from "@/components/import/import-history";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { importActions } from "@/config/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { listImportJobs } from "@/lib/data/import-jobs";
import { createClient } from "@/lib/supabase/server";

export default async function ImportsPage() {
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const jobs = await listImportJobs(supabase, auth.organization.id);

  return (
    <AuthenticatedDashboardShell
      title="Imports"
      description={`Upload inventory for ${auth.organization.name}`}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2">
          {importActions.map((action) => (
            <Button key={action.href} asChild>
              <Link href={action.href}>
                <FileUp className="h-4 w-4" />
                {action.title}
              </Link>
            </Button>
          ))}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          File imports add Spaces or record a Full or Partial Refresh. To fix existing inventory
          without a lifecycle event, use Correct Inventory.
        </p>
        <ImportHistory jobs={jobs} />
      </div>
    </AuthenticatedDashboardShell>
  );
}
