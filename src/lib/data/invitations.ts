import { createClient } from "@/lib/supabase/server";

export type InvitationPreview = {
  email: string;
  expires_at: string;
  is_valid: boolean;
  organization_name: string;
  role: "owner" | "admin" | "member" | "read_only";
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getInvitationPreview(
  supabase: ServerSupabaseClient,
  token: string,
): Promise<InvitationPreview | null> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        fn: "get_invitation_preview",
        args: { p_token: string },
      ) => Promise<{ data: InvitationPreview[] | null; error: { message: string } | null }>;
    }
  ).rpc("get_invitation_preview", { p_token: token });

  if (error || !data?.length) {
    return null;
  }

  return data[0] ?? null;
}
