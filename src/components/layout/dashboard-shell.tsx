import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showSearch?: boolean;
}

export function DashboardShell({
  children,
  title,
  description,
  showSearch,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title={title} description={description} showSearch={showSearch} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
