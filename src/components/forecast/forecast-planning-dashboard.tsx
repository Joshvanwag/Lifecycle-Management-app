"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { LabeledBarChart } from "@/components/charts/labeled-bar-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  LifecycleStatusBadge,
  PlanningStatusBadge,
} from "@/components/spaces/status-badges";
import { CHART_PALETTE } from "@/lib/charts/colors";
import {
  amountInYear,
  computeExtendedMetrics,
  computeLifecycleStatusByYear,
  computeReplacementByYear,
  computeYearComparison,
  plannedAmountInYear,
  recommendedInYear,
} from "@/lib/data/analytics";
import type { Space } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ForecastPlanningDashboardProps {
  spaces: Space[];
  initialYear?: number;
}

type Drill =
  | { level: "summary" }
  | { level: "year"; year: number }
  | { level: "location"; year: number }
  | { level: "space"; year: number; campus: string; building: string };

export function ForecastPlanningDashboard({ spaces, initialYear }: ForecastPlanningDashboardProps) {
  const [drill, setDrill] = useState<Drill>(
    initialYear ? { level: "year", year: initialYear } : { level: "summary" },
  );

  const summary = useMemo(() => computeExtendedMetrics(spaces), [spaces]);
  const replacementByYear = useMemo(() => computeReplacementByYear(spaces, 10), [spaces]);
  const recommendedVsPlanned = useMemo(() => computeYearComparison(spaces, 10), [spaces]);
  const planningGap = useMemo(
    () =>
      recommendedVsPlanned.map((row) => ({
        year: row.year,
        recommended: row.recommended,
        planned: row.planned,
        gap: row.gap,
      })),
    [recommendedVsPlanned],
  );
  const lifecycleByYear = useMemo(() => computeLifecycleStatusByYear(spaces, 10), [spaces]);

  const selectedYear = drill.level !== "summary" ? drill.year : null;

  const yearDetail = useMemo(() => {
    if (!selectedYear) return null;
    const recommended = recommendedInYear(spaces, selectedYear);
    const planned = plannedAmountInYear(spaces, selectedYear);
    const yearSpaces = spaces.filter((space) => amountInYear(space, selectedYear) > 0);
    const yearAssets = yearSpaces.reduce((sum, space) => sum + space.assetCount, 0);
    return {
      recommended,
      planned,
      gap: Math.max(0, recommended - planned),
      spaceCount: yearSpaces.length,
      assetCount: yearAssets,
      spaces: yearSpaces.sort(
        (a, b) => amountInYear(b, selectedYear) - amountInYear(a, selectedYear),
      ),
    };
  }, [spaces, selectedYear]);

  const locationRows = useMemo(() => {
    if (drill.level === "summary") return [];
    const year = drill.year;
    const groups = new Map<
      string,
      { campus: string; building: string; amount: number; spaces: number }
    >();
    for (const space of spaces) {
      const amount = amountInYear(space, year);
      if (amount <= 0) continue;
      const campus = space.campus || "Unassigned";
      const building = space.building || "Unassigned";
      const key = `${campus}||${building}`;
      const existing = groups.get(key) ?? { campus, building, amount: 0, spaces: 0 };
      existing.amount += amount;
      existing.spaces += 1;
      groups.set(key, existing);
    }
    return [...groups.values()].sort((a, b) => b.amount - a.amount);
  }, [spaces, drill]);

  const spaceRows = useMemo(() => {
    if (drill.level !== "space") return [];
    return spaces
      .filter(
        (space) =>
          (space.campus || "Unassigned") === drill.campus &&
          (space.building || "Unassigned") === drill.building,
      )
      .map((space) => ({ space, amount: amountInYear(space, drill.year) }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [spaces, drill]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="1-Year Need" value={formatCurrency(summary.oneYearNeed)} />
        <KpiCard label="3-Year Need" value={formatCurrency(summary.threeYearNeed)} />
        <KpiCard label="5-Year Need" value={formatCurrency(summary.fiveYearNeed)} />
        <KpiCard label="10-Year Need" value={formatCurrency(summary.tenYearNeed)} />
        <KpiCard label="Planned Amount" value={formatCurrency(summary.plannedAmount)} />
        <KpiCard label="Unplanned Amount" value={formatCurrency(summary.unplannedAmount)} />
      </div>

      <LabeledBarChart
        title="10-Year Capital Need"
        description="Projected replacement cost by year with visible dollar labels"
        data={replacementByYear.map((row) => ({ name: String(row.year), value: row.amount }))}
        colorScheme={{ type: "years", years: replacementByYear.map((row) => row.year) }}
        onBarClick={(name) => setDrill({ level: "year", year: Number(name) })}
        selectedName={drill.level !== "summary" ? String(drill.year) : null}
        drillLabel={drill.level !== "summary" ? `FY${drill.year}` : undefined}
        onReset={() => setDrill({ level: "summary" })}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupedBarChart
          title="Recommended vs Planned"
          description="Planned means lifecycle work intentionally scheduled — not necessarily funded"
          data={recommendedVsPlanned}
          onBarClick={(year) => setDrill({ level: "year", year })}
          selectedYear={drill.level !== "summary" ? drill.year : null}
          drillLabel={drill.level !== "summary" ? `FY${drill.year}` : undefined}
          onReset={() => setDrill({ level: "summary" })}
        />
        <GroupedBarChart
          title="Planning Gap"
          description="Recommended minus planned — positive values show unplanned need"
          data={planningGap}
          series={[
            { key: "gap", label: "Planning Gap", color: CHART_PALETTE[9]! },
          ]}
          onBarClick={(year) => setDrill({ level: "year", year })}
          selectedYear={drill.level !== "summary" ? drill.year : null}
          drillLabel={drill.level !== "summary" ? `FY${drill.year}` : undefined}
          onReset={() => setDrill({ level: "summary" })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Status by Year</CardTitle>
          <CardDescription>Upcoming, due, and overdue need distributed across planning years</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Upcoming</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lifecycleByYear.map((row) => (
                <TableRow
                  key={row.year}
                  className="cursor-pointer"
                  onClick={() => setDrill({ level: "year", year: row.year })}
                >
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.upcoming)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.due)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.overdue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => setDrill({ level: "summary" })}>
          All years
        </Button>
        {drill.level !== "summary" && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrill({ level: "year", year: drill.year })}
            >
              FY{drill.year}
            </Button>
          </>
        )}
        {drill.level === "space" && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span>
              {drill.campus} / {drill.building}
            </span>
          </>
        )}
      </div>

      {selectedYear && yearDetail && (
        <Card>
          <CardHeader>
            <CardTitle>FY{selectedYear} Detail</CardTitle>
            <CardDescription>
              Recommended: {formatCurrency(yearDetail.recommended)} · Planned:{" "}
              {formatCurrency(yearDetail.planned)} · Planning Gap:{" "}
              {formatCurrency(yearDetail.gap)} · {yearDetail.spaceCount} Spaces ·{" "}
              {yearDetail.assetCount} Assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Planning</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearDetail.spaces.map((space) => (
                  <TableRow key={space.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/spaces/${space.id}`} className="font-medium hover:underline">
                        {space.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{space.locationLabel}</p>
                    </TableCell>
                    <TableCell>{space.spaceType}</TableCell>
                    <TableCell>
                      <LifecycleStatusBadge status={space.lifecycleStatus} />
                    </TableCell>
                    <TableCell>
                      <PlanningStatusBadge status={space.planningStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(amountInYear(space, selectedYear))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {drill.level === "year" && locationRows.length > 0 && (
              <div className="border-t px-6 py-4">
                <p className="mb-2 text-sm font-medium">By campus and building</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campus</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead className="text-right">Spaces</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationRows.map((row) => (
                      <TableRow
                        key={`${row.campus}-${row.building}`}
                        className="cursor-pointer"
                        onClick={() =>
                          setDrill({
                            level: "space",
                            year: selectedYear,
                            campus: row.campus,
                            building: row.building,
                          })
                        }
                      >
                        <TableCell>{row.campus}</TableCell>
                        <TableCell>{row.building}</TableCell>
                        <TableCell className="text-right">{row.spaces}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {drill.level === "space" && (
              <div className="border-t px-6 py-4">
                <p className="mb-2 text-sm font-medium">
                  {drill.campus} / {drill.building}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Space</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spaceRows.map(({ space, amount }) => (
                      <TableRow key={space.id}>
                        <TableCell>
                          <Link href={`/spaces/${space.id}`} className="font-medium hover:underline">
                            {space.name}
                          </Link>
                        </TableCell>
                        <TableCell>{space.spaceType}</TableCell>
                        <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
