"use client";

import { updatePlanningStatus } from "@/lib/lifecycle/actions";
import type { PlanningStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLANNING_OPTIONS: Array<{ value: PlanningStatus; label: string }> = [
  { value: "unplanned", label: "Unplanned" },
  { value: "scheduled", label: "Scheduled" },
  { value: "deferred", label: "Deferred" },
  { value: "completed", label: "Completed" },
];

interface PlanningStatusFormProps {
  spaceId: string;
  planningStatus: PlanningStatus;
  plannedRefreshYear?: number;
  canWrite: boolean;
}

export function PlanningStatusForm({
  spaceId,
  planningStatus,
  plannedRefreshYear,
  canWrite,
}: PlanningStatusFormProps) {
  if (!canWrite) {
    return (
      <p className="text-sm text-muted-foreground">
        {plannedRefreshYear ? `Planned for ${plannedRefreshYear}` : "No planning decision recorded."}
      </p>
    );
  }

  return (
    <form action={updatePlanningStatus} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
      <input type="hidden" name="spaceId" value={spaceId} />
      <div className="space-y-2">
        <Label htmlFor="planningStatus">Planning status</Label>
        <select
          id="planningStatus"
          name="planningStatus"
          defaultValue={planningStatus}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          {PLANNING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plannedRefreshYear">Planned year</Label>
        <Input
          id="plannedRefreshYear"
          name="plannedRefreshYear"
          type="number"
          min={1990}
          max={2100}
          defaultValue={plannedRefreshYear ?? ""}
          placeholder="Optional"
        />
      </div>
      <Button type="submit">Save plan</Button>
    </form>
  );
}
