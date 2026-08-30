"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({ label, value, description, icon: Icon, className }: KpiCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col justify-center px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
