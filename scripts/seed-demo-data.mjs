/**
 * Seeds demo portfolio data into an organization using the service role key.
 *
 * Usage (after migrations are applied and a user has signed up):
 *   ORGANIZATION_ID=<uuid> npm run db:seed
 *
 * Requires a project URL and secret key in the environment.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const organizationId = process.argv[2] ?? process.env.ORGANIZATION_ID;

if (!url || !serviceRoleKey) {
  console.error("Missing project URL or secret key (SUPABASE_URL / SUPABASE_SECRET_KEY).");
  process.exit(1);
}

if (!organizationId) {
  console.error("Provide ORGANIZATION_ID as an env var or first CLI argument.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const spaces = [
  {
    key: "space-001",
    name: "Classroom 204",
    space_type: "Classroom",
    campus: "Main Campus",
    building: "Science Hall",
    room: "204",
    commissioned_date: "2017-08-15",
    refresh_cycle_years: 7,
    original_cost: 87500,
    planning_status: "scheduled",
    planned_refresh_year: 2031,
    forecast_amount: 112400,
  },
  {
    key: "space-002",
    name: "Executive Conference Room",
    space_type: "Conference Room",
    campus: "Main Campus",
    building: "Administration Building",
    room: "310",
    commissioned_date: "2019-06-01",
    refresh_cycle_years: 7,
    original_cost: 142000,
    planning_status: "scheduled",
    planned_refresh_year: 2026,
    forecast_amount: 178600,
  },
  {
    key: "space-003",
    name: "Auditorium Technology",
    space_type: "Auditorium",
    campus: "Main Campus",
    building: "Performing Arts Center",
    room: null,
    commissioned_date: "2014-06-01",
    refresh_cycle_years: 7,
    original_cost: 485000,
    planning_status: "deferred",
    planned_refresh_year: 2028,
    forecast_amount: 612000,
  },
  {
    key: "space-004",
    name: "Building Digital Signage",
    space_type: "Digital Signage",
    campus: "South Campus",
    building: "Student Union",
    room: null,
    commissioned_date: "2020-03-01",
    refresh_cycle_years: 7,
    original_cost: 96000,
    planning_status: "unplanned",
    planned_refresh_year: null,
    forecast_amount: 124800,
  },
  {
    key: "space-005",
    name: "Divisible Conference Suite",
    space_type: "Conference Room",
    campus: "Main Campus",
    building: "Business School",
    room: "201A–201C",
    commissioned_date: "2018-01-15",
    refresh_cycle_years: 7,
    original_cost: 198500,
    planning_status: "unplanned",
    planned_refresh_year: null,
    forecast_amount: 256200,
  },
  {
    key: "space-006",
    name: "Mobile Technology Fleet",
    space_type: "Mobile Fleet",
    campus: "District-wide",
    building: "District Operations",
    room: null,
    commissioned_date: "2022-01-01",
    refresh_cycle_years: 5,
    original_cost: 320000,
    planning_status: "scheduled",
    planned_refresh_year: 2027,
    forecast_amount: 368000,
  },
  {
    key: "space-007",
    name: "Huddle Room 105",
    space_type: "Huddle Room",
    campus: "North Campus",
    building: "Engineering Center",
    room: "105",
    commissioned_date: "2021-09-01",
    refresh_cycle_years: 7,
    original_cost: 28500,
    planning_status: "unplanned",
    planned_refresh_year: null,
    forecast_amount: 37200,
  },
  {
    key: "space-008",
    name: "Training Room B",
    space_type: "Training Room",
    campus: "Main Campus",
    building: "Library",
    room: "B12",
    commissioned_date: "2016-05-01",
    refresh_cycle_years: 7,
    original_cost: 54000,
    planning_status: "unplanned",
    planned_refresh_year: null,
    forecast_amount: 68200,
  },
];

const assets = [
  {
    spaceKey: "space-001",
    manufacturer: "Sony",
    model_number: "VPL-FHZ75",
    category: "Projector",
    serial_number: "SN-4482910",
    install_date: "2017-08-15",
    cost: 12500,
    refresh_cycle_years: 7,
  },
  {
    spaceKey: "space-001",
    manufacturer: "Crestron",
    model_number: "DM-NVX-363",
    category: "AV Switcher",
    serial_number: "CR-8839201",
    ip_address: "10.24.1.45",
    mac_address: "00:1A:2B:3C:4D:5E",
    install_date: "2017-08-15",
    cost: 3200,
    refresh_cycle_years: 7,
  },
  {
    spaceKey: "space-001",
    manufacturer: "QSC",
    model_number: "CX-Q 8K8",
    category: "Amplifier",
    install_date: "2017-08-15",
    cost: 0,
    refresh_cycle_years: 7,
  },
  {
    spaceKey: "space-001",
    manufacturer: "Samsung",
    model_number: "QM85R",
    category: "Display",
    serial_number: "SS-9920184",
    install_date: "2028-03-10",
    cost: 4800,
    refresh_cycle_years: 7,
  },
  {
    spaceKey: "space-002",
    manufacturer: "Cisco",
    model_number: "Room Kit Pro",
    category: "Video Conferencing",
    serial_number: "CS-7729100",
    ip_address: "10.12.4.88",
    install_date: "2019-06-01",
    cost: 28000,
    refresh_cycle_years: 7,
  },
  {
    spaceKey: "space-002",
    manufacturer: "LG",
    model_number: "86BH5F",
    category: "Display",
    install_date: "2019-06-01",
    cost: 6200,
    refresh_cycle_years: 7,
  },
];

const refreshEvents = [
  {
    spaceKey: "space-001",
    type: "initial_deployment",
    event_date: "2017-08-15",
    description: "Initial classroom technology deployment",
    cost: 87500,
  },
  {
    spaceKey: "space-001",
    type: "partial_refresh",
    event_date: "2028-03-10",
    description: "Display replaced — Samsung QM85R installed",
    cost: 4800,
  },
  {
    spaceKey: "space-002",
    type: "initial_deployment",
    event_date: "2019-06-01",
    description: "Executive conference room initial deployment",
    cost: 142000,
  },
  {
    spaceKey: "space-003",
    type: "full_refresh",
    event_date: "2022-01-20",
    description: "Full auditorium refresh — lighting and control systems",
    cost: 185000,
  },
];

async function main() {
  const { count: existingSpaces, error: countError } = await supabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (countError) {
    throw new Error(countError.message);
  }
  if ((existingSpaces ?? 0) > 0) {
    console.log("Organization already has spaces; skipping seed.");
    return;
  }

  const campusIds = new Map();
  const buildingIds = new Map();
  const locationIds = new Map();
  const spaceIds = new Map();

  for (const space of spaces) {
    if (!campusIds.has(space.campus)) {
      const { data, error } = await supabase
        .from("campuses")
        .insert({ organization_id: organizationId, name: space.campus })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      campusIds.set(space.campus, data.id);
    }

    const buildingKey = `${space.campus}:${space.building}`;
    if (!buildingIds.has(buildingKey)) {
      const { data, error } = await supabase
        .from("buildings")
        .insert({
          organization_id: organizationId,
          campus_id: campusIds.get(space.campus),
          name: space.building,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      buildingIds.set(buildingKey, data.id);
    }

    let physicalLocationId = null;
    if (space.room) {
      const locationKey = `${buildingKey}:${space.room}`;
      if (!locationIds.has(locationKey)) {
        const { data, error } = await supabase
          .from("physical_locations")
          .insert({
            organization_id: organizationId,
            building_id: buildingIds.get(buildingKey),
            name: space.room,
            location_type: "room",
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        locationIds.set(locationKey, data.id);
      }
      physicalLocationId = locationIds.get(locationKey);
    }

    const { data: spaceRow, error: spaceError } = await supabase
      .from("spaces")
      .insert({
        organization_id: organizationId,
        name: space.name,
        space_type: space.space_type,
        commissioned_date: space.commissioned_date,
        refresh_cycle_years: space.refresh_cycle_years,
        original_cost: space.original_cost,
        planning_status: space.planning_status,
        planned_refresh_year: space.planned_refresh_year,
      })
      .select("id")
      .single();
    if (spaceError) throw new Error(spaceError.message);
    spaceIds.set(space.key, spaceRow.id);

    if (physicalLocationId) {
      const { error: linkError } = await supabase.from("space_locations").insert({
        organization_id: organizationId,
        space_id: spaceRow.id,
        physical_location_id: physicalLocationId,
      });
      if (linkError) throw new Error(linkError.message);
    }

    const spaceAssets = assets.filter((asset) => asset.spaceKey === space.key);
    const pricedTotal = spaceAssets.reduce((sum, asset) => sum + (asset.cost > 0 ? asset.cost : 0), 0);
    const remainder = Math.max(0, space.original_cost - pricedTotal);
    const inflationRate = 0.034;
    const commissionedYear = new Date(space.commissioned_date).getFullYear();

    if (remainder > 0) {
      const recommendedReplacementYear = commissionedYear + space.refresh_cycle_years;
      const years = recommendedReplacementYear - commissionedYear;
      const { error: forecastError } = await supabase.from("forecast_cost_components").insert({
        organization_id: organizationId,
        space_id: spaceRow.id,
        asset_id: null,
        cost_basis: remainder,
        cost_basis_date: space.commissioned_date,
        refresh_cycle_years: space.refresh_cycle_years,
        recommended_replacement_year: recommendedReplacementYear,
        inflation_rate: inflationRate,
        forecast_amount: Math.round(remainder * (1 + inflationRate) ** years * 100) / 100,
      });
      if (forecastError) throw new Error(forecastError.message);
    }
  }

  for (const asset of assets) {
    const spaceId = spaceIds.get(asset.spaceKey);
    if (!spaceId) continue;

    const installYear = new Date(asset.install_date).getFullYear();
    const { data: assetRow, error: assetError } = await supabase
      .from("assets")
      .insert({
        organization_id: organizationId,
        space_id: spaceId,
        manufacturer: asset.manufacturer,
        model_number: asset.model_number,
        category: asset.category,
        serial_number: asset.serial_number ?? null,
        ip_address: asset.ip_address ?? null,
        mac_address: asset.mac_address ?? null,
        install_date: asset.install_date,
        cost: asset.cost,
        refresh_cycle_years: asset.refresh_cycle_years,
        status: "active",
      })
      .select("id")
      .single();
    if (assetError) throw new Error(assetError.message);

    if (asset.cost > 0) {
      const recommendedReplacementYear = installYear + asset.refresh_cycle_years;
      const years = recommendedReplacementYear - installYear;
      const inflationRate = 0.034;
      const { error: assetForecastError } = await supabase.from("forecast_cost_components").insert({
        organization_id: organizationId,
        space_id: spaceId,
        asset_id: assetRow.id,
        cost_basis: asset.cost,
        cost_basis_date: asset.install_date,
        refresh_cycle_years: asset.refresh_cycle_years,
        recommended_replacement_year: recommendedReplacementYear,
        inflation_rate: inflationRate,
        forecast_amount: Math.round(asset.cost * (1 + inflationRate) ** years * 100) / 100,
      });
      if (assetForecastError) throw new Error(assetForecastError.message);
    }
  }

  for (const event of refreshEvents) {
    const spaceId = spaceIds.get(event.spaceKey);
    if (!spaceId) continue;

    const { error } = await supabase.from("refresh_events").insert({
      organization_id: organizationId,
      space_id: spaceId,
      type: event.type,
      event_date: event.event_date,
      description: event.description,
      cost: event.cost,
    });
    if (error) throw new Error(error.message);
  }

  await supabase
    .from("organizations")
    .update({ name: "University of Example" })
    .eq("id", organizationId);

  console.log(`Seeded ${spaces.length} spaces for organization ${organizationId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
