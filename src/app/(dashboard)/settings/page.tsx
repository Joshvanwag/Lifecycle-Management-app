import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { requireAuthContext } from "@/lib/auth/context";
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
  const members = await listOrganizationMembers(supabase, auth.organization.id);

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
      <SettingsWorkspace
        organizationName={auth.organization.name}
        industryType={auth.organization.industry_type}
        benchmarkParticipation={auth.organization.benchmark_participation}
        defaultRefreshCycleYears={auth.organization.default_refresh_cycle_years}
        defaultInflationRate={Number(auth.organization.default_inflation_rate)}
        floorsEnabled={auth.organization.floors_enabled}
        canManage={canManage}
        saved={params.saved === "1"}
        invited={params.invited === "1"}
        errorMessage={errorMessage}
        members={members}
        organizationId={auth.organization.id}
      />
    </AuthenticatedDashboardShell>
  );
}
