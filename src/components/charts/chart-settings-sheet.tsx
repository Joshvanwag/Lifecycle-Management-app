"use client";

import type { ChartDisplaySettings } from "@/lib/charts/chart-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ChartSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChartDisplaySettings;
  onApply: (settings: ChartDisplaySettings) => void;
  chartTitle: string;
  goalLineLabel?: string;
}

export function ChartSettingsSheet({
  open,
  onOpenChange,
  settings,
  onApply,
  chartTitle,
  goalLineLabel = "Goal line value",
}: ChartSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Chart settings</SheetTitle>
          <SheetDescription>Display options for {chartTitle}</SheetDescription>
        </SheetHeader>
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            onApply({
              showNumbers: formData.get("showNumbers") === "on",
              showLegend: formData.get("showLegend") === "on",
              goalLine: (() => {
                const raw = String(formData.get("goalLine") ?? "").trim();
                if (!raw) return null;
                const value = Number(raw);
                return Number.isFinite(value) ? value : null;
              })(),
            });
            onOpenChange(false);
          }}
        >
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="showNumbers"
              defaultChecked={settings.showNumbers}
              className="h-4 w-4 cursor-pointer"
            />
            Show numbers on chart
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="showLegend"
              defaultChecked={settings.showLegend}
              className="h-4 w-4 cursor-pointer"
            />
            Show legend
          </label>
          <div className="space-y-2">
            <Label htmlFor="goalLine">{goalLineLabel}</Label>
            <Input
              id="goalLine"
              name="goalLine"
              type="number"
              min={0}
              step="any"
              defaultValue={settings.goalLine ?? ""}
              placeholder="Optional target value"
            />
            <p className="text-xs text-muted-foreground">
              Draws a reference line across the chart when set.
            </p>
          </div>
          <SheetFooter>
            <Button type="submit">Apply settings</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
