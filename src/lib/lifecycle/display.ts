import type { PlanningStatus } from "@/lib/types";
import {
  calendarYearFromDate,
  deriveLifecycleStatus,
  recommendedReplacementYear,
} from "@/lib/lifecycle/engine";

export { deriveLifecycleStatus };

export function deriveRecommendedRefreshYear(
  commissionedDate: string,
  refreshCycleYears: number,
): number {
  return recommendedReplacementYear(calendarYearFromDate(commissionedDate), refreshCycleYears);
}

export function toPlanningStatus(value: string): PlanningStatus {
  if (
    value === "unplanned" ||
    value === "scheduled" ||
    value === "deferred" ||
    value === "completed"
  ) {
    return value;
  }
  return "unplanned";
}

export function formatLocationLabel(parts: {
  campus?: string | null;
  building?: string | null;
  room?: string | null;
}): string {
  return [parts.campus, parts.building, parts.room ? `Room ${parts.room}` : null]
    .filter(Boolean)
    .join(" · ");
}
