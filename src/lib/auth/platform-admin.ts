import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const userHasDevOrgAccess = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: "is_platform_admin") => Promise<{ data: boolean | null; error: { message: string } | null }>;
    }
  ).rpc("is_platform_admin");

  if (error) {
    return false;
  }

  return data === true;
});
