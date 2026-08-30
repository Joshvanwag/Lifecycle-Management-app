"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpaceWorkflowPickerProps {
  title: string;
  description: string;
  importHref: string;
  importDescription: string;
  spaceHref: (spaceId: string) => string;
  spaces: Array<{ id: string; name: string; location?: string }>;
}

export function SpaceWorkflowPicker({
  title,
  description,
  importHref,
  importDescription,
  spaceHref,
  spaces,
}: SpaceWorkflowPickerProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return spaces;
    return spaces.filter((space) =>
      [space.name, space.location].filter(Boolean).join(" ").toLowerCase().includes(value),
    );
  }, [query, spaces]);

  return (
    <AuthenticatedDashboardShell title={title} description={description}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/update-lifecycles">
            <ArrowLeft className="h-4 w-4" />
            Back to Update Lifecycles
          </Link>
        </Button>

        <Link
          href={importHref}
          className="block cursor-pointer rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
        >
          <h2 className="text-sm font-semibold">Import from file</h2>
          <p className="mt-1 text-sm text-muted-foreground">{importDescription}</p>
        </Link>

        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Or select a Space</h2>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Spaces..."
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Spaces match that search.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {filtered.map((space) => (
                <li key={space.id}>
                  <Link
                    href={spaceHref(space.id)}
                    className="flex cursor-pointer items-baseline justify-between gap-3 px-4 py-3 hover:bg-accent/40"
                  >
                    <span className="text-sm font-medium">{space.name}</span>
                    {space.location ? (
                      <span className="truncate text-xs text-muted-foreground">{space.location}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthenticatedDashboardShell>
  );
}
