export const IMPORT_WORKFLOWS = ["add", "full_refresh", "partial_refresh", "correct"] as const;
export type ImportWorkflow = (typeof IMPORT_WORKFLOWS)[number];

export const IMPORT_FIELD_KEYS = [
  "space_name",
  "space_type",
  "campus",
  "building",
  "room",
  "commissioned_date",
  "space_refresh_cycle_years",
  "space_cost",
  "manufacturer",
  "model_number",
  "category",
  "serial_number",
  "ip_address",
  "mac_address",
  "install_date",
  "asset_cost",
  "asset_refresh_cycle_years",
  "replacement_year",
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELD_KEYS)[number];

export const IMPORT_FIELD_LABELS: Record<ImportFieldKey, string> = {
  space_name: "Space name",
  space_type: "Space type",
  campus: "Campus",
  building: "Building",
  room: "Room",
  commissioned_date: "Commissioned / refresh date",
  space_refresh_cycle_years: "Space refresh cycle (years)",
  space_cost: "Space cost",
  manufacturer: "Manufacturer",
  model_number: "Model",
  category: "Category",
  serial_number: "Serial number",
  ip_address: "IP address",
  mac_address: "MAC address",
  install_date: "Install date",
  asset_cost: "Asset cost",
  asset_refresh_cycle_years: "Asset refresh cycle (years)",
  replacement_year: "Replacement year",
};

const FIELD_ALIASES: Record<ImportFieldKey, string[]> = {
  space_name: ["space name", "space", "name", "room name", "lm.room name", "system name"],
  space_type: ["space type", "type", "lifecycle asset type", "lifecycleassettype"],
  campus: ["campus", "account", "account name", "acc.account name"],
  building: ["building", "building name", "lm.building name"],
  room: ["room", "room code", "lm.room code", "location"],
  commissioned_date: [
    "commissioned date",
    "commissioned",
    "refresh date",
    "event date",
    "install date",
  ],
  space_refresh_cycle_years: ["space refresh cycle", "refresh cycle", "cycle years"],
  space_cost: ["space cost", "original cost", "lump sum", "eq cost", "total cost"],
  manufacturer: ["manufacturer", "mfr", "make", "al.manufacturer"],
  model_number: ["model", "model number", "part number", "al.model", "al.part number"],
  category: ["category", "asset type", "product type", "al.category"],
  serial_number: ["serial", "serial number", "al.serial number"],
  ip_address: ["ip", "ip address", "al.ip address"],
  mac_address: ["mac", "mac address", "al.mac address"],
  install_date: ["install date", "installed", "al.install date"],
  asset_cost: ["asset cost", "cost", "price", "unit cost"],
  asset_refresh_cycle_years: ["asset refresh cycle", "asset cycle"],
  replacement_year: ["replacement year", "refresh year", "recommended year"],
};

export function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function suggestField(header: string): ImportFieldKey | "" {
  const normalized = normalizeHeader(header);
  for (const key of IMPORT_FIELD_KEYS) {
    if (FIELD_ALIASES[key].includes(normalized)) {
      return key;
    }
  }
  return "";
}

export function suggestColumnMap(headers: string[]): Record<string, ImportFieldKey | ""> {
  const used = new Set<ImportFieldKey>();
  const map: Record<string, ImportFieldKey | ""> = {};

  for (const header of headers) {
    const suggested = suggestField(header);
    if (suggested && !used.has(suggested)) {
      map[header] = suggested;
      used.add(suggested);
    } else {
      map[header] = "";
    }
  }

  return map;
}

export function workflowLabel(workflow: ImportWorkflow): string {
  switch (workflow) {
    case "add":
      return "Add New Spaces";
    case "full_refresh":
      return "Full Refresh";
    case "partial_refresh":
      return "Partial Refresh";
    case "correct":
      return "Correct Inventory";
  }
}

export function workflowDescription(workflow: ImportWorkflow): string {
  switch (workflow) {
    case "add":
      return "Create new Spaces, locations, and equipment from a file. Each distinct Space name and location becomes a Space.";
    case "full_refresh":
      return "Retire every active asset in the selected Space and treat the file as the new inventory. Old and new rows are not matched.";
    case "partial_refresh":
      return "Select the assets being replaced, then upload the new equipment. The rest of the Space lifecycle stays in place.";
    case "correct":
      return "Fix manufacturer, model, serial, network, or cost data. Matching uses serial number, then MAC. No refresh event is created.";
  }
}

export function isImportWorkflow(value: string): value is ImportWorkflow {
  return (IMPORT_WORKFLOWS as readonly string[]).includes(value);
}

export function workflowFromSlug(slug: string): ImportWorkflow | null {
  const normalized = slug.replace(/-/g, "_");
  return isImportWorkflow(normalized) ? normalized : null;
}
