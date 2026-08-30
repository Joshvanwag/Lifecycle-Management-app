"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterComboboxProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function FilterCombobox({
  label,
  values,
  selected,
  onChange,
  placeholder,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? values.filter((value) => value.toLowerCase().includes(term)) : values;
  }, [query, values]);

  if (values.length === 0) return null;

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const summary =
    selected.length === 0
      ? placeholder ?? `Select ${label.toLowerCase()}...`
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((current) => !current)}
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
            {summary}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
            {values.length > 6 && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            )}
            <div className="max-h-48 space-y-0.5 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">No matches.</p>
              ) : (
                filtered.map((value) => {
                  const isSelected = selected.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggle(value)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{value}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
