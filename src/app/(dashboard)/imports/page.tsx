import Link from "next/link";
import { FileUp } from "lucide-react";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { importActions } from "@/config/navigation";

export default function ImportsPage() {
  return (
    <AuthenticatedDashboardShell
      title="Imports"
      description="Upload inventory from a CSV or Excel file"
    >
      <div className="space-y-6">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choose the action that matches what you are doing. Columns are mapped automatically when
          the heading is recognized. You can also record these actions on a Space without a file.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {importActions.map((action) => (
            <Link key={action.href} href={action.href} className="block">
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileUp className="h-4 w-4" />
                  </div>
                  <CardTitle>{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary">Start import</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedDashboardShell>
  );
}
