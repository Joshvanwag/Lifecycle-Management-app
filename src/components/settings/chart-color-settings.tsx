"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useChartColors } from "@/lib/charts/chart-color-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const FORECAST_YEARS = 5;

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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1"
        aria-label={`${label} color`}
      />
    </div>
  );
}

export function ChartColorSettings() {
  const {
    colors,
    setYearColor,
    setLifecycleStatusColor,
    setPlanningStatusColor,
    resetColors,
    getYearColor,
  } = useChartColors();

  const forecastYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: FORECAST_YEARS }, (_, index) => currentYear + index);
  }, []);

  return (
    <Card id="chart-colors">
      <CardHeader>
        <CardTitle>Chart colors</CardTitle>
        <CardDescription>
          Customize how years and statuses appear across dashboard charts. Preferences are saved
          in this browser for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Forecast years</h3>
            <p className="text-xs text-muted-foreground">
              Used by bar charts and future forecast visualizations.
            </p>
          </div>
          <div className="space-y-2">
            {forecastYears.map((year) => (
              <ColorInput
                key={year}
                id={`year-color-${year}`}
                label={`FY${year}`}
                value={getYearColor(year)}
                onChange={(color) => setYearColor(year, color)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Lifecycle status</h3>
            <p className="text-xs text-muted-foreground">
              Applied when charts group or stack by lifecycle status.
            </p>
          </div>
          <div className="space-y-2">
            {(["upcoming", "due", "overdue"] as const).map((status) => (
              <ColorInput
                key={status}
                id={`lifecycle-color-${status}`}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={colors.lifecycleStatus[status]}
                onChange={(color) => setLifecycleStatusColor(status, color)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Planning status</h3>
            <p className="text-xs text-muted-foreground">
              Applied when charts group or stack by planning status.
            </p>
          </div>
          <div className="space-y-2">
            {(["unplanned", "scheduled", "deferred", "completed"] as const).map((status) => (
              <ColorInput
                key={status}
                id={`planning-color-${status}`}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={colors.planningStatus[status]}
                onChange={(color) => setPlanningStatusColor(status, color)}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={resetColors}>
            Reset to defaults
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/">Back to Overview</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
