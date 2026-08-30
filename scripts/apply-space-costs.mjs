/**
 * Apply Zoho Managed Units lump-sum costs onto Spaces.
 *
 * Source: data/Lifecycle_Managed_Units.csv (same extract as Zoho GLOBAL).
 * Writes spaces.original_cost from Total Initial Capital Cost.
 * Recomputes forecast_cost_components.forecast_amount with our inflation engine
 * (does not import Zoho Total Future Cost).
 *
 * Usage:
 *   node --env-file=.env.local scripts/apply-space-costs.mjs
 *   node --env-file=.env.local scripts/apply-space-costs.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const CSV_PATH = join(root, "data", "Lifecycle_Managed_Units.csv");

function loadEnvLocal() {
  const candidates = [resolve(root, ".env.local"), resolve(".env.local")];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) return;
  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const cleaned = line.replace(/^export\s+/, "");
    const index = cleaned.indexOf("=");
    if (index === -1) continue;
    const key = cleaned.slice(0, index).trim();
    let value = cleaned.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) process.env[key] = value;
  }
}

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      if (char === "\r") i++;
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.replace(/^\uFEFF/, "").trim());
  return dataRows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()])),
  );
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Load .env.local or set the variable.`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function futureValue(presentValue, annualRate, years) {
  if (years <= 0) return Math.round(presentValue * 100) / 100;
  return Math.round(presentValue * (1 + annualRate) ** years * 100) / 100;
}

function clean(value) {
  if (value == null) return "";
  return String(value).replace(/^\uFEFF/, "").trim();
}

function parseMoney(value) {
  const raw = clean(value).replace(/[$,]/g, "");
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function accountSlug(name) {
  return clean(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fillForward(rows, columns) {
  const last = Object.fromEntries(columns.map((c) => [c, ""]));
  return rows.map((row) => {
    const next = { ...row };
    for (const col of columns) {
      const value = clean(row[col]);
      if (value) last[col] = value;
      else next[col] = last[col];
    }
    return next;
  });
}

function locationKey(orgId, building, room) {
  return `${orgId}::${clean(building).toLowerCase()}::${clean(room).toLowerCase()}`;
}

async function fetchAll(table, columns) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

const parsed = parseCsv(readFileSync(CSV_PATH, "utf8"));

const filled = fillForward(parsed, ["Account Name", "Building Name", "Floor"]);

const { data: orgs, error: orgError } = await supabase
  .from("organizations")
  .select("id, name, default_inflation_rate");
if (orgError) throw orgError;

const spaceCountByOrg = new Map();
for (const space of await fetchAll("spaces", "id, organization_id")) {
  spaceCountByOrg.set(space.organization_id, (spaceCountByOrg.get(space.organization_id) ?? 0) + 1);
}

function pickPreferredOrg(candidates) {
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) => (spaceCountByOrg.get(b.id) ?? 0) - (spaceCountByOrg.get(a.id) ?? 0),
  )[0];
}

function resolveOrg(accountName) {
  const wanted = clean(accountName).toLowerCase();
  const slug = accountSlug(accountName);
  const byName = (orgs ?? []).filter((o) => o.name.toLowerCase() === wanted);
  if (byName.length) return pickPreferredOrg(byName);
  const bySlug = (orgs ?? []).filter((o) => accountSlug(o.name) === slug);
  return pickPreferredOrg(bySlug);
}

const spaces = await fetchAll(
  "spaces",
  "id, organization_id, name, original_cost, commissioned_date, refresh_cycle_years",
);

const { data: locationRows, error: locationError } = await supabase
  .from("space_locations")
  .select(
    `
    space_id,
    physical_locations (
      name,
      location_type,
      buildings ( name )
    )
  `,
  );
if (locationError) throw locationError;

const locationBySpace = new Map();
for (const row of locationRows ?? []) {
  if (!locationBySpace.has(row.space_id)) {
    locationBySpace.set(row.space_id, row.physical_locations);
  }
}

const spaceByRoomCode = new Map();
const spaceByRoomName = new Map();
const uniqueByRoom = new Map();
const roomCounts = new Map();
for (const space of spaces) {
  const location = locationBySpace.get(space.id);
  const building = location?.buildings?.name ?? "";
  const roomCode = location?.name ?? "";
  spaceByRoomCode.set(locationKey(space.organization_id, building, roomCode), space);
  spaceByRoomName.set(locationKey(space.organization_id, building, space.name), space);
  for (const room of [roomCode, space.name]) {
    if (!room) continue;
    const key = `${space.organization_id}::${clean(room).toLowerCase()}`;
    roomCounts.set(key, (roomCounts.get(key) ?? 0) + 1);
    uniqueByRoom.set(key, space);
  }
}

let matched = 0;
let unmatched = 0;
let updated = 0;
let skippedZero = 0;
const unmatchedSamples = [];

for (const row of filled) {
  const account = clean(row["Account Name"]);
  const org = resolveOrg(account);
  if (!org) {
    unmatched += 1;
    if (unmatchedSamples.length < 8) unmatchedSamples.push(`org:${account}`);
    continue;
  }

  const building = clean(row["Building Name"]);
  const roomCode = clean(row["Room Code"]);
  const roomName = clean(row["Room Name"]);
  const cost = parseMoney(row["Total Initial Capital Cost"]);
  if (cost <= 0) {
    skippedZero += 1;
    continue;
  }

  const buildingKey = building && building !== "-" ? building : "";
  const uniqueRoom =
    (roomCode && roomCounts.get(`${org.id}::${clean(roomCode).toLowerCase()}`) === 1
      ? uniqueByRoom.get(`${org.id}::${clean(roomCode).toLowerCase()}`)
      : null) ??
    (roomName && roomCounts.get(`${org.id}::${clean(roomName).toLowerCase()}`) === 1
      ? uniqueByRoom.get(`${org.id}::${clean(roomName).toLowerCase()}`)
      : null);
  const space =
    (buildingKey
      ? spaceByRoomCode.get(locationKey(org.id, buildingKey, roomCode)) ??
        spaceByRoomName.get(locationKey(org.id, buildingKey, roomName))
      : null) ?? uniqueRoom;
  if (!space) {
    unmatched += 1;
    if (unmatchedSamples.length < 12) {
      unmatchedSamples.push(`${org.name} / ${building} / ${roomName || roomCode}`);
    }
    continue;
  }

  matched += 1;
  const inflation = Number(org.default_inflation_rate) || 0.034;
  const commissionedDate = space.commissioned_date;
  const basisYear = new Date(`${commissionedDate}T00:00:00`).getFullYear();
  const cycle = space.refresh_cycle_years || 7;
  const replacementYear = basisYear + cycle;
  const forecastAmount = futureValue(cost, inflation, cycle);

  if (dryRun) continue;

  const { error: spaceError } = await supabase
    .from("spaces")
    .update({ original_cost: cost })
    .eq("id", space.id);
  if (spaceError) throw spaceError;

  const { data: components, error: compError } = await supabase
    .from("forecast_cost_components")
    .select("id")
    .eq("space_id", space.id)
    .is("asset_id", null);
  if (compError) throw compError;

  const lumpPayload = {
    cost_basis: cost,
    cost_basis_date: commissionedDate,
    refresh_cycle_years: cycle,
    recommended_replacement_year: replacementYear,
    inflation_rate: inflation,
    forecast_amount: forecastAmount,
  };

  if (components?.length) {
    const { error: updError } = await supabase
      .from("forecast_cost_components")
      .update(lumpPayload)
      .eq("id", components[0].id);
    if (updError) throw updError;
  } else {
    const { error: insError } = await supabase.from("forecast_cost_components").insert({
      organization_id: org.id,
      space_id: space.id,
      asset_id: null,
      ...lumpPayload,
    });
    if (insError) throw insError;
  }

  updated += 1;
}

console.log(
  JSON.stringify(
    {
      dryRun,
      csvRows: filled.length,
      matched,
      updated,
      unmatched,
      skippedZero,
      unmatchedSamples,
    },
    null,
    2,
  ),
);
