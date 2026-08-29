"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createDefaultChartColors,
  getLifecycleStatusColor,
  getPlanningStatusColor,
  getYearColor,
  mergeChartColorPreferences,
  type ChartColorPreferences,
} from "@/lib/charts/colors";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";

const STORAGE_PREFIX = "lifecycle-chart-colors";

interface ChartColorContextValue {
  colors: ChartColorPreferences;
  setYearColor: (year: number, color: string) => void;
  setLifecycleStatusColor: (status: LifecycleStatus, color: string) => void;
  setPlanningStatusColor: (status: PlanningStatus, color: string) => void;
  resetColors: () => void;
  getYearColor: (year: number) => string;
  getLifecycleStatusColor: (status: LifecycleStatus) => string;
  getPlanningStatusColor: (status: PlanningStatus) => string;
}

const ChartColorContext = createContext<ChartColorContextValue | null>(null);

function storageKey(organizationId: string) {
  return `${STORAGE_PREFIX}:${organizationId}`;
}

function readStoredColors(organizationId: string): ChartColorPreferences {
  if (typeof window === "undefined") {
    return createDefaultChartColors();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(organizationId));
    if (!raw) return createDefaultChartColors();
    return mergeChartColorPreferences(JSON.parse(raw) as Partial<ChartColorPreferences>);
  } catch {
    return createDefaultChartColors();
  }
}

function writeStoredColors(organizationId: string, colors: ChartColorPreferences) {
  window.localStorage.setItem(storageKey(organizationId), JSON.stringify(colors));
}

export function ChartColorProvider({
  organizationId,
  children,
}: {
  organizationId: string;
  children: ReactNode;
}) {
  const [colors, setColors] = useState<ChartColorPreferences>(() =>
    createDefaultChartColors(),
  );

  useEffect(() => {
    setColors(readStoredColors(organizationId));
  }, [organizationId]);

  const persist = useCallback(
    (next: ChartColorPreferences) => {
      setColors(next);
      writeStoredColors(organizationId, next);
    },
    [organizationId],
  );

  const setYearColor = useCallback(
    (year: number, color: string) => {
      persist({
        ...colors,
        years: { ...colors.years, [String(year)]: color },
      });
    },
    [colors, persist],
  );

  const setLifecycleStatusColor = useCallback(
    (status: LifecycleStatus, color: string) => {
      persist({
        ...colors,
        lifecycleStatus: { ...colors.lifecycleStatus, [status]: color },
      });
    },
    [colors, persist],
  );

  const setPlanningStatusColor = useCallback(
    (status: PlanningStatus, color: string) => {
      persist({
        ...colors,
        planningStatus: { ...colors.planningStatus, [status]: color },
      });
    },
    [colors, persist],
  );

  const resetColors = useCallback(() => {
    persist(createDefaultChartColors());
  }, [persist]);

  const value = useMemo<ChartColorContextValue>(
    () => ({
      colors,
      setYearColor,
      setLifecycleStatusColor,
      setPlanningStatusColor,
      resetColors,
      getYearColor: (year) => getYearColor(year, colors),
      getLifecycleStatusColor: (status) => getLifecycleStatusColor(status, colors),
      getPlanningStatusColor: (status) => getPlanningStatusColor(status, colors),
    }),
    [colors, resetColors, setLifecycleStatusColor, setPlanningStatusColor, setYearColor],
  );

  return <ChartColorContext.Provider value={value}>{children}</ChartColorContext.Provider>;
}

export function useChartColors() {
  const context = useContext(ChartColorContext);
  if (!context) {
    throw new Error("useChartColors must be used within ChartColorProvider");
  }
  return context;
}
