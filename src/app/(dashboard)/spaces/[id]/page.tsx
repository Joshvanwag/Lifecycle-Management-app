import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { requireAuthContext } from "@/lib/auth/context";
import {
  getAssetsBySpaceId,
  getRefreshHistoryBySpaceId,
  getSpaceById,
} from "@/lib/data/spaces";
import { canWriteOrganization } from "@/lib/lifecycle/access";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { PlanningStatusForm } from "@/components/lifecycle/planning-status-form";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { spaceLifecycleActions } from "@/config/navigation";

const refreshTypeLabels = {
  initial_deployment: "Initial Deployment",
  full_refresh: "Full Refresh",
  partial_refresh: "Partial Refresh",
  individual_replacement: "Individual Replacement",
};

export default async function SpaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const auth = await requireAuthContext();
  const supabase = await createClient();
  const organizationId = auth.organization.id;
  const lifecycleActions = spaceLifecycleActions(id);
  const canWrite = canWriteOrganization(auth.membership.role);

  const [space, assets, history] = await Promise.all([
    getSpaceById(supabase, organizationId, id),
    getAssetsBySpaceId(supabase, organizationId, id),
    getRefreshHistoryBySpaceId(supabase, organizationId, id),
  ]);

  if (!space) {
    notFound();
  }

  return (
    <AuthenticatedDashboardShell title={space.name} description={space.locationLabel}>
      <div className="space-y-6">
        {query.saved === "planning" && (
          <p className="text-sm text-green-700">Planning status saved.</p>
        )}
        {query.saved === "inventory" && (
          <p className="text-sm text-green-700">Inventory corrections saved.</p>
        )}
        {query.error === "unauthorized" && (
          <p className="text-sm text-destructive">You do not have permission to change this Space.</p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
              <Link href="/spaces">
                <ArrowLeft className="h-4 w-4" />
                Back to Spaces
              </Link>
            </Button>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{space.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{space.locationLabel || "No location assigned"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{space.spaceType}</Badge>
              <LifecycleStatusBadge status={space.lifecycleStatus} />
              <PlanningStatusBadge status={space.planningStatus} />
            </div>

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Recommended Year</dt>
                <dd className="font-medium">{space.recommendedRefreshYear}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Planned Year</dt>
                <dd className="font-medium">{space.plannedRefreshYear ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Current Cost</dt>
                <dd className="font-medium">{formatCurrency(space.originalCost)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Forecast</dt>
                <dd className="font-medium">{formatCurrency(space.forecastAmount)}</dd>
              </div>
            </dl>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <RefreshCw className="h-4 w-4" />
                Update Lifecycles
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Lifecycle Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {lifecycleActions.map((action) => (
                <DropdownMenuItem key={action.title} asChild>
                  <Link href={action.href} className="flex flex-col items-start gap-0.5 py-2">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {action.description}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Original Cost</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(space.originalCost)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Forecast Amount</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(space.forecastAmount)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recommended Refresh</CardDescription>
              <CardTitle className="text-2xl">{space.recommendedRefreshYear}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Assets</CardDescription>
              <CardTitle className="text-2xl">{space.assetCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Space Overview</CardTitle>
                <CardDescription>Key lifecycle and location information</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Location</dt>
                    <dd className="font-medium">{space.locationLabel || "Not assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Commissioned</dt>
                    <dd className="font-medium">{space.commissionedYear}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Refresh Cycle</dt>
                    <dd className="font-medium">{space.refreshCycleYears} years</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Planned Refresh</dt>
                    <dd className="font-medium">
                      {space.plannedRefreshYear ?? "Not scheduled"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 border-t pt-4">
                  <PlanningStatusForm
                    spaceId={space.id}
                    planningStatus={space.planningStatus}
                    plannedRefreshYear={space.plannedRefreshYear}
                    canWrite={canWrite}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardDescription>
                  Active equipment in this Space. Lump-sum costs may show as $0 per asset.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {assets.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No assets recorded for this Space yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Install Date</TableHead>
                        <TableHead>Refresh Year</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.manufacturer}</TableCell>
                          <TableCell>{asset.modelNumber}</TableCell>
                          <TableCell>{asset.category}</TableCell>
                          <TableCell>{asset.installDate}</TableCell>
                          <TableCell>{asset.recommendedRefreshYear}</TableCell>
                          <TableCell className="text-right">
                            {asset.cost > 0 ? formatCurrency(asset.cost) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Schedule</CardTitle>
                <CardDescription>
                  Assets in this Space may have independent refresh years after partial
                  replacements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Soonest replacement</p>
                      <p className="text-sm text-muted-foreground">
                        Earliest year among current Space costs. A Space can also have later
                        replacement years after a partial refresh.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{space.recommendedRefreshYear}</p>
                      <LifecycleStatusBadge status={space.lifecycleStatus} />
                    </div>
                  </div>
                  {assets.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Install</TableHead>
                          <TableHead>Cycle</TableHead>
                          <TableHead>Next Refresh</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <p className="font-medium">
                                {asset.manufacturer} {asset.modelNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">{asset.category}</p>
                            </TableCell>
                            <TableCell>{asset.installDate}</TableCell>
                            <TableCell>{asset.refreshCycleYears} yr</TableCell>
                            <TableCell>{asset.recommendedRefreshYear}</TableCell>
                            <TableCell>
                              <LifecycleStatusBadge status={asset.lifecycleStatus} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Refresh History</CardTitle>
                <CardDescription>
                  Historical deployment and refresh events for this Space
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No refresh history recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {refreshTypeLabels[event.type]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{event.date}</span>
                          </div>
                          <p className="mt-2 font-medium">{event.description}</p>
                        </div>
                        {event.cost !== undefined && (
                          <p className="shrink-0 font-medium">{formatCurrency(event.cost)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedDashboardShell>
  );
}
