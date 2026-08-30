"use client";

import { useState, type ReactNode } from "react";
import { MoreVertical, RotateCcw, Settings2 } from "lucide-react";
import type { ChartColorScheme } from "@/lib/charts/colors";
import {
  defaultChartSettings,
  type ChartDisplaySettings,
} from "@/lib/charts/chart-settings";
import { ChartColorSheet } from "@/components/charts/chart-color-sheet";
import { ChartSettingsSheet } from "@/components/charts/chart-settings-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChartCardProps {
  title: string;
  description?: string;
  colorScheme: ChartColorScheme;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
  showSettings?: boolean;
}

export function ChartCard({
  title,
  description,
  colorScheme,
  legend,
  children,
  className,
  drillLabel,
  onReset,
  settings = defaultChartSettings,
  onSettingsChange,
  showSettings = true,
}: ChartCardProps) {
  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
            {drillLabel ? (
              <p className="text-xs font-medium text-primary">Filtered: {drillLabel}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onReset && drillLabel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={onReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            ) : null}
            {showSettings && onSettingsChange ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => setSettingsSheetOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Chart settings</span>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Chart options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setColorSheetOpen(true)}>
                  Customize colors
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {legend}
          {children}
        </CardContent>
      </Card>

      <ChartColorSheet
        open={colorSheetOpen}
        onOpenChange={setColorSheetOpen}
        scheme={colorScheme}
        chartTitle={title}
      />

      {onSettingsChange ? (
        <ChartSettingsSheet
          open={settingsSheetOpen}
          onOpenChange={setSettingsSheetOpen}
          settings={settings}
          onApply={onSettingsChange}
          chartTitle={title}
        />
      ) : null}
    </>
  );
}
