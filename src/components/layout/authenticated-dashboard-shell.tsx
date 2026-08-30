import { PageHeader } from "@/components/design-system/page-header";

interface AuthenticatedDashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AuthenticatedDashboardShell({
  children,
  title,
  description,
  actions,
}: AuthenticatedDashboardShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
