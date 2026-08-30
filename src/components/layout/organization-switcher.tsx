"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { setActiveOrganization } from "@/lib/auth/organization-session";
import type { Organization } from "@/lib/database.types";
import { getCustomerOrganizations } from "@/lib/auth/customer-orgs";
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
  const customerOrganizations = getCustomerOrganizations(organizations);
  const selectableOrganizations =
    customerOrganizations.length > 0 ? customerOrganizations : organizations;
  const activeOrganization =
    selectableOrganizations.find((organization) => organization.id === activeOrganizationId) ??
    selectableOrganizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={isPending}
          className="-ml-2 max-w-[280px] px-2 text-lg font-semibold tracking-tight"
        >
          <span className="truncate">{activeOrganization?.name ?? "Select organization"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
        <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {selectableOrganizations.map((organization) => (
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
