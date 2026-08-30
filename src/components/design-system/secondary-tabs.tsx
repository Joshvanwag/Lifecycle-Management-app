"use client";

import { cn } from "@/lib/utils";

export interface SecondaryTab {
  id: string;
  label: string;
}

interface SecondaryTabsProps {
  tabs: SecondaryTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SecondaryTabs({ tabs, value, onChange, className }: SecondaryTabsProps) {
  return (
    <div className={cn("flex gap-5 border-b", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "cursor-pointer border-b-2 pb-2 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
