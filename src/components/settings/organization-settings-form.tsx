"use client";

import { INDUSTRY_TYPE_CODES, INDUSTRY_TYPE_LABELS } from "@/lib/benchmark/constants";
import { updateOrganizationSettings } from "@/lib/organization/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface OrganizationSettingsFormProps {
  organizationName: string;
  industryType: string;
  benchmarkParticipation: boolean;
  canManage: boolean;
  saved?: boolean;
  errorMessage?: string | null;
}

export function OrganizationSettingsForm({
  organizationName,
  industryType,
  benchmarkParticipation,
  canManage,
  saved,
  errorMessage,
}: OrganizationSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          Settings for {organizationName}. Lifecycle defaults and user management will expand in
          later phases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canManage ? (
          <form action={updateOrganizationSettings} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industryType">Industry type</Label>
              <select
                id="industryType"
                name="industryType"
                required
                defaultValue={industryType}
                className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <input
                id="benchmarkParticipation"
                name="benchmarkParticipation"
                type="checkbox"
                defaultChecked={benchmarkParticipation}
                className="mt-1 h-4 w-4 rounded border-input"
              />
              <div className="space-y-1">
                <Label htmlFor="benchmarkParticipation" className="cursor-pointer">
                  Participate in industry benchmarking
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, your anonymized lifecycle metrics contribute to industry
                  benchmarks and you can view benchmark results. Opting out is reciprocal — you
                  will not receive benchmark data if you do not contribute.
                </p>
              </div>
            </div>

            {saved && <p className="text-sm text-green-600">Settings saved.</p>}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            <Button type="submit">Save organization settings</Button>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Industry type</dt>
              <dd className="font-medium capitalize">{industryType.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Benchmark participation</dt>
              <dd className="font-medium">
                {benchmarkParticipation ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Only organization owners and admins can change these settings.
            </p>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
