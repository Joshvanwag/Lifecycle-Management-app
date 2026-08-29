"use client";

import { useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import type { ChartColorScheme } from "@/lib/charts/colors";
import { ChartColorSheet } from "@/components/charts/chart-color-sheet";
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
}

export function ChartCard({
  title,
  description,
  colorScheme,
  legend,
  children,
  className,
}: ChartCardProps) {
  const [colorSheetOpen, setColorSheetOpen] = useState(false);

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Chart options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setColorSheetOpen(true)}>
                Customize colors
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </>
  );
}
