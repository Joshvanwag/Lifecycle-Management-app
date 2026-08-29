export interface AssetInput {
  manufacturer: string;
  modelNumber: string;
  category: string;
  installDate: string;
  cost: number;
  refreshCycleYears: number;
}

export function parseMoney(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function parseYear(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1990 || parsed > 2100) {
    return null;
  }
  return parsed;
}

export function parsePositiveInt(
  value: FormDataEntryValue | number | null | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.round(parsed);
}

export function parseAssetsJson(value: FormDataEntryValue | null, fallbackCycle: number): AssetInput[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value)) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        const row = entry as Partial<AssetInput>;
        const manufacturer = String(row.manufacturer ?? "").trim();
        const modelNumber = String(row.modelNumber ?? "").trim();
        const category = String(row.category ?? "").trim();
        const installDate = String(row.installDate ?? "").trim();
        if (!manufacturer && !modelNumber && !category && !installDate) {
          return null;
        }
        return {
          manufacturer,
          modelNumber,
          category,
          installDate,
          cost: Number.isFinite(Number(row.cost)) && Number(row.cost) >= 0 ? Number(row.cost) : 0,
          refreshCycleYears: parsePositiveInt(row.refreshCycleYears ?? fallbackCycle, fallbackCycle),
        };
      })
      .filter((row): row is AssetInput => Boolean(row && row.installDate));
  } catch {
    return [];
  }
}
