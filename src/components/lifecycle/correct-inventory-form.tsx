"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctInventory } from "@/lib/lifecycle/actions";
import type { Asset, Space } from "@/lib/types";

interface CorrectInventoryFormProps {
  space: Space;
  assets: Asset[];
  errorMessage?: string | null;
}

export function CorrectInventoryForm({ space, assets, errorMessage }: CorrectInventoryFormProps) {
  return (
    <form action={correctInventory} className="space-y-6">
      <input type="hidden" name="spaceId" value={space.id} />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <p className="text-sm text-muted-foreground">
        Fix data errors only. This does not record a refresh or retire equipment.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Space name</Label>
          <Input id="name" name="name" required defaultValue={space.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spaceType">Type</Label>
          <Input id="spaceType" name="spaceType" required defaultValue={space.spaceType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commissionedDate">Commissioned date</Label>
          <Input
            id="commissionedDate"
            name="commissionedDate"
            type="date"
            required
            defaultValue={space.commissionedDate.slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refreshCycleYears">Refresh cycle (years)</Label>
          <Input
            id="refreshCycleYears"
            name="refreshCycleYears"
            type="number"
            min={1}
            required
            defaultValue={space.refreshCycleYears}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originalCost">Space cost</Label>
          <Input
            id="originalCost"
            name="originalCost"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={space.originalCost}
          />
        </div>
      </div>

      {assets.length > 0 && (
        <div className="space-y-3">
          <Label>Active assets</Label>
          {assets.map((asset) => (
            <div key={asset.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6">
              <Input
                name={`asset-${asset.id}-manufacturer`}
                defaultValue={asset.manufacturer}
                placeholder="Manufacturer"
              />
              <Input
                name={`asset-${asset.id}-modelNumber`}
                defaultValue={asset.modelNumber}
                placeholder="Model"
              />
              <Input
                name={`asset-${asset.id}-category`}
                defaultValue={asset.category}
                placeholder="Category"
              />
              <Input
                name={`asset-${asset.id}-installDate`}
                type="date"
                defaultValue={asset.installDate.slice(0, 10)}
              />
              <Input
                name={`asset-${asset.id}-cost`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={asset.cost}
              />
              <Input
                name={`asset-${asset.id}-refreshCycleYears`}
                type="number"
                min={1}
                defaultValue={asset.refreshCycleYears}
              />
            </div>
          ))}
        </div>
      )}

      <Button type="submit">Save corrections</Button>
    </form>
  );
}
