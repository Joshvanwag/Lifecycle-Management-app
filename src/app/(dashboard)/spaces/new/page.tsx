import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddSpaceForm } from "@/components/lifecycle/add-space-form";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthContext } from "@/lib/auth/context";
import { canWriteOrganization } from "@/lib/lifecycle/access";
import { lifecycleErrorMessage } from "@/lib/lifecycle/errors";

export default async function NewSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await requireAuthContext();
  const params = await searchParams;

  return (
    <AuthenticatedDashboardShell title="Add Space" description="Create a new lifecycle-managed Space">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/spaces">
            <ArrowLeft className="h-4 w-4" />
            Back to Spaces
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>New Space</CardTitle>
            <CardDescription>
              Location is optional. Use a Space cost when you do not have per-item pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canWriteOrganization(auth.membership.role) ? (
              <AddSpaceForm
                defaultCycleYears={auth.organization.default_refresh_cycle_years}
                errorMessage={lifecycleErrorMessage(params.error)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                You have read-only access and cannot create Spaces.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedDashboardShell>
  );
}
