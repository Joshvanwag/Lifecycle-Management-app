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
          <span>{year}</span>
        </div>
      ))}
    </div>
  );
}

interface CategoryColorLegendProps {
  categories: string[];
  className?: string;
}

export function CategoryColorLegend({ categories, className }: CategoryColorLegendProps) {
  const { getCategoryColor } = useChartColors();

  if (categories.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {categories.map((category, index) => (
        <div key={category} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: getCategoryColor(category, index) }}
            aria-hidden
          />
          <span>{category}</span>
        </div>
      ))}
    </div>
  );
}

interface DeploymentStatusLegendProps {
  className?: string;
}

export function DeploymentStatusLegend({ className }: DeploymentStatusLegendProps) {
  const { getDeploymentStatusColor } = useChartColors();

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {(["active", "planned"] as const).map((status) => (
        <div key={status} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: getDeploymentStatusColor(status) }}
            aria-hidden
          />
          <span className="capitalize">{status}</span>
        </div>
      ))}
    </div>
  );
}
