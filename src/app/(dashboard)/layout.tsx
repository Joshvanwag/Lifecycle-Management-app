import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardProviders } from "@/components/providers/dashboard-providers";
import { requireAuthContext } from "@/lib/auth/context";
import DashboardLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuthContext();

  return (
    <DashboardProviders organizationId={auth.organization.id}>
      <DashboardShell
        userDisplayName={auth.displayName}
        userInitials={auth.initials}
        organizationName={auth.organization.name}
        isPlatformAdmin={auth.isPlatformAdmin}
        organizations={auth.organizations}
        activeOrganizationId={auth.organization.id}
      >
        <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
      </DashboardShell>
    </DashboardProviders>
  );
}
