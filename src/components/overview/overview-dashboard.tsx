"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  DollarSign,
  Filter,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  ActiveFilterChips,
  SpaceFilters,
} from "@/components/spaces/space-filters";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import { ForecastChart } from "@/components/overview/forecast-chart";
import { computeDashboardMetrics } from "@/lib/data/dashboard-metrics";
import {
  buildSpaceFilterOptions,
  countActiveFilters,
  emptySpaceFilters,
  filterSpaces,
  type SpaceFiltersState,
} from "@/lib/filters/space-filters";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OverviewDashboardProps {
  spaces: Space[];
}

const metricCards = [
  {
    key: "totalPortfolioValue" as const,
    label: "Total Portfolio Value",
    icon: DollarSign,
    description: "Current cost basis across filtered Spaces",
  },
  {
    key: "fiveYearForecast" as const,
    label: "5-Year Forecast",
    icon: TrendingUp,
    description: "Projected replacement funding needed",
  },
  {
    key: "dueThisYear" as const,
    label: "Due This Year",
    icon: CalendarClock,
    description: "Spaces with refresh due in current year",
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertTriangle,
    description: "Past recommended refresh year",
  },
  {
    key: "deferred" as const,
    label: "Deferred",
    icon: Clock,
    description: "Planned but pushed to a future year",
  },
];

export function OverviewDashboard({ spaces }: OverviewDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SpaceFiltersState>(emptySpaceFilters);

  const filterOptions = useMemo(() => buildSpaceFilterOptions(spaces), [spaces]);

  const filteredSpaces = useMemo(
    () => filterSpaces(spaces, search, filters),
    [spaces, search, filters],
  );

  const metrics = useMemo(
    () => computeDashboardMetrics(filteredSpaces),
    [filteredSpaces],
  );

  const upcomingSpaces = useMemo(
    () =>
      filteredSpaces
        .filter((space) => space.lifecycleStatus === "upcoming" || space.lifecycleStatus === "due")
        .slice(0, 5),
    [filteredSpaces],
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Spaces..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <ActiveFilterChips filters={filters} onFiltersChange={setFilters} />

      {filteredSpaces.length !== spaces.length && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredSpaces.length} of {spaces.length} Spaces
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics[card.key])}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ForecastChart data={metrics.forecastByYear} />

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Spaces</CardTitle>
            <CardDescription>
              Spaces with upcoming lifecycle needs matching your filters
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingSpaces.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No upcoming Spaces match the current filters. Adjust filters or add Spaces to see
                portfolio data here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Space</TableHead>
                    <TableHead>Refresh</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Forecast</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSpaces.map((space) => (
                    <TableRow
                      key={space.id}
                      className="cursor-pointer"
                      data-clickable="true"
                      onClick={() => router.push(`/spaces/${space.id}`)}
                    >
                      <TableCell>
                        <Link href={`/spaces/${space.id}`} className="font-medium hover:underline">
                          {space.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{space.spaceType}</p>
                      </TableCell>
                      <TableCell>{space.recommendedRefreshYear}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <LifecycleStatusBadge status={space.lifecycleStatus} />
                          <PlanningStatusBadge status={space.planningStatus} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(space.forecastAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SpaceFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        options={filterOptions}
      />
    </div>
  );
}
