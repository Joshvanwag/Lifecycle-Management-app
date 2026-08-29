"use client";

import { useState } from "react";
import { AssetEntryList } from "@/components/lifecycle/asset-entry-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordFullRefresh } from "@/lib/lifecycle/actions";
import type { AssetInput } from "@/lib/lifecycle/form-utils";

interface FullRefreshFormProps {
  spaceId: string;
  defaultCycleYears: number;
  errorMessage?: string | null;
}

export function FullRefreshForm({
  spaceId,
  defaultCycleYears,
  errorMessage,
}: FullRefreshFormProps) {
  const [assets, setAssets] = useState<AssetInput[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={recordFullRefresh} className="space-y-6">
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="assetsJson" value={JSON.stringify(assets)} />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <p className="text-sm text-muted-foreground">
        All current equipment will be retired. Enter the new inventory and/or a lump-sum cost.
        The Space stays the same.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventDate">Refresh date</Label>
          <Input id="eventDate" name="eventDate" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refreshCycleYears">New refresh cycle (years)</Label>
          <Input
            id="refreshCycleYears"
            name="refreshCycleYears"
            type="number"
            min={1}
            defaultValue={defaultCycleYears}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Full classroom refresh" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lumpAmount">Lump-sum replacement cost</Label>
          <Input id="lumpAmount" name="lumpAmount" type="number" min={0} step="0.01" defaultValue={0} />
        </div>
      </div>

      <AssetEntryList
        assets={assets}
        onChange={setAssets}
        defaultCycleYears={defaultCycleYears}
        defaultInstallDate={today}
      />

      <Button type="submit">Record full refresh</Button>
    </form>
  );
}
