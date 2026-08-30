"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  name: string;
  defaultChecked: boolean;
  label: string;
  description?: React.ReactNode;
}

export function ToggleSwitch({ name, defaultChecked, label, description }: ToggleSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-start justify-between gap-4">
      <span className="space-y-1">
        <span className="block text-sm font-medium">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      {checked ? <input type="hidden" name={name} value="on" /> : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((value) => !value)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-input bg-muted",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
            checked ? "left-5" : "left-0.5",
          )}
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
