import type { LifecycleStatus, PlanningStatus } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

/** Simple display-only lifecycle status until the Phase 3 engine ships. */
export function deriveLifecycleStatus(recommendedRefreshYear: number): LifecycleStatus {
  if (recommendedRefreshYear < CURRENT_YEAR) {
    return "overdue";
  }
  if (recommendedRefreshYear === CURRENT_YEAR) {
    return "due";
  }
  return "upcoming";
}

export function deriveRecommendedRefreshYear(
  commissionedDate: string,
  refreshCycleYears: number,
): number {
  const year = new Date(commissionedDate).getFullYear();
  return year + refreshCycleYears;
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
