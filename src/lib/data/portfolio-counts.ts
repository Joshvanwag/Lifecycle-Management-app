import type { PlanningStatus, Space } from "@/lib/types";

export function computePortfolioCounts(spaces: Space[]) {
  const buildings = new Set<string>();
  const rooms = new Set<string>();
  let assetCount = 0;

  for (const space of spaces) {
    if (space.building) {
      buildings.add(`${space.organizationId}:${space.campus}:${space.building}`);
    }
    if (space.room) {
      rooms.add(`${space.organizationId}:${space.locationLabel}`);
    }
    assetCount += space.assetCount;
  }

  return {
    spaceCount: spaces.length,
    buildingCount: buildings.size,
    roomCount: rooms.size,
    assetCount,
  };
}

export function computePlanningSplit(spaces: Space[]): Array<{ name: PlanningStatus; value: number; amount: number }> {
  const counts: Record<PlanningStatus, { value: number; amount: number }> = {
    unplanned: { value: 0, amount: 0 },
    scheduled: { value: 0, amount: 0 },
    deferred: { value: 0, amount: 0 },
    completed: { value: 0, amount: 0 },
  };

  for (const space of spaces) {
    counts[space.planningStatus].value += 1;
    counts[space.planningStatus].amount += space.forecastAmount;
  }

  return (Object.keys(counts) as PlanningStatus[])
    .map((name) => ({ name, ...counts[name] }))
    .filter((slice) => slice.value > 0);
}

export function hasEmptyPortfolioCosts(spaces: Space[]): boolean {
  return spaces.length > 0 && spaces.every((space) => space.originalCost === 0);
}
