"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";
import {
  emptySpaceFilters,
  type SpaceFiltersState,
} from "@/lib/filters/space-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function SearchableMultiSelect({
  label,
  values,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = values.filter((value) =>
    value.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  if (values.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {values.length > 6 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder ?? `Search ${label.toLowerCase()}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}
      <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No matches.</p>
        ) : (
          filtered.map((value) => {
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggle(value)}
                className={`flex w-full cursor-pointer items-center rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <span className="truncate">{value}</span>
              </button>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">{selected.length} selected</p>
      )}
    </div>
  );
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
          <SheetDescription>
            Adjust filters, then click Apply Filters. Changes do not take effect until applied.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-4">
          {options.organizations.length > 1 && (
            <div className="space-y-2">
              <Label>Organization</Label>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
                {options.organizations.map((org) => {
                  const isSelected = draft.organizationIds.includes(org.id);
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          organizationIds: isSelected
                            ? draft.organizationIds.filter((id) => id !== org.id)
                            : [...draft.organizationIds, org.id],
                        })
                      }
                      className={`flex w-full cursor-pointer items-center rounded px-2 py-1.5 text-left text-sm transition-colors ${
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      {org.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <SearchableMultiSelect
            label="Campus"
            values={options.campuses}
            selected={draft.campus}
            onChange={(campus) => setDraft({ ...draft, campus })}
          />
          <SearchableMultiSelect
            label="Building"
            values={options.buildings}
            selected={draft.building}
            onChange={(building) => setDraft({ ...draft, building })}
          />
          <SearchableMultiSelect
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
          <SearchableMultiSelect
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
  const organizationNames = new Map(
    organizationOptions.map((organization) => [organization.id, organization.name]),
  );

  const chipLabels: Array<{ key: keyof SpaceFiltersState; value: string; label: string }> = [];

  (Object.keys(filters) as (keyof SpaceFiltersState)[]).forEach((key) => {
    filters[key].forEach((value) => {
      const prefix =
        key === "organizationIds"
          ? "Organization"
          : key === "campus"
            ? "Campus"
            : key === "building"
              ? "Building"
              : key === "spaceType"
                ? "Type"
                : key === "lifecycleStatus"
                  ? "Lifecycle"
                  : key === "planningStatus"
                    ? "Planning"
                    : "Year";
      const display =
        key === "organizationIds" ? (organizationNames.get(value) ?? value) : value;
      chipLabels.push({ key, value, label: `${prefix}: ${display}` });
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
        <Badge key={`${chip.key}-${chip.value}`} variant="secondary" className="gap-1 pr-1">
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
    </div>
  );
}
