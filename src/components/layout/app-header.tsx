"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { DEMO_ORGANIZATION } from "@/lib/demo-data";
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
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  title: string;
  description?: string;
  showSearch?: boolean;
}

export function AppHeader({ title, description, showSearch = false }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative hidden w-64 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" />
          </div>
        )}

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">Jane Doe</p>
                <p className="text-xs text-muted-foreground">{DEMO_ORGANIZATION}</p>
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
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
