"use client";

import { Filter } from "lucide-react";
import type { ReactNode } from "react";
import {
  ActiveFilterChips,
  type SpaceFiltersState,
} from "@/components/spaces/space-filters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
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
  showSearch?: boolean;
}

export function FilterToolbar({
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
  showSearch = false,
}: FilterToolbarProps) {
  const filtersActive = activeFilterCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{showSearch ? searchSlot : null}</div>
        <Button
          type="button"
          variant={filtersActive ? "default" : "outline"}
          onClick={onOpenFilters}
          className="cursor-pointer shrink-0"
        >
          <Filter className="h-4 w-4" />
          Filters
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
