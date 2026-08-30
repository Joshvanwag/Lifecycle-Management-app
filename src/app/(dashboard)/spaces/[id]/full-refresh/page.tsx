import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FullRefreshForm } from "@/components/lifecycle/full-refresh-form";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthContext } from "@/lib/auth/context";
import { getSpaceById } from "@/lib/data/spaces";
import { canWriteOrganization } from "@/lib/lifecycle/access";
import { lifecycleErrorMessage } from "@/lib/lifecycle/errors";
import { createClient } from "@/lib/supabase/server";

export default async function FullRefreshPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const space = await getSpaceById(supabase, auth.organization.id, id);

  if (!space) {
    notFound();
  }

  return (
    <AuthenticatedDashboardShell title={`Full refresh · ${space.name}`} description={space.locationLabel}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href={`/spaces/${space.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Space
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Full refresh</CardTitle>
            <CardDescription>
              Replace all active equipment. History is kept. To upload a file instead, use{" "}
              <Link href={`/imports/full-refresh?spaceId=${space.id}`} className="underline">
                Full Refresh import
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canWriteOrganization(auth.membership.role) ? (
              <FullRefreshForm
                spaceId={space.id}
                defaultCycleYears={space.refreshCycleYears}
                errorMessage={lifecycleErrorMessage(query.error)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                You have read-only access and cannot record a refresh.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedDashboardShell>
  );
}
