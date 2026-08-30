import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ImportWizard } from "@/components/import/import-wizard";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthContext } from "@/lib/auth/context";
import { getAllAssets } from "@/lib/data/spaces";
import { loadSavedMappings } from "@/lib/import/actions";
import { workflowDescription, workflowFromSlug, workflowLabel } from "@/lib/import/fields";
import { canWriteOrganization } from "@/lib/lifecycle/access";
import { createClient } from "@/lib/supabase/server";

export default async function ImportWorkflowPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflow: string }>;
  searchParams: Promise<{ spaceId?: string }>;
}) {
  const { workflow: slug } = await params;
  const workflow = workflowFromSlug(slug);
  if (!workflow) {
    notFound();
  }

  const query = await searchParams;
  const auth = await requireAuthContext();
  const supabase = await createClient();

  const [{ data: spaceRows }, assets, savedMappings] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name")
      .eq("organization_id", auth.organization.id)
      .order("name", { ascending: true }),
    workflow === "partial_refresh"
      ? getAllAssets(supabase, auth.organization.id)
      : Promise.resolve([]),
    loadSavedMappings(workflow),
  ]);

  const spaces = ((spaceRows ?? []) as Array<{ id: string; name: string }>).map((space) => ({
    id: space.id,
    name: space.name,
  }));

  const assetsBySpace: Record<
    string,
    Array<{ id: string; manufacturer: string; modelNumber: string; category: string }>
  > = {};
  for (const asset of assets) {
    const list = assetsBySpace[asset.spaceId] ?? [];
    list.push({
      id: asset.id,
      manufacturer: asset.manufacturer,
      modelNumber: asset.modelNumber,
      category: asset.category,
    });
    assetsBySpace[asset.spaceId] = list;
  }

  const title = workflowLabel(workflow);

  return (
    <AuthenticatedDashboardShell title={`${title} import`} description="CSV or Excel">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/imports">
            <ArrowLeft className="h-4 w-4" />
            Back to Imports
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{workflowDescription(workflow)}</CardDescription>
          </CardHeader>
          <CardContent>
            {canWriteOrganization(auth.membership.role) ? (
              <ImportWizard
                workflow={workflow}
                spaces={spaces}
                assetsBySpace={assetsBySpace}
                savedMappings={savedMappings}
                initialSpaceId={query.spaceId ?? ""}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                You have read-only access and cannot import inventory.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedDashboardShell>
  );
}
