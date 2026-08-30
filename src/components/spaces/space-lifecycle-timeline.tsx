import type { Asset, RefreshEvent, Space } from "@/lib/types";
import { cn } from "@/lib/utils";

const refreshTypeLabels = {
  initial_deployment: "Initial Deployment",
  full_refresh: "Full Refresh",
  partial_refresh: "Partial Refresh",
  individual_replacement: "Individual Replacement",
} as const;

interface TimelinePoint {
  year: number;
  title: string;
  subtitle?: string;
  tone: "past" | "current" | "future" | "planned";
}

function buildTimelinePoints(space: Space, assets: Asset[], history: RefreshEvent[]): TimelinePoint[] {
  const currentYear = new Date().getFullYear();
  const points: TimelinePoint[] = [];

  points.push({
    year: space.commissionedYear,
    title: "Initial deployment",
    subtitle: `Commissioned ${space.commissionedDate}`,
    tone: space.commissionedYear <= currentYear ? "past" : "future",
  });

  for (const event of history) {
    const year = new Date(event.date).getFullYear();
    if (event.type === "initial_deployment" && year === space.commissionedYear) {
      continue;
    }
    points.push({
      year,
      title: refreshTypeLabels[event.type],
      subtitle: event.description,
      tone: year < currentYear ? "past" : year === currentYear ? "current" : "future",
    });
  }

  const recommendedTone =
    space.recommendedRefreshYear < currentYear
      ? "past"
      : space.recommendedRefreshYear === currentYear
        ? "current"
        : "future";

  points.push({
    year: space.recommendedRefreshYear,
    title: "Recommended refresh",
    subtitle: "Soonest replacement year for this Space",
    tone: recommendedTone,
  });

  if (space.plannedRefreshYear) {
    points.push({
      year: space.plannedRefreshYear,
      title: "Planned refresh",
      subtitle: "Organization planning decision",
      tone: "planned",
    });
  }

  const assetYears = [
    ...new Set(
      assets
        .map((asset) => asset.recommendedRefreshYear)
        .filter((year) => year !== space.recommendedRefreshYear),
    ),
  ].sort((a, b) => a - b);

  for (const year of assetYears) {
    const categories = [
      ...new Set(
        assets.filter((asset) => asset.recommendedRefreshYear === year).map((asset) => asset.category),
      ),
    ];
    points.push({
      year,
      title: "Asset refresh",
      subtitle: categories.join(", "),
      tone: year < currentYear ? "past" : year === currentYear ? "current" : "future",
    });
  }

  const deduped = new Map<string, TimelinePoint>();
  for (const point of points) {
    const key = `${point.year}:${point.title}`;
    if (!deduped.has(key)) {
      deduped.set(key, point);
    }
  }

  return [...deduped.values()].sort((a, b) => a.year - b.year);
}

const toneStyles: Record<TimelinePoint["tone"], string> = {
  past: "border-muted-foreground/40 bg-muted text-muted-foreground",
  current: "border-amber-500 bg-amber-50 text-amber-900",
  future: "border-primary bg-primary/10 text-primary",
  planned: "border-emerald-600 bg-emerald-50 text-emerald-900",
};

export function SpaceLifecycleTimeline({
  space,
  assets,
  history,
}: {
  space: Space;
  assets: Asset[];
  history: RefreshEvent[];
}) {
  const points = buildTimelinePoints(space, assets, history);
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>;
  }

  const minYear = points[0]!.year;
  const maxYear = points[points.length - 1]!.year;
  const span = Math.max(maxYear - minYear, 1);

  return (
    <div className="space-y-6">
      <div className="relative hidden sm:block">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        <div className="relative flex justify-between gap-2">
          {points.map((point) => {
            const position = ((point.year - minYear) / span) * 100;
            return (
              <div
                key={`${point.year}-${point.title}`}
                className="relative flex min-w-0 flex-1 flex-col items-center"
                style={{ flexBasis: `${100 / points.length}%` }}
              >
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    toneStyles[point.tone],
                  )}
                  title={`${point.year}: ${point.title}`}
                >
                  {String(point.year).slice(-2)}
                </div>
                <div className="mt-3 w-full px-1 text-center" style={{ marginLeft: position > 50 ? "-8px" : 0 }}>
                  <p className="text-sm font-medium leading-tight">{point.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{point.year}</p>
                  {point.subtitle && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{point.subtitle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ol className="space-y-3 sm:hidden">
        {points.map((point) => (
          <li
            key={`${point.year}-${point.title}-mobile`}
            className={cn("rounded-lg border p-3", toneStyles[point.tone])}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{point.title}</p>
                {point.subtitle && <p className="mt-1 text-xs opacity-80">{point.subtitle}</p>}
              </div>
              <span className="shrink-0 text-sm font-semibold">{point.year}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
