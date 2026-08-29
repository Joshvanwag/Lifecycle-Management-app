import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SpacesTable } from "@/components/spaces/spaces-table";
import { demoSpaces } from "@/lib/demo-data";

export default function SpacesPage() {
  return (
    <DashboardShell
      title="Spaces"
      description="Lifecycle-managed environments and equipment collections"
    >
      <div className="mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Demo data</span> — Showing sample Spaces.
        Database integration coming in Phase 2.
      </div>
      <SpacesTable spaces={demoSpaces} />
    </DashboardShell>
  );
}
