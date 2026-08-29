import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
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
    <DashboardShell
      title="Settings"
      description="Organization and application settings"
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
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
      </div>
    </DashboardShell>
  );
}
