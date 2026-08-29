import type { User } from "@supabase/supabase-js";

export function isPlatformAdminUser(user: User): boolean {
  const appMetadata = user.app_metadata ?? {};
  return appMetadata.platform_admin === true;
}
