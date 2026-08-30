import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  NavigationPendingOutlet,
  NavigationPendingProvider,
} from "@/components/layout/navigation-pending";
import type { Organization } from "@/lib/database.types";

interface DashboardShellProps {
  children: React.ReactNode;
  userDisplayName: string;
  userInitials: string;
  organizationName: string;
  isPlatformAdmin?: boolean;
  organizations?: Organization[];
  activeOrganizationId?: string;
}

export function DashboardShell({
  children,
  userDisplayName,
  userInitials,
  organizationName,
  isPlatformAdmin = false,
  organizations = [],
  activeOrganizationId,
}: DashboardShellProps) {
  return (
    <Suspense
      fallback={
        <DashboardChrome
          userDisplayName={userDisplayName}
          userInitials={userInitials}
          organizationName={organizationName}
          isPlatformAdmin={isPlatformAdmin}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        >
          {children}
        </DashboardChrome>
      }
    >
      <NavigationPendingProvider>
        <DashboardChrome
          userDisplayName={userDisplayName}
          userInitials={userInitials}
          organizationName={organizationName}
          isPlatformAdmin={isPlatformAdmin}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        >
          <NavigationPendingOutlet>{children}</NavigationPendingOutlet>
        </DashboardChrome>
      </NavigationPendingProvider>
    </Suspense>
  );
}

function DashboardChrome({
  children,
  userDisplayName,
  userInitials,
  organizationName,
  isPlatformAdmin = false,
  organizations = [],
  activeOrganizationId,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isPlatformAdmin={isPlatformAdmin} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          userDisplayName={userDisplayName}
          userInitials={userInitials}
          organizationName={organizationName}
          isPlatformAdmin={isPlatformAdmin}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
