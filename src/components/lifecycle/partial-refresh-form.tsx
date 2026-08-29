"use client";

import { useState } from "react";
import { AssetEntryList } from "@/components/lifecycle/asset-entry-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPartialRefresh } from "@/lib/lifecycle/actions";
import type { AssetInput } from "@/lib/lifecycle/form-utils";
import type { Asset } from "@/lib/types";

interface PartialRefreshFormProps {
  spaceId: string;
  assets: Asset[];
  defaultCycleYears: number;
  errorMessage?: string | null;
}

export function PartialRefreshForm({
  spaceId,
  assets,
  defaultCycleYears,
  errorMessage,
}: PartialRefreshFormProps) {
  const [replacements, setReplacements] = useState<AssetInput[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={recordPartialRefresh} className="space-y-6">
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="assetsJson" value={JSON.stringify(replacements)} />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <p className="text-sm text-muted-foreground">
        Select the assets being replaced. Remaining equipment keeps its current schedule.
      </p>

      <div className="space-y-3">
        <Label>Assets being replaced</Label>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">This Space has no active assets to replace.</p>
        ) : (
          <div className="space-y-2 rounded-lg border p-3">
            {assets.map((asset) => (
              <label key={asset.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="retireAssetIds"
                  value={asset.id}
                  className="h-4 w-4 rounded border-input"
                />
                <span>
                  {asset.manufacturer} {asset.modelNumber}
                  <span className="text-muted-foreground"> · {asset.category}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventDate">Refresh date</Label>
          <Input id="eventDate" name="eventDate" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refreshCycleYears">Cycle for new costs (years)</Label>
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
          <Input id="description" name="description" placeholder="Display replacement" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lumpAmount">New lump-sum amount</Label>
          <Input id="lumpAmount" name="lumpAmount" type="number" min={0} step="0.01" defaultValue={0} />
        </div>
      </div>

      <AssetEntryList
        assets={replacements}
        onChange={setReplacements}
        defaultCycleYears={defaultCycleYears}
        defaultInstallDate={today}
      />

      <Button type="submit" disabled={assets.length === 0}>
        Record partial refresh
      </Button>
    </form>
  );
}
