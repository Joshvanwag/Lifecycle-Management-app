import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { AuditEventList } from "@/components/settings/audit-event-list";
import { MembersList } from "@/components/settings/members-list";
import { MfaEnrollForm } from "@/components/settings/mfa-enroll-form";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { TeamInvitationForm } from "@/components/settings/team-invitation-form";
import { requireAuthContext } from "@/lib/auth/context";
import { listAuditEvents } from "@/lib/data/audit";
import { listOrganizationMembers } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; invited?: string; error?: string }>;
}) {
  const auth = await requireAuthContext();
  const params = await searchParams;
  const canManage = auth.membership.role === "owner" || auth.membership.role === "admin";
  const supabase = await createClient();
  const [members, auditEvents] = await Promise.all([
    listOrganizationMembers(supabase, auth.organization.id),
    listAuditEvents(supabase, auth.organization.id),
  ]);

  const successMessage =
    params.saved === "1"
      ? "Organization settings saved."
      : params.invited === "1"
        ? "Invitation sent."
        : null;

  const errorMessage =
    params.error === "unauthorized"
      ? "You do not have permission to update organization settings."
      : params.error === "invalid-industry"
        ? "Select a valid industry type."
        : params.error === "invalid-lifecycle-defaults"
          ? "Enter a valid refresh cycle and inflation rate."
          : params.error
            ? decodeURIComponent(params.error)
            : null;

  return (
    <AuthenticatedDashboardShell
      title="Settings"
      description={`Organization settings for ${auth.organization.name}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

        <OrganizationSettingsForm
          organizationName={auth.organization.name}
          industryType={auth.organization.industry_type}
          benchmarkParticipation={auth.organization.benchmark_participation}
          defaultRefreshCycleYears={auth.organization.default_refresh_cycle_years}
          defaultInflationRate={Number(auth.organization.default_inflation_rate)}
          floorsEnabled={auth.organization.floors_enabled}
          canManage={canManage}
          saved={params.saved === "1"}
          errorMessage={errorMessage}
        />

        <MembersList members={members} />
        {canManage && <TeamInvitationForm organizationId={auth.organization.id} />}
        <MfaEnrollForm />
        <AuditEventList events={auditEvents} />

        <p className="text-sm text-muted-foreground">
          Chart colors are customized from each chart&apos;s options menu on analytical pages.
        </p>
      </div>
    </AuthenticatedDashboardShell>
  );
}
