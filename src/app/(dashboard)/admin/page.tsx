import { redirect } from "next/navigation";
import { createInvitation, createOrganization, revokeInvitation } from "@/lib/admin/actions";
import { requireAuthContext } from "@/lib/auth/context";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDUSTRY_TYPE_CODES, INDUSTRY_TYPE_LABELS } from "@/lib/benchmark/constants";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type PendingInvitation = Pick<
  Database["public"]["Tables"]["organization_invitations"]["Row"],
  "id" | "email" | "role" | "expires_at" | "organization_id"
>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; invited?: string; revoked?: string }>;
}) {
  const auth = await requireAuthContext();
  if (!auth.isPlatformAdmin) {
    redirect("/");
  }

  const params = await searchParams;
  const supabase = await createClient();

  const { data: invitationsData } = await supabase
    .from("organization_invitations")
    .select("id, email, role, expires_at, accepted_at, revoked_at, organization_id")
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const invitations = (invitationsData ?? []) as PendingInvitation[];

  const organizationNames = new Map(auth.organizations.map((org) => [org.id, org.name]));

  const successMessage =
    params.created === "1"
      ? "Organization created. Share the invitation link with the owner."
      : params.invited === "1"
        ? "Invitation sent."
        : params.revoked === "1"
          ? "Invitation revoked."
          : null;

  const errorMessage = params.error ? decodeURIComponent(params.error) : null;

  return (
    <AuthenticatedDashboardShell
      title="DEV Admin"
      description="Manage customer organizations and DEV team access"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        {auth.devOrganization && (
          <Card>
            <CardHeader>
              <CardTitle>Invite DEV team member</CardTitle>
              <CardDescription>
                DEV organization members can switch into any customer account and bypass benchmark
                contributor thresholds. Invite teammates to {auth.devOrganization.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createInvitation} className="space-y-4">
                <input type="hidden" name="organizationId" value={auth.devOrganization.id} />
                <input type="hidden" name="returnTo" value="/admin" />
                <div className="space-y-2">
                  <Label htmlFor="devEmail">Email</Label>
                  <Input id="devEmail" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="devRole">Role</Label>
                  <select
                    id="devRole"
                    name="role"
                    defaultValue="admin"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <Button type="submit">Invite to DEV</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>
              New customers cannot self-register. Create the organization and invite the owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industryType">Industry type</Label>
                <select
                  id="industryType"
                  name="industryType"
                  defaultValue="university"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {INDUSTRY_TYPE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {INDUSTRY_TYPE_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Owner email</Label>
                <Input id="ownerEmail" name="ownerEmail" type="email" required />
              </div>
              <Button type="submit">Create and invite owner</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite customer organization user</CardTitle>
            <CardDescription>
              Invite a user to the currently selected organization ({auth.organization.name}).
              Switch organizations from the header to invite users elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createInvitation} className="space-y-4">
              <input type="hidden" name="organizationId" value={auth.organization.id} />
              <input type="hidden" name="returnTo" value="/admin" />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="member"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="read_only">Read only</option>
                </select>
              </div>
              <Button type="submit">Send invitation</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              Invitations expire after 14 days. Signup links use the invitation token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(invitations ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              invitations?.map((invitation) => {
                const organizationName =
                  organizationNames.get(invitation.organization_id) ?? "Organization";
                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {organizationName} · {invitation.role} · expires{" "}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <form action={revokeInvitation}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Revoke
                      </Button>
                    </form>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benchmark access for DEV team</CardTitle>
            <CardDescription>
              DEV organization members bypass the minimum contributor threshold and can inspect
              sub-threshold metrics with contributor counts. Customer organization owners still use
              the standard under-5 rule.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AuthenticatedDashboardShell>
  );
}
