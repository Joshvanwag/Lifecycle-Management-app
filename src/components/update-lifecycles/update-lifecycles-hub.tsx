"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/design-system/empty-state";
import { SecondaryTabs } from "@/components/design-system/secondary-tabs";
import { ImportHistory, type ImportHistoryJob } from "@/components/import/import-history";
import { lifecycleActionCards } from "@/config/navigation";
import { Button } from "@/components/ui/button";

interface UpdateLifecyclesHubProps {
  jobs: ImportHistoryJob[];
}

export function UpdateLifecyclesHub({ jobs }: UpdateLifecyclesHubProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTab] = useState(searchParams.get("tab") === "history" ? "history" : "actions");

  const changeTab = (next: string) => {
    setTab(next);
    router.replace(next === "history" ? `${pathname}?tab=history` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <SecondaryTabs
        tabs={[
          { id: "actions", label: "Actions" },
          { id: "history", label: "History" },
        ]}
        value={tab}
        onChange={changeTab}
      />

      {tab === "actions" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {lifecycleActionCards.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="cursor-pointer rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <h2 className="text-base font-semibold">{action.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No lifecycle updates yet"
          description="Completed imports and refresh workflows will appear here."
          action={
            <Button asChild>
              <Link href="/update-lifecycles/add">Add New Spaces</Link>
            </Button>
          }
        />
      ) : (
        <ImportHistory jobs={jobs} />
      )}
    </div>
  );
}
