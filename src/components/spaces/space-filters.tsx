"use client";

import { X } from "lucide-react";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";
import {
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/lib/filters/space-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export { emptySpaceFilters, type SpaceFiltersState };

interface SpaceFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SpaceFiltersState;
  onFiltersChange: (filters: SpaceFiltersState) => void;
  options: {
    organizations: { id: string; name: string }[];
    campuses: string[];
    buildings: string[];
    spaceTypes: string[];
    years: string[];
  };
}

function OrganizationFilterGroup({
  organizations,
  selectedIds,
  onChange,
}: {
  organizations: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (organizationIds: string[]) => void;
}) {
  if (organizations.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Organization</Label>
      <p className="text-xs text-muted-foreground">
        Leave unselected to include all organizations.
      </p>
      <div className="flex flex-wrap gap-2">
        {organizations.map((organization) => {
          const isSelected = selectedIds.includes(organization.id);
          return (
            <button
              key={organization.id}
              type="button"
              onClick={() =>
                onChange(
                  isSelected
                    ? selectedIds.filter((id) => id !== organization.id)
                    : [...selectedIds, organization.id],
                )
              }
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {organization.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function FilterChipGroup<T extends string>({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: T[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(toggleValue(selected, value))}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SpaceFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  options,
}: SpaceFiltersProps) {
  const activeCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine the Spaces list. {activeCount > 0 && `${activeCount} active.`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-4">
          <OrganizationFilterGroup
            organizations={options.organizations}
            selectedIds={filters.organizationIds}
            onChange={(organizationIds) => onFiltersChange({ ...filters, organizationIds })}
          />
          <FilterChipGroup
            label="Campus"
            values={options.campuses}
            selected={filters.campus}
            onChange={(campus) => onFiltersChange({ ...filters, campus })}
          />
          <FilterChipGroup
            label="Building"
            values={options.buildings}
            selected={filters.building}
            onChange={(building) => onFiltersChange({ ...filters, building })}
          />
          <FilterChipGroup
            label="Space Type"
            values={options.spaceTypes}
            selected={filters.spaceType}
            onChange={(spaceType) => onFiltersChange({ ...filters, spaceType })}
          />
          <FilterChipGroup
            label="Lifecycle Status"
            values={["upcoming", "due", "overdue"] as LifecycleStatus[]}
            selected={filters.lifecycleStatus}
            onChange={(lifecycleStatus) => onFiltersChange({ ...filters, lifecycleStatus })}
          />
          <FilterChipGroup
            label="Planning Status"
            values={["unplanned", "scheduled", "deferred", "completed"] as PlanningStatus[]}
            selected={filters.planningStatus}
            onChange={(planningStatus) => onFiltersChange({ ...filters, planningStatus })}
          />
          <FilterChipGroup
            label="Refresh Year"
            values={options.years}
            selected={filters.year}
            onChange={(year) => onFiltersChange({ ...filters, year })}
          />
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onFiltersChange(emptySpaceFilters)}
            disabled={activeCount === 0}
          >
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ActiveFilterChips({
  filters,
  onFiltersChange,
  organizationOptions = [],
}: {
  filters: SpaceFiltersState;
  onFiltersChange: (filters: SpaceFiltersState) => void;
  organizationOptions?: { id: string; name: string }[];
}) {
  const organizationNames = new Map(
    organizationOptions.map((organization) => [organization.id, organization.name]),
  );
  const chips: { key: keyof SpaceFiltersState; value: string; label: string }[] = [];

  (Object.keys(filters) as (keyof SpaceFiltersState)[]).forEach((key) => {
    filters[key].forEach((value) => {
      const label =
        key === "organizationIds" ? (organizationNames.get(value) ?? value) : value;
      chips.push({ key, value, label });
    });
  });

  if (chips.length === 0) return null;

  const removeChip = (key: keyof SpaceFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key].filter((v) => v !== value),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={`${chip.key}-${chip.value}`} variant="secondary" className="gap-1 pr-1">
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => removeChip(chip.key, chip.value)}
            className="rounded-sm p-0.5 hover:bg-muted"
            aria-label={`Remove ${chip.value} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
