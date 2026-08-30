"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FilterCombobox } from "@/components/design-system/filter-combobox";
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
  appliedFilters: SpaceFiltersState;
  onApplyFilters: (filters: SpaceFiltersState) => void;
  options: {
    organizations: { id: string; name: string }[];
    campuses: string[];
    buildings: string[];
    spaceTypes: string[];
    years: string[];
  };
}


function StatusToggleGroup<T extends string>({
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
  const toggle = (value: T) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

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
              onClick={() => toggle(value)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${
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
  appliedFilters,
  onApplyFilters,
  options,
}: SpaceFiltersProps) {
  const [draft, setDraft] = useState<SpaceFiltersState>(appliedFilters);

  useEffect(() => {
    if (open) {
      setDraft(appliedFilters);
    }
  }, [open, appliedFilters]);

  const activeCount = Object.values(draft).reduce((sum, arr) => sum + arr.length, 0);

  const handleApply = () => {
    onApplyFilters(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDraft(emptySpaceFilters);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Adjust filters, then click Apply Filters.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto px-6 py-4">
          <FilterCombobox
            label="Campus"
            values={options.campuses}
            selected={draft.campus}
            onChange={(campus) => setDraft({ ...draft, campus })}
          />
          <FilterCombobox
            label="Building"
            values={options.buildings}
            selected={draft.building}
            onChange={(building) => setDraft({ ...draft, building })}
            placeholder="Select buildings..."
          />
          <FilterCombobox
            label="Space Type"
            values={options.spaceTypes}
            selected={draft.spaceType}
            onChange={(spaceType) => setDraft({ ...draft, spaceType })}
          />
          <StatusToggleGroup
            label="Lifecycle Status"
            values={["upcoming", "due", "overdue"] as LifecycleStatus[]}
            selected={draft.lifecycleStatus}
            onChange={(lifecycleStatus) => setDraft({ ...draft, lifecycleStatus })}
          />
          <StatusToggleGroup
            label="Planning Status"
            values={["unplanned", "scheduled", "deferred", "completed"] as PlanningStatus[]}
            selected={draft.planningStatus}
            onChange={(planningStatus) => setDraft({ ...draft, planningStatus })}
          />
          <FilterCombobox
            label="Refresh Year"
            values={options.years}
            selected={draft.year}
            onChange={(year) => setDraft({ ...draft, year })}
          />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={handleClear} disabled={activeCount === 0}>
            Clear
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
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
  void organizationOptions;

  const chipLabels: Array<{ key: keyof SpaceFiltersState; value: string; label: string }> = [];

  (Object.keys(filters) as (keyof SpaceFiltersState)[]).forEach((key) => {
    if (key === "organizationIds") return;
    filters[key].forEach((value) => {
      chipLabels.push({ key, value, label: value });
    });
  });

  if (chipLabels.length === 0) return null;

  const removeChip = (key: keyof SpaceFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key].filter((v) => v !== value),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chipLabels.map((chip) => (
        <Badge key={`${chip.key}-${chip.value}`} variant="secondary" className="gap-1 capitalize pr-1">
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => removeChip(chip.key, chip.value)}
            className="cursor-pointer rounded-sm p-0.5 hover:bg-muted"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        onClick={() => onFiltersChange(emptySpaceFilters)}
        className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}
