import type { LifecycleStatus, PlanningStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const lifecycleLabels: Record<LifecycleStatus, string> = {
  upcoming: "Upcoming",
  due: "Due",
  overdue: "Overdue",
};

const lifecycleVariants: Record<LifecycleStatus, "secondary" | "warning" | "destructive"> = {
  upcoming: "secondary",
  due: "warning",
  overdue: "destructive",
};

export function LifecycleStatusBadge({ status }: { status: LifecycleStatus }) {
  return <Badge variant={lifecycleVariants[status]}>{lifecycleLabels[status]}</Badge>;
}

const planningLabels: Record<PlanningStatus, string> = {
  unplanned: "Unplanned",
  scheduled: "Scheduled",
  deferred: "Deferred",
  completed: "Completed",
};

const planningVariants: Record<PlanningStatus, "muted" | "default" | "warning" | "success"> = {
  unplanned: "muted",
  scheduled: "default",
  deferred: "warning",
  completed: "success",
};

export function PlanningStatusBadge({ status }: { status: PlanningStatus }) {
  return <Badge variant={planningVariants[status]}>{planningLabels[status]}</Badge>;
}
