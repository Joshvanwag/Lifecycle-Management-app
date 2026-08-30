"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PlanningStatusBadge } from "@/components/spaces/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CapitalPlanDashboardProps {
  spaces: Space[];
}

function amountInYear(space: Space, year: number) {
  return space.forecastByYear
    .filter((slice) => slice.year === year)
    .reduce((sum, slice) => sum + slice.amount, 0);
}

export function CapitalPlanDashboard({ spaces }: CapitalPlanDashboardProps) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentYear + index),
    [currentYear],
  );

  const byYear = useMemo(
    () =>
      years.map((year) => {
        const recommended = spaces.reduce((sum, space) => sum + amountInYear(space, year), 0);
        const planned = spaces
          .filter(
            (space) =>
              space.planningStatus === "scheduled" &&
              (space.plannedRefreshYear ?? space.recommendedRefreshYear) === year,
          )
          .reduce((sum, space) => sum + space.forecastAmount, 0);
        return { year, recommended, planned };
      }),
    [spaces, years],
  );

  const scheduled = spaces.filter((space) => space.planningStatus === "scheduled");
  const unplannedDue = spaces.filter(
    (space) =>
      space.planningStatus === "unplanned" && space.recommendedRefreshYear <= currentYear + 2,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended vs planned</CardTitle>
          <CardDescription>
            Recommended dollars come from stored forecasts. Planned dollars are Spaces marked
            scheduled for that year.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Recommended</TableHead>
                <TableHead className="text-right">Planned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byYear.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.recommended)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.planned)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Spaces</CardTitle>
          <CardDescription>Planning overlay — does not change calculated replacement years</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SpacePlanTable spaces={scheduled} empty="No Spaces are marked scheduled." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unplanned, due within 2 years</CardTitle>
          <CardDescription>Recommended timing that does not yet have a planning status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SpacePlanTable spaces={unplannedDue} empty="No unplanned Spaces are due soon." />
        </CardContent>
      </Card>
    </div>
  );
}

function SpacePlanTable({ spaces, empty }: { spaces: Space[]; empty: string }) {
  if (spaces.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Space</TableHead>
          <TableHead>Recommended</TableHead>
          <TableHead>Planned</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Forecast</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spaces.map((space) => (
          <TableRow key={space.id}>
            <TableCell>
              <Link href={`/spaces/${space.id}`} className="font-medium hover:underline">
                {space.name}
              </Link>
              <p className="text-xs text-muted-foreground">{space.locationLabel}</p>
            </TableCell>
            <TableCell>{space.recommendedRefreshYear}</TableCell>
            <TableCell>{space.plannedRefreshYear ?? "—"}</TableCell>
            <TableCell>
              <PlanningStatusBadge status={space.planningStatus} />
            </TableCell>
            <TableCell className="text-right">{formatCurrency(space.forecastAmount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
