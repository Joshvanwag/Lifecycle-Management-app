/**
 * Grants platform admin access to a user by email.
 * Platform admins can view all organizations and bypass benchmark contributor thresholds.
 *
 * Usage:
 *   node scripts/grant-platform-admin.mjs user@example.com
 *
 * Requires SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
 */

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/grant-platform-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const user = listData.users.find((entry) => entry.email?.toLowerCase() === email);

if (!user) {
  console.error(`No auth user found for ${email}`);
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: {
    ...user.app_metadata,
    platform_admin: true,
  },
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Granted platform_admin to ${data.user.email} (${data.user.id}).`);
console.log("The user must sign out and sign back in for JWT claims to refresh.");
