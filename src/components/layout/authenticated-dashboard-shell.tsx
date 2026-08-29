import { requireAuthContext } from "@/lib/auth/context";
import { DashboardShell } from "@/components/layout/dashboard-shell";

interface AuthenticatedDashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export async function AuthenticatedDashboardShell({
  children,
  title,
  description,
}: AuthenticatedDashboardShellProps) {
  const auth = await requireAuthContext();

  return (
    <DashboardShell
      title={title}
      description={description}
      userDisplayName={auth.displayName}
      userInitials={auth.initials}
      organizationName={auth.organization.name}
      isPlatformAdmin={auth.isPlatformAdmin}
      organizations={auth.organizations}
      activeOrganizationId={auth.organization.id}
    >
      {children}
    </DashboardShell>
  );
}
