"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { mainNavigation, updateLifecyclesNavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isPlatformAdmin?: boolean;
}

export function AppSidebar({ isPlatformAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();
  const UpdateIcon = updateLifecyclesNavItem.icon;
  const isUpdateActive = pathname.startsWith(updateLifecyclesNavItem.href);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          LM
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Lifecycle</p>
          <p className="truncate text-xs text-muted-foreground">Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {mainNavigation[0]!.items.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 px-1">
          <Link
            href={updateLifecyclesNavItem.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
              isUpdateActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-primary/20 bg-primary/5 text-primary hover:border-primary/30 hover:bg-primary/10",
            )}
          >
            <UpdateIcon className="h-4 w-4 shrink-0" />
            <span>{updateLifecyclesNavItem.title}</span>
          </Link>
        </div>

        {mainNavigation.slice(1).map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`} className="mt-6">
            {group.label && (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {isPlatformAdmin && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              DEV
            </p>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/admin")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Shield className="h-4 w-4 shrink-0 opacity-80" />
                  <span>Admin</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
