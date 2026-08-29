export type LifecycleStatus = "upcoming" | "due" | "overdue";
export type PlanningStatus = "unplanned" | "scheduled" | "deferred" | "completed";

export interface Space {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  spaceType: string;
  campus: string;
  building: string;
  room?: string;
  locationLabel: string;
  commissionedDate: string;
  commissionedYear: number;
  refreshCycleYears: number;
  recommendedRefreshYear: number;
  lifecycleStatus: LifecycleStatus;
  planningStatus: PlanningStatus;
  plannedRefreshYear?: number;
  originalCost: number;
  forecastAmount: number;
  assetCount: number;
}

export interface Asset {
  id: string;
  organizationId: string;
  organizationName: string;
  spaceId: string;
  manufacturer: string;
  modelNumber: string;
  category: string;
  serialNumber?: string;
  ipAddress?: string;
  macAddress?: string;
  installDate: string;
  cost: number;
  refreshCycleYears: number;
  recommendedRefreshYear: number;
  lifecycleStatus: LifecycleStatus;
  status: "active" | "retired";
}

export interface RefreshEvent {
  id: string;
  spaceId: string;
  type: "initial_deployment" | "full_refresh" | "partial_refresh" | "individual_replacement";
  date: string;
  description: string;
  cost?: number;
}

export interface ForecastYear {
  year: number;
  amount: number;
}

export interface DashboardMetrics {
  totalPortfolioValue: number;
  fiveYearForecast: number;
  dueThisYear: number;
  overdue: number;
  deferred: number;
  forecastByYear: ForecastYear[];
}
