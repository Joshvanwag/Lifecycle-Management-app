"use client";

import Link from "next/link";
import { ToggleSwitch } from "@/components/design-system/toggle-switch";
import { INDUSTRY_TYPE_CODES, INDUSTRY_TYPE_LABELS } from "@/lib/benchmark/constants";
import { updateOrganizationSettings } from "@/lib/organization/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrganizationSettingsFormProps {
  section: "general" | "lifecycle" | "benchmarking";
  organizationName: string;
  industryType: string;
  benchmarkParticipation: boolean;
  defaultRefreshCycleYears: number;
  defaultInflationRate: number;
  floorsEnabled: boolean;
  canManage: boolean;
}

export function OrganizationSettingsForm({
  section,
  organizationName,
  industryType,
  benchmarkParticipation,
  defaultRefreshCycleYears,
  defaultInflationRate,
  floorsEnabled,
  canManage,
}: OrganizationSettingsFormProps) {
  if (!canManage) {
    return (
      <dl className="grid gap-4 sm:grid-cols-2">
        {section === "general" && (
          <>
            <div>
              <dt className="text-sm text-muted-foreground">Industry type</dt>
              <dd className="font-medium capitalize">{industryType.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Include floors</dt>
              <dd className="font-medium">{floorsEnabled ? "Enabled" : "Disabled"}</dd>
            </div>
          </>
        )}
        {section === "lifecycle" && (
          <>
            <div>
              <dt className="text-sm text-muted-foreground">Default refresh cycle</dt>
              <dd className="font-medium">{defaultRefreshCycleYears} years</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Default inflation</dt>
              <dd className="font-medium">{(defaultInflationRate * 100).toFixed(1)}%</dd>
            </div>
          </>
        )}
        {section === "benchmarking" && (
          <div>
            <dt className="text-sm text-muted-foreground">Industry Benchmarking</dt>
            <dd className="font-medium">{benchmarkParticipation ? "Enabled" : "Disabled"}</dd>
          </div>
        )}
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Only organization owners and admins can change these settings.
        </p>
      </dl>
    );
  }

  return (
    <form action={updateOrganizationSettings} className="space-y-5">
      {section !== "general" && (
        <>
          <input type="hidden" name="industryType" value={industryType} />
          {floorsEnabled ? <input type="hidden" name="floorsEnabled" value="on" /> : null}
        </>
      )}
      {section !== "lifecycle" && (
        <>
          <input type="hidden" name="defaultRefreshCycleYears" value={defaultRefreshCycleYears} />
          <input
            type="hidden"
            name="defaultInflationPercent"
            value={(defaultInflationRate * 100).toFixed(1)}
          />
        </>
      )}
      {section !== "benchmarking" && benchmarkParticipation ? (
        <input type="hidden" name="benchmarkParticipation" value="on" />
      ) : null}

      {section === "general" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="industryType">Industry type</Label>
            <select
              id="industryType"
              name="industryType"
              required
              defaultValue={industryType}
              className="flex h-10 w-full max-w-md cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {INDUSTRY_TYPE_CODES.map((code) => (
                <option key={code} value={code}>
                  {INDUSTRY_TYPE_LABELS[code]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Determines your anonymous industry benchmark cohort.
            </p>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Include floors</span>
              <span className="text-xs text-muted-foreground">
                Turn on only if this organization tracks floor as part of a Space location.
              </span>
            </span>
            <input
              id="floorsEnabled"
              name="floorsEnabled"
              type="checkbox"
              defaultChecked={floorsEnabled}
              className="h-4 w-4 cursor-pointer"
            />
          </label>
        </>
      )}

      {section === "lifecycle" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defaultRefreshCycleYears">Default refresh cycle (years)</Label>
            <Input
              id="defaultRefreshCycleYears"
              name="defaultRefreshCycleYears"
              type="number"
              min={1}
              max={50}
              required
              defaultValue={defaultRefreshCycleYears}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultInflationPercent">Default inflation (%)</Label>
            <Input
              id="defaultInflationPercent"
              name="defaultInflationPercent"
              type="number"
              min={0}
              max={50}
              step="0.1"
              required
              defaultValue={(defaultInflationRate * 100).toFixed(1)}
            />
          </div>
        </div>
      )}

      {section === "benchmarking" && (
        <ToggleSwitch
          name="benchmarkParticipation"
          defaultChecked={benchmarkParticipation}
          label="Industry Benchmarking"
          description={
            <>
              Contribute anonymized lifecycle metrics and gain access to industry benchmark results.
              If disabled, {organizationName} stops contributing and loses access. View results on{" "}
              <Link href="/benchmark" className="underline">
                Benchmark
              </Link>
              .
            </>
          }
        />
      )}

      <Button type="submit">Save</Button>
    </form>
  );
}
