import Link from "next/link";
import { ArrowRight, FileUp } from "lucide-react";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { lifecycleActionCards } from "@/config/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UpdateLifecyclesPage() {
  const auth = await requireAuthContext();

  return (
    <AuthenticatedDashboardShell
      title="Update Lifecycles"
      description="Choose how you want to update your current lifecycle inventory."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {lifecycleActionCards.map((action) => (
          <Card
            key={action.title}
            className="flex flex-col transition-colors hover:border-primary/30"
          >
            <CardHeader>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-2">
              <Link
                href={action.href}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start
                <ArrowRight className="h-4 w-4" />
              </Link>
              {action.importHref && (
                <Link
                  href={action.importHref}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <FileUp className="h-4 w-4" />
                  Import from file
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Updating inventory for {auth.organization.name}. Each workflow preserves lifecycle history
        according to its rules — Correct Inventory never creates refresh events.
      </p>
    </AuthenticatedDashboardShell>
  );
}
