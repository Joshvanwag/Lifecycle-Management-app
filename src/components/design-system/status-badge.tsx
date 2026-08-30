import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "muted" }> =
  {
    completed: { label: "Completed", variant: "success" },
    failed: { label: "Failed", variant: "destructive" },
    pending: { label: "Pending", variant: "warning" },
    due: { label: "Due", variant: "warning" },
    overdue: { label: "Overdue", variant: "destructive" },
    upcoming: { label: "Upcoming", variant: "secondary" },
    scheduled: { label: "Scheduled", variant: "secondary" },
    deferred: { label: "Deferred", variant: "warning" },
    unplanned: { label: "Unplanned", variant: "muted" },
  };

export function StatusBadge({
  status,
  title,
  className,
}: {
  status: string;
  title?: string;
  className?: string;
}) {
  const resolved = STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    variant: "secondary" as const,
  };

  return (
    <Badge variant={resolved.variant} title={title} className={cn("capitalize", className)}>
      {resolved.label}
    </Badge>
  );
}
