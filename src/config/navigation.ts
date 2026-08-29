import {
  Building2,
  CalendarRange,
  FileBarChart,
  FileUp,
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const mainNavigation: NavGroup[] = [
  {
    items: [
      {
        title: "Overview",
        href: "/",
        icon: LayoutDashboard,
        description: "Portfolio summary and key metrics",
      },
    ],
  },
  {
    label: "Lifecycle",
    items: [
      {
        title: "Spaces",
        href: "/spaces",
        icon: Building2,
        description: "Manage lifecycle-managed environments",
      },
      {
        title: "Assets",
        href: "/assets",
        icon: Package,
        description: "Equipment inventory across all Spaces",
      },
      {
        title: "Forecast",
        href: "/forecast",
        icon: TrendingUp,
        description: "Future replacement cost projections",
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Capital Plan",
        href: "/capital-plan",
        icon: CalendarRange,
        description: "Multi-year capital planning",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        description: "Lifecycle and portfolio reports",
      },
    ],
  },
  {
    label: "Data",
    items: [
      {
        title: "Imports",
        href: "/imports",
        icon: FileUp,
        description: "Import and update inventory data",
      },
    ],
  },
  {
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Organization and application settings",
      },
    ],
  },
];

export const lifecycleActions = [
  {
    title: "Add New Spaces",
    description: "Create a new Space and optional equipment without a CSV upload.",
    href: "/spaces/new",
  },
  {
    title: "Full Refresh",
    description: "Replace all active equipment in a Space after a complete refresh.",
    href: "/spaces",
  },
  {
    title: "Partial Refresh",
    description: "Select specific assets being replaced and add new equipment.",
    href: "/spaces",
  },
  {
    title: "Correct Inventory",
    description: "Fix data errors without triggering lifecycle events.",
    href: "/spaces",
  },
];

export function spaceLifecycleActions(spaceId: string) {
  return [
    {
      title: "Add New Spaces",
      description: "Create a new Space and optional equipment without a CSV upload.",
      href: "/spaces/new",
    },
    {
      title: "Full Refresh",
      description: "Replace all active equipment in a Space after a complete refresh.",
      href: `/spaces/${spaceId}/full-refresh`,
    },
    {
      title: "Partial Refresh",
      description: "Select specific assets being replaced and add new equipment.",
      href: `/spaces/${spaceId}/partial-refresh`,
    },
    {
      title: "Correct Inventory",
      description: "Fix data errors without triggering lifecycle events.",
      href: `/spaces/${spaceId}/correct`,
    },
  ];
}
