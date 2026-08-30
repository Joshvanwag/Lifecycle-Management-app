"use client";

import { useMemo, useState } from "react";
import { previewImport, runImport } from "@/lib/import/actions";
import {
  IMPORT_FIELD_KEYS,
  IMPORT_FIELD_LABELS,
  workflowDescription,
  type ImportWorkflow,
} from "@/lib/import/fields";
import type { ColumnMap } from "@/lib/import/map-rows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ImportWizardSpace {
  id: string;
  name: string;
}

export interface ImportWizardAsset {
  id: string;
  manufacturer: string;
  modelNumber: string;
  category: string;
}

export interface SavedMapping {
  id: string;
  name: string;
  column_map: ColumnMap;
}

interface ImportWizardProps {
  workflow: ImportWorkflow;
  spaces: ImportWizardSpace[];
  assetsBySpace: Record<string, ImportWizardAsset[]>;
  savedMappings: SavedMapping[];
  initialSpaceId?: string;
}

export function ImportWizard({
  workflow,
  spaces,
  assetsBySpace,
  savedMappings,
  initialSpaceId = "",
}: ImportWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [spaceId, setSpaceId] = useState(initialSpaceId);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [retiredAssetIds, setRetiredAssetIds] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [rowCount, setRowCount] = useState(0);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [mappingName, setMappingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const needsSpace = workflow !== "add";
  const needsEventDate = workflow === "full_refresh" || workflow === "partial_refresh";
  const needsAssetSelection = workflow === "partial_refresh";
  const assets = assetsBySpace[spaceId] ?? [];
  const unmapped = useMemo(
    () => headers.filter((header) => !columnMap[header]),
    [headers, columnMap],
  );

  async function handlePreview() {
    if (!file) {
      setError("Choose a CSV or Excel file.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.set("file", file);
    const preview = await previewImport(formData);
    setBusy(false);
    if ("error" in preview) {
      setError(preview.error);
      return;
    }
    setHeaders(preview.headers);
    setColumnMap(preview.suggestedMap);
    setRowCount(preview.rowCount);
    setPreviewRows(preview.previewRows);
  }

  async function handleRun() {
    if (!file) {
      setError("Choose a CSV or Excel file.");
      return;
    }
    if (needsSpace && !spaceId) {
      setError("Select a Space.");
      return;
    }
    if (needsAssetSelection && retiredAssetIds.length === 0) {
      setError("Select the assets being replaced.");
      return;
    }
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("workflow", workflow);
    formData.set("columnMap", JSON.stringify(columnMap));
    formData.set("spaceId", spaceId);
    formData.set("eventDate", eventDate);
    formData.set("mappingName", mappingName);
    for (const id of retiredAssetIds) {
      formData.append("retireAssetIds", id);
    }
    const outcome = await runImport(formData);
    setBusy(false);
    if ("error" in outcome) {
      setError(outcome.error);
      return;
    }
    const { result: counts } = outcome;
    setResult(
      `Imported ${counts.spacesCreated} Spaces, added ${counts.assetsCreated} assets, updated ${counts.assetsUpdated}, retired ${counts.assetsRetired}.`,
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{workflowDescription(workflow)}</p>
      <p className="text-sm text-muted-foreground">
        Upload a file, confirm column mapping, then process. Recognized columns are mapped
        automatically.
      </p>

      {needsSpace && (
        <div className="space-y-2">
          <Label htmlFor="spaceId">Space</Label>
          <select
            id="spaceId"
            value={spaceId}
            onChange={(event) => {
              setSpaceId(event.target.value);
              setRetiredAssetIds([]);
            }}
            className="flex h-9 w-full max-w-md cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Select a Space</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsAssetSelection && spaceId && (
        <div className="space-y-2">
          <Label>Assets being replaced</Label>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">This Space has no active assets.</p>
          ) : (
            <div className="space-y-2 rounded-lg border p-3">
              {assets.map((asset) => (
                <label key={asset.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={retiredAssetIds.includes(asset.id)}
                    onChange={(event) => {
                      setRetiredAssetIds((current) =>
                        event.target.checked
                          ? [...current, asset.id]
                          : current.filter((id) => id !== asset.id),
                      );
                    }}
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
      )}

      {needsEventDate && (
        <div className="max-w-xs space-y-2">
          <Label htmlFor="eventDate">Refresh date</Label>
          <Input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="file">CSV or Excel file (up to 50 MB)</Label>
        <Input
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="cursor-pointer"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setHeaders([]);
            setResult(null);
          }}
        />
      </div>

      {savedMappings.length > 0 && headers.length > 0 && (
        <div className="max-w-md space-y-2">
          <Label htmlFor="savedMapping">Saved mapping</Label>
          <select
            id="savedMapping"
            className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(event) => {
              const saved = savedMappings.find((mapping) => mapping.id === event.target.value);
              if (!saved) {
                return;
              }
              setColumnMap((current) => {
                const next = { ...current };
                for (const header of headers) {
                  if (saved.column_map[header] !== undefined) {
                    next[header] = saved.column_map[header];
                  }
                }
                return next;
              });
            }}
          >
            <option value="">Use suggested mapping</option>
            {savedMappings.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handlePreview} disabled={busy}>
          Inspect columns
        </Button>
        <Button type="button" onClick={handleRun} disabled={busy || headers.length === 0}>
          Process import
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <p className="text-sm text-green-700">{result}</p>}

      {headers.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {rowCount} rows.{" "}
            {unmapped.length === 0
              ? "All columns were recognized."
              : `${unmapped.length} column${unmapped.length === 1 ? "" : "s"} need a field.`}
          </p>
          <div className="space-y-2">
            {headers.map((header) => (
              <div key={header} className="grid gap-2 sm:grid-cols-[1fr_16rem] sm:items-center">
                <Label htmlFor={`map-${header}`}>{header}</Label>
                <select
                  id={`map-${header}`}
                  value={columnMap[header] ?? ""}
                  onChange={(event) =>
                    setColumnMap((current) => ({
                      ...current,
                      [header]: event.target.value as ColumnMap[string],
                    }))
                  }
                  className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Ignore</option>
                  {IMPORT_FIELD_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {IMPORT_FIELD_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="max-w-md space-y-2">
            <Label htmlFor="mappingName">Save this mapping (optional)</Label>
            <Input
              id="mappingName"
              value={mappingName}
              onChange={(event) => setMappingName(event.target.value)}
              placeholder="Asset QT export"
            />
          </div>
          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    {headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      {headers.map((header) => (
                        <td key={header} className="px-3 py-2 text-muted-foreground">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
