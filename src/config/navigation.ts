import {
  BarChart3,
  Building2,
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
  description: "Add Spaces, refresh inventory, or correct records",
};

export const mainNavigation: NavGroup[] = [
  {
    items: [
      {
        title: "Overview",
        href: "/",
        icon: LayoutDashboard,
        description: "Portfolio health, lifecycle needs, and planning outlook",
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
        description: "Manage lifecycle Spaces and upcoming replacement needs",
      },
      {
        title: "Assets",
        href: "/assets",
        icon: Package,
        description: "Active equipment, age, and replacement exposure",
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
        description: "Future lifecycle need versus planned work",
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
        description: "Compare with anonymized industry peers",
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
    href: "/update-lifecycles/add",
  },
  {
    title: "Full Refresh",
    description: "Replace the active inventory for an existing Space and restart its full lifecycle.",
    href: "/update-lifecycles/full-refresh",
  },
  {
    title: "Partial Refresh",
    description: "Select existing equipment being replaced, then add the new equipment.",
    href: "/update-lifecycles/partial-refresh",
  },
  {
    title: "Correct Inventory",
    description: "Fix existing inventory data without creating a refresh event.",
    href: "/inventory/correct",
  },
] as const;

/** @deprecated Use lifecycleActionCards */
export const lifecycleActions = lifecycleActionCards.map((action) => ({
  title: action.title,
  description: action.description,
  href: action.href,
}));

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
