"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { DashboardMetrics, Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ForecastChart } from "@/components/overview/forecast-chart";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OverviewDashboardProps {
  metrics: DashboardMetrics;
  upcomingSpaces: Space[];
}

const metricCards = [
  {
    key: "totalPortfolioValue" as const,
    label: "Total Portfolio Value",
    icon: DollarSign,
    description: "Current cost basis across all Spaces",
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

export function OverviewDashboard({ metrics, upcomingSpaces }: OverviewDashboardProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Demo data</span> — This dashboard uses
        static sample data for development. Connect Supabase to load live organization data.
      </div>

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
            <CardDescription>Spaces with upcoming lifecycle needs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
