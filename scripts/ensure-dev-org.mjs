/**
 * Ensures the DEV platform organization exists and optionally invites or adds a member.
 *
 * Usage:
 *   npm run db:ensure-dev-org
 *   npm run db:ensure-dev-org -- owner@example.com
 *
 * Requires SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
 */

import { createClient } from "@supabase/supabase-js";

const ownerEmail = (process.argv[2] ?? "vanwagenenjosh@gmail.com").trim().toLowerCase();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingDevOrg, error: devOrgLookupError } = await supabase
  .from("organizations")
  .select("id, name")
  .eq("is_dev_org", true)
  .maybeSingle();

if (devOrgLookupError) {
  console.error(devOrgLookupError.message);
  process.exit(1);
}

let devOrgId = existingDevOrg?.id;

if (!devOrgId) {
  const { data: createdDevOrg, error: createError } = await supabase
    .from("organizations")
    .insert({
      name: "DEV",
      industry_type: "other",
      benchmark_participation: false,
      is_dev_org: true,
    })
    .select("id, name")
    .single();

  if (createError || !createdDevOrg) {
    console.error(createError?.message ?? "Failed to create DEV organization.");
    process.exit(1);
  }

  devOrgId = createdDevOrg.id;
  console.log(`Created DEV organization (${createdDevOrg.id}).`);
} else {
  console.log(`DEV organization already exists (${devOrgId}).`);
}

const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const existingUser = userList.users.find((user) => user.email?.toLowerCase() === ownerEmail);

if (existingUser) {
  const { error: membershipError } = await supabase.from("organization_memberships").upsert(
    {
      organization_id: devOrgId,
      user_id: existingUser.id,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" },
  );

  if (membershipError) {
    console.error(membershipError.message);
    process.exit(1);
  }

  console.log(`Added ${ownerEmail} as DEV org owner.`);
} else {
  const { error: invitationError } = await supabase.from("organization_invitations").insert({
    organization_id: devOrgId,
    email: ownerEmail,
    role: "owner",
  });

  if (invitationError && !invitationError.message.includes("duplicate")) {
    console.error(invitationError.message);
    process.exit(1);
  }

  console.log(`Invitation created for ${ownerEmail}. Use the signup link to join DEV.`);
}

console.log("DEV org members can invite additional teammates from Settings or /admin.");
