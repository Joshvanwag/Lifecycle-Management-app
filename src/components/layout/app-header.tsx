"use client";

import { Bell, ChevronDown } from "lucide-react";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { signOut } from "@/lib/auth/actions";
import type { Organization } from "@/lib/database.types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  title: string;
  description?: string;
  userDisplayName: string;
  userInitials: string;
  organizationName: string;
  isPlatformAdmin?: boolean;
  organizations?: Organization[];
  activeOrganizationId?: string;
}

export function AppHeader({
  title,
  description,
  userDisplayName,
  userInitials,
  organizationName,
  isPlatformAdmin = false,
  organizations = [],
  activeOrganizationId,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isPlatformAdmin && organizations.length > 0 && activeOrganizationId && (
          <OrganizationSwitcher
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
          />
        )}

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                <p className="text-xs text-muted-foreground">
                  {organizationName}
                  {isPlatformAdmin ? " · Platform admin" : ""}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Organization Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut}>
                <button type="submit" className="w-full cursor-pointer text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
