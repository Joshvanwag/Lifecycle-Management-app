import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartColorSettings } from "@/components/settings/chart-color-settings";
import { requireAuthContext } from "@/lib/auth/context";

export default async function SettingsPage() {
  const auth = await requireAuthContext();

  return (
    <DashboardShell
      title="Settings"
      description="Organization and application settings"
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
    >
      <div className="max-w-2xl space-y-6">
        <ChartColorSettings />
      </div>
    </DashboardShell>
  );
}
