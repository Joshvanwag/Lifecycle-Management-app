"use client";

import { useChartColors } from "@/lib/charts/chart-color-context";

interface YearColorLegendProps {
  years: number[];
  className?: string;
}

export function YearColorLegend({ years, className }: YearColorLegendProps) {
  const { getYearColor } = useChartColors();

  if (years.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {years.map((year) => (
        <div key={year} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: getYearColor(year) }}
            aria-hidden
          />
          <span>FY{year}</span>
        </div>
      ))}
    </div>
  );
}
