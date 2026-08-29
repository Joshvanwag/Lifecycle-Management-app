"use client";

import { useState } from "react";
import { AssetEntryList } from "@/components/lifecycle/asset-entry-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSpace } from "@/lib/lifecycle/actions";
import type { AssetInput } from "@/lib/lifecycle/form-utils";

interface AddSpaceFormProps {
  defaultCycleYears: number;
  errorMessage?: string | null;
}

export function AddSpaceForm({ defaultCycleYears, errorMessage }: AddSpaceFormProps) {
  const [assets, setAssets] = useState<AssetInput[]>([]);

  return (
    <form action={createSpace} className="space-y-6">
      <input type="hidden" name="assetsJson" value={JSON.stringify(assets)} />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Space name</Label>
          <Input id="name" name="name" required placeholder="Classroom 204" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spaceType">Type</Label>
          <Input id="spaceType" name="spaceType" required placeholder="Classroom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commissionedDate">Commissioned date</Label>
          <Input id="commissionedDate" name="commissionedDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refreshCycleYears">Refresh cycle (years)</Label>
          <Input
            id="refreshCycleYears"
            name="refreshCycleYears"
            type="number"
            min={1}
            defaultValue={defaultCycleYears}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originalCost">Known Space cost</Label>
          <Input id="originalCost" name="originalCost" type="number" min={0} step="0.01" defaultValue={0} />
          <p className="text-xs text-muted-foreground">
            Use the total Space cost when assets are $0 or only partly priced.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="campus">Campus</Label>
          <Input id="campus" name="campus" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="building">Building</Label>
          <Input id="building" name="building" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Room</Label>
          <Input id="room" name="room" placeholder="Optional" />
        </div>
      </div>

      <AssetEntryList assets={assets} onChange={setAssets} defaultCycleYears={defaultCycleYears} />

      <Button type="submit">Create Space</Button>
    </form>
  );
}
