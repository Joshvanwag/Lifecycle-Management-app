import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { TeamInvitationForm } from "@/components/settings/team-invitation-form";
import { requireAuthContext } from "@/lib/auth/context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const auth = await requireAuthContext();
  const params = await searchParams;
  const canManage = auth.membership.role === "owner" || auth.membership.role === "admin";

  const errorMessage =
    params.error === "unauthorized"
      ? "You do not have permission to update organization settings."
      : params.error === "invalid-industry"
        ? "Select a valid industry type."
        : params.error
          ? decodeURIComponent(params.error)
          : null;

  return (
    <AuthenticatedDashboardShell
      title="Settings"
      description="Organization and application settings"
    >
      <div className="max-w-2xl space-y-6">
        <OrganizationSettingsForm
          organizationName={auth.organization.name}
          industryType={auth.organization.industry_type}
          benchmarkParticipation={auth.organization.benchmark_participation}
          canManage={canManage}
          saved={params.saved === "1"}
          errorMessage={errorMessage}
        />
        {canManage && <TeamInvitationForm organizationId={auth.organization.id} />}
        <p className="text-sm text-muted-foreground">
          Chart colors are customized from each chart&apos;s options menu.
        </p>
      </div>
    </AuthenticatedDashboardShell>
  );
}
