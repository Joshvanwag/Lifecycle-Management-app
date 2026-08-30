import {
  BarChart3,
  Building2,
  FileBarChart,
  FileUp,
  LayoutDashboard,
  Package,
  Plus,
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

export const updateLifecyclesNavItem: NavItem = {
  title: "Update Lifecycles",
  href: "/update-lifecycles",
  icon: Plus,
  description: "Choose how to update your lifecycle inventory",
};

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
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Forecast",
        href: "/forecast",
        icon: TrendingUp,
        description: "Replacement planning and capital forecasting",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Benchmark",
        href: "/benchmark",
        icon: BarChart3,
        description: "Compare lifecycle performance with industry peers",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        description: "Predefined lifecycle and portfolio reports",
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
        description: "Import history and file upload operations",
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

export const lifecycleActionCards = [
  {
    title: "Add New Spaces",
    description: "Add newly deployed Spaces and equipment to the lifecycle inventory.",
    href: "/spaces/new",
    importHref: "/imports/add",
  },
  {
    title: "Full Refresh",
    description: "Replace the active inventory for an existing Space and restart its full lifecycle.",
    href: "/spaces",
    importHref: "/imports/full-refresh",
  },
  {
    title: "Partial Refresh",
    description: "Select existing equipment being replaced, then add the new equipment with its own lifecycle.",
    href: "/spaces",
    importHref: "/imports/partial-refresh",
  },
  {
    title: "Correct Inventory",
    description: "Fix existing inventory data without creating a refresh event or resetting lifecycle history.",
    href: "/inventory/correct",
    importHref: null,
  },
] as const;

/** @deprecated Use lifecycleActionCards */
export const lifecycleActions = lifecycleActionCards.map((action) => ({
  title: action.title,
  description: action.description,
  href: action.href,
}));

export const importActions = [
  {
    title: "Add New Spaces",
    description: "Create Spaces and equipment from a CSV or Excel file.",
    href: "/imports/add",
  },
  {
    title: "Full Refresh",
    description: "Retire all active equipment and import the new inventory. No matching.",
    href: "/imports/full-refresh",
  },
  {
    title: "Partial Refresh",
    description: "Select the assets being replaced, then import the new equipment.",
    href: "/imports/partial-refresh",
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
