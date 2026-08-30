import Link from "next/link";
import { FileUp, History } from "lucide-react";
import { ImportHistory } from "@/components/import/import-history";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      description={`Import history and file operations for ${auth.organization.name}`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/imports/add">
              <FileUp className="h-4 w-4" />
              Import New File
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/update-lifecycles">Choose import workflow</Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                No imports yet
              </CardTitle>
              <CardDescription>
                File imports record Add New Spaces, Full Refresh, and Partial Refresh workflows.
                Use Update Lifecycles to choose the right workflow, or import a file directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/imports/add">Start your first import</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ImportHistory jobs={jobs} />
        )}

        <p className="text-sm text-muted-foreground">
          Correct Inventory fixes data without creating import history events — use Update Lifecycles
          to access that workflow.
        </p>
      </div>
    </AuthenticatedDashboardShell>
  );
}
