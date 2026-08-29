"use client";

import { useTransition } from "react";
import { setActiveOrganization } from "@/lib/auth/organization-session";
import type { Organization } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationSwitcherProps {
  organizations: Organization[];
  activeOrganizationId: string;
}

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ??
    organizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending} className="max-w-[220px]">
          <span className="truncate">{activeOrganization?.name ?? "Select organization"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
        <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            className="cursor-pointer"
            disabled={organization.id === activeOrganizationId || isPending}
            onSelect={() => {
              startTransition(async () => {
                await setActiveOrganization(organization.id);
              });
            }}
          >
            <span className="truncate">{organization.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
