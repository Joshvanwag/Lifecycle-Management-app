"use client";

import { useChartColors } from "@/lib/charts/chart-color-context";
import type { ChartColorScheme } from "@/lib/charts/colors";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function ColorInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <Label htmlFor={id} className="cursor-default text-sm font-normal">
        {label}
      </Label>
      <input
        id={id}
        type="color"
        value={value.startsWith("var(") ? "#4a6fa5" : value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1"
        aria-label={`${label} color`}
      />
    </div>
  );
}

interface ChartColorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheme: ChartColorScheme;
  chartTitle: string;
}

export function ChartColorSheet({ open, onOpenChange, scheme, chartTitle }: ChartColorSheetProps) {
  const {
    colors,
    setYearColor,
    setLifecycleStatusColor,
    setPlanningStatusColor,
    setDeploymentStatusColor,
    setCategoryColor,
    getYearColor,
    getCategoryColor,
    resetColors,
  } = useChartColors();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chart colors</SheetTitle>
          <SheetDescription>Customize colors for {chartTitle}.</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-6 py-4">
          {scheme.type === "years" &&
            scheme.years.map((year) => (
              <ColorInput
                key={year}
                id={`chart-year-${year}`}
                label={String(year)}
                value={getYearColor(year)}
                onChange={(color) => setYearColor(year, color)}
              />
            ))}

          {scheme.type === "lifecycleStatus" &&
            (["upcoming", "due", "overdue"] as const).map((status) => (
              <ColorInput
                key={status}
                id={`chart-lifecycle-${status}`}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={colors.lifecycleStatus[status]}
                onChange={(color) => setLifecycleStatusColor(status, color)}
              />
            ))}

          {scheme.type === "planningStatus" &&
            (["unplanned", "scheduled", "deferred", "completed"] as const).map((status) => (
              <ColorInput
                key={status}
                id={`chart-planning-${status}`}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={colors.planningStatus[status]}
                onChange={(color) => setPlanningStatusColor(status, color)}
              />
            ))}

          {scheme.type === "deploymentStatus" && (
            <>
              <ColorInput
                id="chart-active"
                label="Active"
                value={colors.deploymentStatus.active}
                onChange={(color) => setDeploymentStatusColor("active", color)}
              />
              <ColorInput
                id="chart-planned"
                label="Planned"
                value={colors.deploymentStatus.planned}
                onChange={(color) => setDeploymentStatusColor("planned", color)}
              />
            </>
          )}

          {scheme.type === "categories" &&
            scheme.categories.map((category, index) => (
              <ColorInput
                key={category}
                id={`chart-category-${category}`}
                label={category}
                value={getCategoryColor(category, index)}
                onChange={(color) => setCategoryColor(category, color)}
              />
            ))}
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={resetColors}>
            Reset all chart colors
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
