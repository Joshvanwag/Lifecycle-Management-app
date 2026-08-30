"use client";

import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
  { id: "general", label: "General" },
  { id: "lifecycle", label: "Lifecycle Defaults" },
  { id: "benchmarking", label: "Benchmarking" },
  { id: "members", label: "Members & Access" },
  { id: "authentication", label: "Authentication" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

interface SettingsNavigationProps {
  value: SettingsSectionId;
  onChange: (value: SettingsSectionId) => void;
}

export function SettingsNavigation({ value, onChange }: SettingsNavigationProps) {
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b">
      {SETTINGS_SECTIONS.map((section) => {
        const active = section.id === value;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={cn(
              "cursor-pointer border-b-2 pb-2 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
