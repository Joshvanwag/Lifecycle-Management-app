"use client";

import { Filter, Search } from "lucide-react";
import type { ReactNode } from "react";
import {
  ActiveFilterChips,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  onOpenFilters: () => void;
  appliedFilters: SpaceFiltersState;
  onFiltersChange: (filters: SpaceFiltersState) => void;
  organizationOptions?: { id: string; name: string }[];
  filteredCount?: number;
  totalCount?: number;
  countLabel?: string;
  className?: string;
  searchSlot?: ReactNode;
}

export function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilterCount,
  onOpenFilters,
  appliedFilters,
  onFiltersChange,
  organizationOptions = [],
  filteredCount,
  totalCount,
  countLabel = "Spaces",
  className,
  searchSlot,
}: FilterToolbarProps) {
  const filtersActive = activeFilterCount > 0;

  return (
    <div className={cn("space-y-3 rounded-xl border bg-card p-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {searchSlot ?? (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <Button
          type="button"
          variant={filtersActive ? "default" : "outline"}
          onClick={onOpenFilters}
          className="cursor-pointer shrink-0"
        >
          <Filter className="h-4 w-4" />
          {filtersActive ? "Edit filters" : "Filter data"}
          {filtersActive && (
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <ActiveFilterChips
        filters={appliedFilters}
        onFiltersChange={onFiltersChange}
        organizationOptions={organizationOptions}
      />

      {filteredCount != null && totalCount != null && filteredCount !== totalCount && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} {countLabel.toLowerCase()}
        </p>
      )}
    </div>
  );
}
