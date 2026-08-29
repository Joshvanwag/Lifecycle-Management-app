"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetInput } from "@/lib/lifecycle/form-utils";

interface AssetEntryListProps {
  assets: AssetInput[];
  onChange: (assets: AssetInput[]) => void;
  defaultCycleYears: number;
  defaultInstallDate?: string;
}

function emptyAsset(defaultCycleYears: number, defaultInstallDate = ""): AssetInput {
  return {
    manufacturer: "",
    modelNumber: "",
    category: "",
    installDate: defaultInstallDate,
    cost: 0,
    refreshCycleYears: defaultCycleYears,
  };
}

export function AssetEntryList({
  assets,
  onChange,
  defaultCycleYears,
  defaultInstallDate,
}: AssetEntryListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Replacement equipment</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...assets, emptyAsset(defaultCycleYears, defaultInstallDate)])
          }
        >
          <Plus className="h-4 w-4" />
          Add asset
        </Button>
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Optional. Leave empty and enter a lump-sum amount if you do not have per-item costs.
        </p>
      ) : (
        <div className="space-y-3">
          {assets.map((asset, index) => (
            <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6">
              <Input
                placeholder="Manufacturer"
                value={asset.manufacturer}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...asset, manufacturer: event.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder="Model"
                value={asset.modelNumber}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...asset, modelNumber: event.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder="Category"
                value={asset.category}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...asset, category: event.target.value };
                  onChange(next);
                }}
              />
              <Input
                type="date"
                value={asset.installDate}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...asset, installDate: event.target.value };
                  onChange(next);
                }}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Cost"
                value={asset.cost || ""}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...asset, cost: Number(event.target.value) || 0 };
                  onChange(next);
                }}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={asset.refreshCycleYears}
                  onChange={(event) => {
                    const next = [...assets];
                    next[index] = {
                      ...asset,
                      refreshCycleYears: Number(event.target.value) || defaultCycleYears,
                    };
                    onChange(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(assets.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label="Remove asset"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
