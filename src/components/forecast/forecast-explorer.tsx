"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
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

interface ForecastExplorerProps {
  spaces: Space[];
}

type Drill =
  | { level: "year" }
  | { level: "location"; year: number }
  | { level: "space"; year: number; campus: string; building: string };

function yearAmount(space: Space, year: number) {
  return space.forecastByYear
    .filter((slice) => slice.year === year)
    .reduce((sum, slice) => sum + slice.amount, 0);
}

export function ForecastExplorer({ spaces }: ForecastExplorerProps) {
  const [drill, setDrill] = useState<Drill>({ level: "year" });
  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const totals = new Map<number, number>();
    for (const space of spaces) {
      for (const slice of space.forecastByYear) {
        totals.set(slice.year, (totals.get(slice.year) ?? 0) + slice.amount);
      }
    }
    return [...totals.entries()]
      .filter(([year]) => year >= currentYear - 1)
      .sort((a, b) => a[0] - b[0])
      .map(([year, amount]) => ({ year, amount }));
  }, [spaces, currentYear]);

  const locationRows = useMemo(() => {
    if (drill.level === "year") return [];
    const year = drill.year;
    const groups = new Map<string, { campus: string; building: string; amount: number; spaces: number }>();
    for (const space of spaces) {
      const amount = yearAmount(space, year);
      if (amount <= 0) continue;
      const key = `${space.campus}||${space.building}`;
      const existing = groups.get(key) ?? {
        campus: space.campus || "Unassigned",
        building: space.building || "Unassigned",
        amount: 0,
        spaces: 0,
      };
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
      .map((space) => ({
        space,
        amount: yearAmount(space, drill.year),
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [spaces, drill]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => setDrill({ level: "year" })}>
          Years
        </Button>
        {drill.level !== "year" && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrill({ level: "location", year: drill.year })}
            >
              {drill.year}
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

      {drill.level === "year" && (
        <Card>
          <CardHeader>
            <CardTitle>Replacement cost by year</CardTitle>
            <CardDescription>Click a year to see campus and building totals</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No forecast amounts are stored yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  years.map((row) => (
                    <TableRow
                      key={row.year}
                      className="cursor-pointer"
                      onClick={() => setDrill({ level: "location", year: row.year })}
                    >
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {drill.level === "location" && (
        <Card>
          <CardHeader>
            <CardTitle>{drill.year} by campus and building</CardTitle>
            <CardDescription>Click a building to see Spaces and lump-sum amounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                        year: drill.year,
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
          </CardContent>
        </Card>
      )}

      {drill.level === "space" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {drill.year} · {drill.building}
            </CardTitle>
            <CardDescription>Space lump-sum replacement amounts for this year</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                      <p className="text-xs text-muted-foreground">{space.locationLabel}</p>
                    </TableCell>
                    <TableCell>{space.spaceType}</TableCell>
                    <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
