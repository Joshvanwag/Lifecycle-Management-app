import { createClient } from "@/lib/supabase/server";
import { writable } from "@/lib/supabase/writable";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function findOrCreateSpaceLocation(
  client: Client,
  organizationId: string,
  spaceId: string,
  location: { campus?: string; building?: string; room?: string },
) {
  const campusName = location.campus?.trim();
  const buildingName = location.building?.trim();
  const roomName = location.room?.trim();

  if (!campusName && !buildingName && !roomName) {
    return;
  }

  if (!campusName || !buildingName) {
    throw new Error("Campus and building are required when adding a location.");
  }

  let campusId: string;
  const { data: existingCampus } = await client
    .from("campuses")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", campusName)
    .maybeSingle();

  if (existingCampus) {
    campusId = (existingCampus as { id: string }).id;
  } else {
    const { data, error } = await writable(client.from("campuses"))
      .insert({ organization_id: organizationId, name: campusName })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create campus");
    }
    campusId = (data as { id: string }).id;
  }

  let buildingId: string;
  const { data: existingBuilding } = await client
    .from("buildings")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("campus_id", campusId)
    .eq("name", buildingName)
    .maybeSingle();

  if (existingBuilding) {
    buildingId = (existingBuilding as { id: string }).id;
  } else {
    const { data, error } = await writable(client.from("buildings"))
      .insert({
        organization_id: organizationId,
        campus_id: campusId,
        name: buildingName,
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create building");
    }
    buildingId = (data as { id: string }).id;
  }

  const locationName = roomName || buildingName;
  const { data: existingLocation } = await client
    .from("physical_locations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("building_id", buildingId)
    .eq("name", locationName)
    .maybeSingle();

  let physicalLocationId: string;
  if (existingLocation) {
    physicalLocationId = (existingLocation as { id: string }).id;
  } else {
    const { data, error } = await writable(client.from("physical_locations"))
      .insert({
        organization_id: organizationId,
        building_id: buildingId,
        name: locationName,
        location_type: roomName ? "room" : "building",
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create location");
    }
    physicalLocationId = (data as { id: string }).id;
  }

  const { error: linkError } = await writable(client.from("space_locations")).insert({
    organization_id: organizationId,
    space_id: spaceId,
    physical_location_id: physicalLocationId,
  });

  if (linkError) {
    throw new Error(linkError.message);
  }
}
