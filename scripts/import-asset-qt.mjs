/**
 * Import Lifecycle Management Asset QT CSV into the database.
 *
 * Each row's `acc.Account Name` maps to a tenant organization when using
 * `--all-accounts`. Single-organization import remains available via
 * ORGANIZATION_ID + optional `--account` filter.
 *
 * Usage:
 *   SUPABASE_SECRET_KEY=... npm run db:import-qt -- --all-accounts
 *   SUPABASE_SECRET_KEY=... npm run db:import-qt -- --all-accounts --replace
 *   ORGANIZATION_ID=<uuid> npm run db:import-qt -- --account "University of Utah"
 *
 * Auth fallback (single org only): IMPORT_EMAIL + IMPORT_PASSWORD
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const importEmail = process.env.IMPORT_EMAIL;
const importPassword = process.env.IMPORT_PASSWORD;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;

const args = process.argv.slice(2);
let organizationId = process.env.ORGANIZATION_ID;
let csvPath = resolve("data/Lifecycle_Management_Asset_QT.csv");
let accountFilter = null;
let replaceExisting = false;
let allAccounts = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--file") {
    csvPath = resolve(args[++i] ?? csvPath);
  } else if (arg === "--account") {
    accountFilter = args[++i] ?? null;
  } else if (arg === "--replace") {
    replaceExisting = true;
  } else if (arg === "--all-accounts") {
    allAccounts = true;
  } else if (!arg.startsWith("-") && !organizationId) {
    organizationId = arg;
  }
}

if (!url) {
  console.error("Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL).");
  process.exit(1);
}

if (allAccounts && !serviceRoleKey) {
  console.error("--all-accounts requires SUPABASE_SECRET_KEY (service role) to create organizations.");
  process.exit(1);
}

if (!allAccounts && !serviceRoleKey && !(importEmail && importPassword)) {
  console.error(
    "Missing credentials. Set SUPABASE_SECRET_KEY, or IMPORT_EMAIL + IMPORT_PASSWORD for single-org import.",
  );
  process.exit(1);
}

if (!allAccounts && !organizationId) {
  console.error("Provide ORGANIZATION_ID, or use --all-accounts to import every account in the CSV.");
  process.exit(1);
}

const supabase = serviceRoleKey
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : createClient(url, anonKey);

if (!serviceRoleKey) {
  const { error } = await supabase.auth.signInWithPassword({
    email: importEmail,
    password: importPassword,
  });
  if (error) {
    console.error(`Sign-in failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`Using authenticated import as ${importEmail}`);
}

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

function parseInstallDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeMac(value) {
  if (!value) return null;
  return value.replace(/\./g, ":").toUpperCase();
}

function spaceKey(row) {
  return [
    row["Lifecycle Asset Type"],
    row["lm.Building Name"],
    row["lm.Room Name"],
    row["lm.Room Code"],
  ].join("|");
}

function spaceDisplayName(row) {
  const roomName = row["lm.Room Name"];
  const building = row["lm.Building Name"];
  const roomCode = row["lm.Room Code"];
  if (roomName) return roomName;
  if (building && roomCode) return `${building} ${roomCode}`;
  if (roomCode) return roomCode;
  return building || "Unnamed Space";
}

function refreshCycleYears(installDate, replacementYear) {
  if (!installDate || !replacementYear) return 7;
  const installYear = new Date(installDate).getFullYear();
  const year = Number.parseInt(String(replacementYear), 10);
  if (!Number.isFinite(year)) return 7;
  const cycle = year - installYear;
  return Math.min(30, Math.max(1, cycle));
}

function inferIndustryType(accountName) {
  const name = accountName.toLowerCase();
  if (
    name.includes("university") ||
    name.includes("college") ||
    name.includes("health care") ||
    name.includes("healthcare")
  ) {
    return "university";
  }
  if (
    name.includes("department of") ||
    name.includes("government") ||
    name.includes("state of") ||
    name.includes("county") ||
    name.includes("city of")
  ) {
    return "government";
  }
  if (name.includes("casino") || name.includes("resort") || name.includes("financial")) {
    return "corporate";
  }
  return "corporate";
}

async function clearOrganizationData(orgId) {
  await supabase.from("refresh_events").delete().eq("organization_id", orgId);
  await supabase.from("forecast_cost_components").delete().eq("organization_id", orgId);
  await supabase.from("assets").delete().eq("organization_id", orgId);
  await supabase.from("space_locations").delete().eq("organization_id", orgId);
  await supabase.from("spaces").delete().eq("organization_id", orgId);
  await supabase.from("physical_locations").delete().eq("organization_id", orgId);
  await supabase.from("buildings").delete().eq("organization_id", orgId);
  await supabase.from("campuses").delete().eq("organization_id", orgId);
}

async function findOrganizationByName(name) {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("name", name)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function createOrganization(name) {
  const industryType = inferIndustryType(name);
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      industry_type: industryType,
      benchmark_participation: true,
    })
    .select("id, name, industry_type")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function importAccountRecords(records, orgId, sourceAccount) {
  if (records.length === 0) {
    return { spaces: 0, assets: 0 };
  }

  const grouped = new Map();
  for (const row of records) {
    const key = spaceKey(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const campusName = "Main Campus";
  const { data: campus, error: campusError } = await supabase
    .from("campuses")
    .insert({ organization_id: orgId, name: campusName })
    .select("id")
    .single();
  if (campusError) throw new Error(campusError.message);

  const buildingIds = new Map();
  const locationIds = new Map();
  let assetCount = 0;

  for (const [, spaceRows] of grouped) {
    const sample = spaceRows[0];
    const buildingName = sample["lm.Building Name"] || "Unknown Building";
    const roomName = sample["lm.Room Name"] || sample["lm.Room Code"] || "Unknown Room";
    const roomCode = sample["lm.Room Code"] || roomName;

    if (!buildingIds.has(buildingName)) {
      const { data, error } = await supabase
        .from("buildings")
        .insert({
          organization_id: orgId,
          campus_id: campus.id,
          name: buildingName,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      buildingIds.set(buildingName, data.id);
    }

    const locationKey = `${buildingName}|${roomCode}`;
    if (!locationIds.has(locationKey)) {
      const { data, error } = await supabase
        .from("physical_locations")
        .insert({
          organization_id: orgId,
          building_id: buildingIds.get(buildingName),
          name: roomCode,
          location_type: "room",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      locationIds.set(locationKey, data.id);
    }

    const installDates = spaceRows
      .map((row) => parseInstallDate(row["Install Date"]))
      .filter(Boolean)
      .sort();
    const commissionedDate = installDates[0] ?? "2019-01-01";
    const replacementYears = spaceRows
      .map((row) => Number.parseInt(row["Replacement Year"], 10))
      .filter(Number.isFinite);
    const plannedRefreshYear = replacementYears.length ? Math.max(...replacementYears) : null;
    const refreshCycle = refreshCycleYears(commissionedDate, plannedRefreshYear);

    const { data: spaceRow, error: spaceError } = await supabase
      .from("spaces")
      .insert({
        organization_id: orgId,
        name: spaceDisplayName(sample),
        space_type: sample["Lifecycle Asset Type"] || "Unknown",
        commissioned_date: commissionedDate,
        refresh_cycle_years: refreshCycle,
        original_cost: 0,
        planning_status: "unplanned",
        planned_refresh_year: plannedRefreshYear,
      })
      .select("id")
      .single();
    if (spaceError) throw new Error(spaceError.message);

    const { error: linkError } = await supabase.from("space_locations").insert({
      organization_id: orgId,
      space_id: spaceRow.id,
      physical_location_id: locationIds.get(locationKey),
    });
    if (linkError) throw new Error(linkError.message);

    const commissionedYear = new Date(commissionedDate).getFullYear();
    const { error: forecastError } = await supabase.from("forecast_cost_components").insert({
      organization_id: orgId,
      space_id: spaceRow.id,
      asset_id: null,
      cost_basis: 0,
      cost_basis_date: commissionedDate,
      refresh_cycle_years: refreshCycle,
      recommended_replacement_year: plannedRefreshYear ?? commissionedYear + refreshCycle,
      inflation_rate: 0.034,
      forecast_amount: 0,
    });
    if (forecastError) throw new Error(forecastError.message);

    const { error: eventError } = await supabase.from("refresh_events").insert({
      organization_id: orgId,
      space_id: spaceRow.id,
      type: "initial_deployment",
      event_date: commissionedDate,
      description: `Initial deployment imported from Asset QT (${sourceAccount})`,
      cost: null,
    });
    if (eventError) throw new Error(eventError.message);

    const assetPayloads = spaceRows.map((row) => {
      const installDate = parseInstallDate(row["Install Date"]) ?? commissionedDate;
      const replacementYear = Number.parseInt(row["Replacement Year"], 10);
      const cycle = refreshCycleYears(
        installDate,
        Number.isFinite(replacementYear) ? replacementYear : null,
      );
      return {
        organization_id: orgId,
        space_id: spaceRow.id,
        manufacturer: row["al.Manufacturer"] || "",
        model_number: row["al.Model Number"] || "",
        category: row["al.Product Type"] || "",
        ip_address: row["al.IP Address"] || null,
        mac_address: normalizeMac(row["al.MAC Address"]),
        po_number: row["al.PO Number"] || null,
        install_date: installDate,
        cost: 0,
        refresh_cycle_years: cycle,
        status: "active",
      };
    });

    const chunkSize = 100;
    for (let i = 0; i < assetPayloads.length; i += chunkSize) {
      const chunk = assetPayloads.slice(i, i + chunkSize);
      const { error: assetError } = await supabase.from("assets").insert(chunk);
      if (assetError) throw new Error(assetError.message);
      assetCount += chunk.length;
    }
  }

  await supabase
    .from("organizations")
    .update({
      name: sourceAccount,
      industry_type: inferIndustryType(sourceAccount),
    })
    .eq("id", orgId);

  return { spaces: grouped.size, assets: assetCount };
}

async function importAllAccounts(records) {
  const byAccount = new Map();
  for (const row of records) {
    const account = row["acc.Account Name"] || "Unknown Account";
    if (!byAccount.has(account)) byAccount.set(account, []);
    byAccount.get(account).push(row);
  }

  console.log(`Importing ${byAccount.size} accounts (${records.length} total assets)...`);

  const summary = [];

  for (const [accountName, accountRows] of [...byAccount.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    let org = await findOrganizationByName(accountName);

    if (org && replaceExisting) {
      console.log(`  Replacing existing data for "${accountName}" (${org.id})`);
      await clearOrganizationData(org.id);
    } else if (org && !replaceExisting) {
      const { count } = await supabase
        .from("spaces")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);
      if ((count ?? 0) > 0) {
        console.log(`  Skipping "${accountName}" — organization already has ${count} spaces (use --replace)`);
        summary.push({ accountName, orgId: org.id, spaces: 0, assets: 0, skipped: true });
        continue;
      }
    }

    if (!org) {
      org = await createOrganization(accountName);
      console.log(`  Created organization "${accountName}" (${org.id}, ${org.industry_type})`);
    }

    const result = await importAccountRecords(accountRows, org.id, accountName);
    console.log(
      `  Imported "${accountName}": ${result.spaces} spaces, ${result.assets} assets`,
    );
    summary.push({ accountName, orgId: org.id, ...result, skipped: false });
  }

  console.log("\nImport summary:");
  for (const row of summary) {
    if (row.skipped) {
      console.log(`  - ${row.accountName}: skipped`);
    } else {
      console.log(`  - ${row.accountName}: ${row.spaces} spaces, ${row.assets} assets (${row.orgId})`);
    }
  }

  const imported = summary.filter((row) => !row.skipped);
  const totalSpaces = imported.reduce((sum, row) => sum + row.spaces, 0);
  const totalAssets = imported.reduce((sum, row) => sum + row.assets, 0);
  console.log(
    `\nDone: ${imported.length} accounts, ${totalSpaces} spaces, ${totalAssets} assets.`,
  );
}

async function importSingleOrganization(records, orgId, sourceAccount) {
  console.log(`Importing ${records.length} assets for "${sourceAccount}" into ${orgId}`);

  if (replaceExisting) {
    console.log("Clearing existing portfolio data...");
    await clearOrganizationData(orgId);
  } else {
    const { count } = await supabase
      .from("spaces")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    if ((count ?? 0) > 0) {
      throw new Error(
        "Organization already has spaces. Re-run with --replace to replace existing portfolio data.",
      );
    }
  }

  const result = await importAccountRecords(records, orgId, sourceAccount);
  console.log(`Imported ${result.spaces} spaces and ${result.assets} assets for "${sourceAccount}".`);
}

async function main() {
  const raw = readFileSync(csvPath, "utf8");
  let records = parseCsv(raw);

  const accounts = [...new Set(records.map((r) => r["acc.Account Name"]).filter(Boolean))];
  console.log(`CSV: ${records.length} assets across ${accounts.length} accounts`);

  if (allAccounts) {
    if (accountFilter) {
      throw new Error("--all-accounts cannot be combined with --account");
    }
    await importAllAccounts(records);
    return;
  }

  if (accountFilter) {
    records = records.filter((r) => r["acc.Account Name"] === accountFilter);
    if (records.length === 0) {
      throw new Error(`No rows for "${accountFilter}". Available:\n  ${accounts.join("\n  ")}`);
    }
  } else if (accounts.length > 1) {
    throw new Error(
      `CSV has ${accounts.length} accounts. Use --all-accounts or --account:\n  ${accounts.join("\n  ")}`,
    );
  }

  const sourceAccount = accountFilter ?? accounts[0] ?? "Imported Portfolio";
  await importSingleOrganization(records, organizationId, sourceAccount);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
