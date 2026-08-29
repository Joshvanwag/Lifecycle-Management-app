"use client";

import { ChartColorProvider } from "@/lib/charts/chart-color-context";

export function DashboardProviders({
  organizationId,
  children,
}: {
  organizationId: string;
  children: React.ReactNode;
}) {
  return <ChartColorProvider organizationId={organizationId}>{children}</ChartColorProvider>;
}
