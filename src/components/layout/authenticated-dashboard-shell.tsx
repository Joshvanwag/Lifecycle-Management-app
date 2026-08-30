interface AuthenticatedDashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AuthenticatedDashboardShell({
  children,
  title,
  description,
}: AuthenticatedDashboardShellProps) {
  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
